"""
Bridges the ORM layer and the pure prediction engine (app.prediction.*).

Given a Train + its latest TrainPosition, this builds the feature inputs
the engine needs, calls it, and returns both:
  - a full route timeline (departed / current / upcoming, each annotated)
  - a list of ETA predictions for just the upcoming stations

It also persists a Prediction row per upcoming station on each call so the
admin dashboard has a running history to compute MAE/RMSE against once
stations are actually reached (see analytics.py).
"""
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.models import Train, TrainPosition, RouteStop, Prediction, Station
from app.prediction.eta_engine import predict_upcoming_stations, StationETAResult
from app.schemas.schemas import RouteStopOut, ETAStationOut, StationOut


def _minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def get_latest_position(db: Session, train_id: int) -> Optional[TrainPosition]:
    return (
        db.query(TrainPosition)
        .filter(TrainPosition.train_id == train_id)
        .order_by(TrainPosition.timestamp.desc())
        .first()
    )


def compute_eta_and_timeline(
    db: Session, train: Train, persist: bool = True
) -> Tuple[List[RouteStopOut], List[ETAStationOut]]:
    stops: List[RouteStop] = list(train.routes)
    position = get_latest_position(db, train.id)

    route_out: List[RouteStopOut] = []
    upcoming_payload = []
    upcoming_stop_objs: List[RouteStop] = []

    if position is None:
        # No telemetry yet — everything is "upcoming" per schedule only.
        for stop in stops:
            route_out.append(
                RouteStopOut(
                    station=StationOut.model_validate(stop.station),
                    sequence=stop.sequence,
                    scheduled_arrival=stop.scheduled_arrival,
                    scheduled_departure=stop.scheduled_departure,
                    distance_from_origin_km=stop.distance_from_origin_km,
                    status="upcoming",
                )
            )
        return route_out, []

    # Find index of the "next" station in the ordered stop list.
    next_idx = next(
        (i for i, s in enumerate(stops) if s.station.station_code == position.next_station_code),
        len(stops) - 1,
    )

    data_freshness = max((datetime.utcnow() - position.timestamp).total_seconds(), 1.0)
    recent_trend = round(position.current_delay_minutes * 0.15, 2)  # simple proxy: bigger current delay => trend continues
    prev_station_delay = position.current_delay_minutes

    eta_results: List[StationETAResult] = []
    if next_idx < len(stops):
        for i in range(next_idx, len(stops)):
            stop = stops[i]
            upcoming_stop_objs.append(stop)
            prev_dist = stops[i - 1].distance_from_origin_km if i > 0 else 0.0
            upcoming_payload.append(
                {
                    "station_code": stop.station.station_code,
                    "station_name": stop.station.station_name,
                    "scheduled_arrival": stop.scheduled_arrival,
                    "distance_from_origin_km": stop.distance_from_origin_km,
                    "avg_dwell_minutes": stop.avg_dwell_minutes,
                    "historical_avg_delay_minutes": stop.historical_avg_delay_minutes,
                    "historical_delay_stddev": stop.historical_delay_stddev,
                    "historical_avg_travel_time_minutes": round(
                        ((stop.distance_from_origin_km - prev_dist) / max(position.speed_kmh, 20)) * 60, 1
                    ),
                }
            )

        eta_results = predict_upcoming_stations(
            upcoming_stops=upcoming_payload,
            current_speed_kmh=position.speed_kmh,
            previous_speed_kmh=position.prev_speed_kmh,
            current_delay_minutes=position.current_delay_minutes,
            previous_station_delay_minutes=prev_station_delay,
            distance_to_first_stop_km=position.distance_to_next_km,
            recent_delay_trend=recent_trend,
            data_freshness_seconds=data_freshness,
        )

    eta_by_code = {r.station_code: r for r in eta_results}

    for i, stop in enumerate(stops):
        code = stop.station.station_code
        if i < next_idx:
            status = "departed"
        elif i == next_idx:
            status = "current"
        else:
            status = "upcoming"

        eta = eta_by_code.get(code)
        route_out.append(
            RouteStopOut(
                station=StationOut.model_validate(stop.station),
                sequence=stop.sequence,
                scheduled_arrival=stop.scheduled_arrival,
                scheduled_departure=stop.scheduled_departure,
                distance_from_origin_km=stop.distance_from_origin_km,
                status=status,
                predicted_time=eta.predicted_arrival if eta else None,
                delay_minutes=eta.delay_minutes if eta else (position.current_delay_minutes if status != "upcoming" else None),
                confidence=eta.confidence if eta else None,
                confidence_label=eta.confidence_label if eta else None,
            )
        )

    eta_out = [
        ETAStationOut(
            station_code=r.station_code,
            station_name=r.station_name,
            scheduled_arrival=r.scheduled_arrival,
            predicted_arrival=r.predicted_arrival,
            predicted_arrival_optimistic=r.predicted_arrival_optimistic,
            predicted_arrival_pessimistic=r.predicted_arrival_pessimistic,
            delay_minutes=r.delay_minutes,
            confidence=r.confidence,
            confidence_label=r.confidence_label,
            explanation=r.explanation,
        )
        for r in eta_results
    ]

    if persist and eta_results:
        for stop, result in zip(upcoming_stop_objs, eta_results):
            db.add(
                Prediction(
                    train_id=train.id,
                    station_id=stop.station_id,
                    scheduled_arrival=result.scheduled_arrival,
                    predicted_arrival=result.predicted_arrival,
                    predicted_arrival_optimistic=result.predicted_arrival_optimistic,
                    predicted_arrival_pessimistic=result.predicted_arrival_pessimistic,
                    delay_minutes=result.delay_minutes,
                    confidence=result.confidence,
                    confidence_label=result.confidence_label,
                    explanation=result.explanation,
                )
            )
        db.commit()

    return route_out, eta_out
