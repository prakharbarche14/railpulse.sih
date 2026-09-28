"""
Baseline, transparent delay/travel-time model.

This is deliberately a simple, explainable weighted model rather than a
black box — every SIH judge should be able to follow the arithmetic. The
architecture (see train_model.py) allows this to be swapped for a trained
XGBoost/LSTM model later: as long as the replacement exposes
`predict_remaining_minutes(features) -> (minutes, breakdown)` it is a
drop-in replacement wired up in eta_engine.py.
"""
from dataclasses import dataclass
from typing import Dict
from app.prediction.features import ETAFeatures

# Rush-hour-ish hours tend to run slower in Indian coaching-train sections.
CONGESTED_HOURS = {7, 8, 9, 17, 18, 19, 20}
WEEKEND_DAYS = {5, 6}  # Saturday, Sunday (0=Mon)


@dataclass
class DelayBreakdown:
    base_travel_minutes: float
    speed_adjustment_minutes: float
    historical_delay_adjustment_minutes: float
    dwell_minutes: float
    congestion_adjustment_minutes: float
    trend_adjustment_minutes: float
    total_minutes: float


def predict_remaining_minutes(features: ETAFeatures) -> DelayBreakdown:
    # 1. Base travel time driven by current speed vs. distance remaining.
    effective_speed = max(features.current_speed_kmh, 15.0)  # avoid divide-by-near-zero
    base_travel_minutes = (features.distance_to_station_km / effective_speed) * 60.0

    # 2. Speed trend adjustment: if the train is decelerating, add time;
    #    if accelerating, shave a little off (bounded so it can't dominate).
    speed_adjustment = -features.acceleration_kmh_per_min * 1.2
    speed_adjustment = max(min(speed_adjustment, 8.0), -5.0)

    # 3. Historical section/route delay pattern (regresses toward history
    #    for sections with sparse fresh data).
    historical_adjustment = 0.5 * features.historical_avg_delay_minutes

    # 4. Dwell time expected at the station itself (halts, platform time).
    dwell_minutes = features.dwell_time_minutes

    # 5. Time-of-day / day-of-week congestion nudge.
    congestion_adjustment = 0.0
    # (hour_of_day is approximate "now"; used only as a directional nudge)
    congestion_adjustment += 3.0 if features.hour_of_day in CONGESTED_HOURS else 0.0
    congestion_adjustment -= 1.5 if features.day_of_week in WEEKEND_DAYS else 0.0

    # 6. Recent delay trend: is the train losing or gaining time lately?
    trend_adjustment = features.recent_delay_trend * 0.6

    total = (
        base_travel_minutes
        + speed_adjustment
        + historical_adjustment
        + dwell_minutes
        + congestion_adjustment
        + trend_adjustment
    )
    total = max(total, 1.0)

    return DelayBreakdown(
        base_travel_minutes=round(base_travel_minutes, 2),
        speed_adjustment_minutes=round(speed_adjustment, 2),
        historical_delay_adjustment_minutes=round(historical_adjustment, 2),
        dwell_minutes=round(dwell_minutes, 2),
        congestion_adjustment_minutes=round(congestion_adjustment, 2),
        trend_adjustment_minutes=round(trend_adjustment, 2),
        total_minutes=round(total, 2),
    )


def explain_breakdown(breakdown: DelayBreakdown, features: ETAFeatures) -> str:
    """Produce a short, human-readable explanation of the dominant factor."""
    contributions: Dict[str, float] = {
        "a drop in average speed": abs(breakdown.speed_adjustment_minutes) if breakdown.speed_adjustment_minutes > 0 else 0,
        "extra dwell time at the last station": breakdown.dwell_minutes if breakdown.dwell_minutes > 3 else 0,
        "this section's historical delay pattern": breakdown.historical_delay_adjustment_minutes if breakdown.historical_delay_adjustment_minutes > 3 else 0,
        "peak-hour congestion on this route": breakdown.congestion_adjustment_minutes if breakdown.congestion_adjustment_minutes > 0 else 0,
        "a worsening recent delay trend": breakdown.trend_adjustment_minutes if breakdown.trend_adjustment_minutes > 2 else 0,
        "an improving recent delay trend": -breakdown.trend_adjustment_minutes if breakdown.trend_adjustment_minutes < -2 else 0,
    }
    dominant = max(contributions.items(), key=lambda kv: kv[1])
    if dominant[1] <= 0:
        return "ETA is tracking close to schedule with no single dominant factor (simulated explanation)."

    if features.current_speed_kmh < features.previous_speed_kmh:
        speed_note = (
            f"average speed decreased from {features.previous_speed_kmh:.0f} km/h to "
            f"{features.current_speed_kmh:.0f} km/h"
        )
    else:
        speed_note = (
            f"average speed increased from {features.previous_speed_kmh:.0f} km/h to "
            f"{features.current_speed_kmh:.0f} km/h"
        )

    if dominant[0] == "a drop in average speed":
        return f"ETA shifted mainly because {speed_note} over the last update window (simulated explanation)."
    return f"ETA shifted mainly due to {dominant[0]} (simulated explanation)."
