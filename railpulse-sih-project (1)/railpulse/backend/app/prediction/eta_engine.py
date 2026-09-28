"""
Top-level ETA prediction engine.

Given a train's current position/telemetry and its scheduled route, this
computes a predicted arrival (with optimistic/pessimistic bounds,
confidence, and a plain-language explanation) for every upcoming station.

Predicted ETA = current estimated arrival time
                + predicted remaining travel time
                + predicted dwell/section delay

The engine is intentionally decoupled from the DB/ORM layer — it takes
plain values in and returns plain dataclasses/dicts out — so the same
engine can be unit tested (see backend/tests) and later swapped to call
a trained model instead of delay_model.py's baseline.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional

from app.prediction.features import build_features
from app.prediction.delay_model import predict_remaining_minutes, explain_breakdown
from app.prediction.confidence import compute_confidence


def _parse_hhmm(hhmm: str) -> timedelta:
    h, m = hhmm.split(":")
    return timedelta(hours=int(h), minutes=int(m))


def _fmt_minutes_as_hhmm(total_minutes: float) -> str:
    total_minutes = int(round(total_minutes)) % (24 * 60)
    h, m = divmod(total_minutes, 60)
    return f"{h:02d}:{m:02d}"


@dataclass
class StationETAResult:
    station_code: str
    station_name: str
    scheduled_arrival: Optional[str]
    predicted_arrival: str
    predicted_arrival_optimistic: str
    predicted_arrival_pessimistic: str
    delay_minutes: float
    confidence: float
    confidence_label: str
    explanation: str


def predict_upcoming_stations(
    *,
    upcoming_stops: List[dict],
    current_speed_kmh: float,
    previous_speed_kmh: float,
    current_delay_minutes: float,
    previous_station_delay_minutes: float,
    distance_to_first_stop_km: float,
    recent_delay_trend: float,
    data_freshness_seconds: float,
    now: Optional[datetime] = None,
) -> List[StationETAResult]:
    """
    upcoming_stops: ordered list of dicts, one per upcoming station, each with:
        station_code, station_name, scheduled_arrival ("HH:MM"),
        distance_from_origin_km, avg_dwell_minutes,
        historical_avg_delay_minutes, historical_delay_stddev,
        historical_avg_travel_time_minutes (leg from previous stop)
    """
    now = now or datetime.utcnow()
    results: List[StationETAResult] = []

    # Running "clock" — minutes since midnight for the predicted arrival at
    # the station currently being computed. Start from now + time needed to
    # reach the very first upcoming stop.
    clock_minutes = now.hour * 60 + now.minute

    remaining_distance = distance_to_first_stop_km
    cumulative_delay = current_delay_minutes
    prev_station_delay = previous_station_delay_minutes

    for idx, stop in enumerate(upcoming_stops):
        features = build_features(
            current_speed_kmh=current_speed_kmh,
            previous_speed_kmh=previous_speed_kmh,
            distance_to_station_km=remaining_distance,
            current_delay_minutes=cumulative_delay,
            previous_station_delay_minutes=prev_station_delay,
            historical_avg_delay_minutes=stop.get("historical_avg_delay_minutes", 5.0),
            historical_delay_stddev=stop.get("historical_delay_stddev", 3.0),
            historical_avg_travel_time_minutes=stop.get("historical_avg_travel_time_minutes", 30.0),
            dwell_time_minutes=stop.get("avg_dwell_minutes", 2.0),
            recent_delay_trend=recent_delay_trend,
            data_freshness_seconds=data_freshness_seconds,
            at_time=now,
        )

        breakdown = predict_remaining_minutes(features)
        confidence = compute_confidence(features, data_available=True)
        explanation = explain_breakdown(breakdown, features)

        clock_minutes += breakdown.total_minutes
        predicted_hhmm = _fmt_minutes_as_hhmm(clock_minutes)
        optimistic_hhmm = _fmt_minutes_as_hhmm(clock_minutes - confidence.spread_minutes)
        pessimistic_hhmm = _fmt_minutes_as_hhmm(clock_minutes + confidence.spread_minutes)

        scheduled = stop.get("scheduled_arrival")
        if scheduled:
            sched_minutes = _parse_hhmm(scheduled).total_seconds() / 60.0
            delay_minutes = round(clock_minutes - sched_minutes, 1)
        else:
            delay_minutes = round(cumulative_delay, 1)

        results.append(
            StationETAResult(
                station_code=stop["station_code"],
                station_name=stop["station_name"],
                scheduled_arrival=scheduled,
                predicted_arrival=predicted_hhmm,
                predicted_arrival_optimistic=optimistic_hhmm,
                predicted_arrival_pessimistic=pessimistic_hhmm,
                delay_minutes=delay_minutes,
                confidence=confidence.score,
                confidence_label=confidence.label,
                explanation=explanation,
            )
        )

        # Prep for next station in the loop: dwell adds to the clock too,
        # cumulative delay compounds slightly, distance resets to the next leg.
        prev_station_delay = delay_minutes
        cumulative_delay = delay_minutes
        if idx + 1 < len(upcoming_stops):
            remaining_distance = (
                upcoming_stops[idx + 1]["distance_from_origin_km"] - stop["distance_from_origin_km"]
            )

    return results
