"""
Feature extraction for the RailPulse ETA prediction engine.

This module turns raw train-position + route data into the flat feature
set consumed by delay_model.py. Keeping this isolated means the same
feature pipeline can later feed a trained ML model (see train_model.py)
without touching the rest of the system.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ETAFeatures:
    current_speed_kmh: float
    previous_speed_kmh: float
    acceleration_kmh_per_min: float
    distance_to_station_km: float
    current_delay_minutes: float
    previous_station_delay_minutes: float
    historical_avg_delay_minutes: float
    historical_delay_stddev: float
    historical_avg_travel_time_minutes: float
    dwell_time_minutes: float
    day_of_week: int          # 0=Monday
    hour_of_day: int
    recent_delay_trend: float  # positive => delay increasing
    data_freshness_seconds: float


def build_features(
    *,
    current_speed_kmh: float,
    previous_speed_kmh: float,
    distance_to_station_km: float,
    current_delay_minutes: float,
    previous_station_delay_minutes: float,
    historical_avg_delay_minutes: float,
    historical_delay_stddev: float,
    historical_avg_travel_time_minutes: float,
    dwell_time_minutes: float,
    recent_delay_trend: float,
    data_freshness_seconds: float,
    at_time: Optional[datetime] = None,
) -> ETAFeatures:
    at_time = at_time or datetime.utcnow()
    minutes_elapsed = max(data_freshness_seconds / 60.0, 0.1)
    acceleration = (current_speed_kmh - previous_speed_kmh) / minutes_elapsed

    return ETAFeatures(
        current_speed_kmh=current_speed_kmh,
        previous_speed_kmh=previous_speed_kmh,
        acceleration_kmh_per_min=acceleration,
        distance_to_station_km=distance_to_station_km,
        current_delay_minutes=current_delay_minutes,
        previous_station_delay_minutes=previous_station_delay_minutes,
        historical_avg_delay_minutes=historical_avg_delay_minutes,
        historical_delay_stddev=historical_delay_stddev,
        historical_avg_travel_time_minutes=historical_avg_travel_time_minutes,
        dwell_time_minutes=dwell_time_minutes,
        day_of_week=at_time.weekday(),
        hour_of_day=at_time.hour,
        recent_delay_trend=recent_delay_trend,
        data_freshness_seconds=data_freshness_seconds,
    )
