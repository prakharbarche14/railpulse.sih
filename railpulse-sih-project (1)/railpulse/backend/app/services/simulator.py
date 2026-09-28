"""
Simulated railway telemetry engine for the RailPulse demo.

Because live Indian Railways position-feed access isn't available in this
environment, this background task fabricates plausible train movement —
speed fluctuation, station arrivals/dwell, occasional delay swings — and
persists a new TrainPosition row on every tick, then recomputes ETA
predictions and broadcasts the result over WebSocket to any subscribed
clients. Every payload this produces is generated locally, never claimed
to be a real live feed.

Swapping to a real data provider later means replacing only `_tick_train`
with a fetch from that provider — everything downstream (ETA engine,
WebSocket broadcast, alerts) stays the same.
"""
import asyncio
import random
from datetime import datetime
from typing import Dict

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.models import Train, TrainPosition, Alert, Subscription
from app.services.eta_service import compute_eta_and_timeline, get_latest_position
from app.websocket.manager import manager

TICK_SECONDS = 8
_arrived_ticks: Dict[int, int] = {}
_last_broadcast_eta: Dict[int, str] = {}


def _interpolate(a: float, b: float, t: float) -> float:
    return a + (b - a) * max(min(t, 1.0), 0.0)


async def run_simulator_loop():
    while True:
        try:
            db = SessionLocal()
            try:
                trains = db.query(Train).all()
                for train in trains:
                    await _tick_train(db, train)
            finally:
                db.close()
        except Exception as exc:  # pragma: no cover - defensive, demo must keep running
            print(f"[simulator] tick error: {exc}")
        await asyncio.sleep(TICK_SECONDS)


async def _tick_train(db: Session, train: Train):
    stops = list(train.routes)
    if not stops:
        return
    position = get_latest_position(db, train.id)
    if position is None:
        return

    # ---- Handle "arrived at final destination" loop-reset ----
    if position.status == "arrived":
        ticks = _arrived_ticks.get(train.id, 0) + 1
        _arrived_ticks[train.id] = ticks
        if ticks < 3:
            return  # sit at the terminus briefly before looping, like a real demo dashboard
        _arrived_ticks[train.id] = 0
        first, second = stops[0], stops[1] if len(stops) > 1 else stops[0]
        new_position = TrainPosition(
            train_id=train.id,
            latitude=first.station.latitude,
            longitude=first.station.longitude,
            speed_kmh=round(random.uniform(45, 80), 1),
            prev_speed_kmh=round(random.uniform(45, 80), 1),
            current_delay_minutes=round(random.uniform(0, 8), 1),
            last_station_code=first.station.station_code,
            next_station_code=second.station.station_code,
            distance_to_next_km=round(second.distance_from_origin_km - first.distance_from_origin_km, 1),
            status="running",
        )
        db.add(new_position)
        db.commit()
        await _broadcast_update(db, train, new_position, note="Train has restarted its journey (demo loop).")
        return

    stop_by_code = {s.station.station_code: s for s in stops}
    next_stop = stop_by_code.get(position.next_station_code)
    if next_stop is None:
        return
    prev_stop = stops[next_stop.sequence - 1] if next_stop.sequence > 0 else stops[0]

    # ---- Advance speed with small random fluctuation ----
    prev_speed = position.speed_kmh
    new_speed = prev_speed + random.uniform(-7, 7)
    new_speed = max(min(new_speed, 110.0), 18.0)

    # ---- Advance distance covered this tick ----
    advanced_km = new_speed * (TICK_SECONDS / 3600.0)
    new_distance_to_next = position.distance_to_next_km - advanced_km

    leg_km = max(next_stop.distance_from_origin_km - prev_stop.distance_from_origin_km, 0.1)
    progress = 1.0 - max(new_distance_to_next, 0.0) / leg_km

    # ---- Delay random-walk, gently mean-reverting toward the route's historical average ----
    hist_avg = next_stop.historical_avg_delay_minutes
    delay_step = random.uniform(-2.0, 2.5)
    reversion = (hist_avg - position.current_delay_minutes) * 0.05
    new_delay = position.current_delay_minutes + delay_step + reversion
    new_delay = max(min(new_delay, 60.0), 0.0)

    note = None

    if new_distance_to_next <= 0:
        # ---- Arrived at next_stop ----
        arrived_seq = next_stop.sequence
        if arrived_seq >= stops[-1].sequence:
            status = "arrived"
            lat, lon = next_stop.station.latitude, next_stop.station.longitude
            new_last, new_next = next_stop.station.station_code, next_stop.station.station_code
            new_dist_to_next = 0.0
            note = f"{train.train_name} has arrived at {next_stop.station.station_name}."
        else:
            status = "running"
            following = stops[arrived_seq + 1]
            lat, lon = next_stop.station.latitude, next_stop.station.longitude
            new_last, new_next = next_stop.station.station_code, following.station.station_code
            new_dist_to_next = round(following.distance_from_origin_km - next_stop.distance_from_origin_km, 1)
            note = f"{train.train_name} departed {next_stop.station.station_name}."
    else:
        status = "running"
        lat = _interpolate(prev_stop.station.latitude, next_stop.station.latitude, progress)
        lon = _interpolate(prev_stop.station.longitude, next_stop.station.longitude, progress)
        new_last, new_next = position.last_station_code, position.next_station_code
        new_dist_to_next = round(max(new_distance_to_next, 0.0), 1)

    new_position = TrainPosition(
        train_id=train.id,
        latitude=lat,
        longitude=lon,
        speed_kmh=round(new_speed, 1),
        prev_speed_kmh=round(prev_speed, 1),
        current_delay_minutes=round(new_delay, 1),
        last_station_code=new_last,
        next_station_code=new_next,
        distance_to_next_km=new_dist_to_next,
        status=status,
        timestamp=datetime.utcnow(),
    )
    db.add(new_position)
    db.commit()

    await _broadcast_update(db, train, new_position, note=note, prev_speed=prev_speed)


async def _broadcast_update(db: Session, train: Train, position: TrainPosition, note=None, prev_speed=None):
    route, eta = compute_eta_and_timeline(db, train)
    next_eta = eta[0] if eta else None

    if next_eta:
        prev_predicted = _last_broadcast_eta.get(train.id)
        if prev_predicted and prev_predicted != next_eta.predicted_arrival:
            _create_alert(
                db, train,
                alert_type="eta_changed",
                message=(
                    f"{train.train_name} is now expected at {next_eta.station_name} at "
                    f"{next_eta.predicted_arrival} instead of {prev_predicted}."
                ),
            )
        _last_broadcast_eta[train.id] = next_eta.predicted_arrival

    payload = {
        "type": "position_update",
        "train_number": train.train_number,
        "note": note,
        "position": {
            "latitude": position.latitude,
            "longitude": position.longitude,
            "speed_kmh": position.speed_kmh,
            "prev_speed_kmh": position.prev_speed_kmh if prev_speed is None else prev_speed,
            "current_delay_minutes": position.current_delay_minutes,
            "last_station_code": position.last_station_code,
            "next_station_code": position.next_station_code,
            "distance_to_next_km": position.distance_to_next_km,
            "status": position.status,
            "timestamp": position.timestamp.isoformat(),
        },
        "next_station_eta": next_eta.model_dump() if next_eta else None,
        "route": [r.model_dump() for r in route],
    }
    await manager.broadcast(train.train_number, payload)


def _create_alert(db: Session, train: Train, alert_type: str, message: str):
    subs = db.query(Subscription).filter(Subscription.train_id == train.id).all()
    for sub in subs:
        db.add(Alert(user_id=sub.user_id, train_id=train.id, alert_type=alert_type, message=message))
    if subs:
        db.commit()
