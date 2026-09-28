"""
Confidence / reliability scoring for a given ETA prediction.

Confidence considers:
- freshness of the underlying train-position data
- historical prediction accuracy for this train/route (proxied here by
  the historical delay standard deviation — a noisier section is
  inherently harder to predict)
- distance remaining (predictions far out are less certain)
- volatility of recent delays (large recent swings reduce confidence)
- overall availability of data
"""
from dataclasses import dataclass
from app.prediction.features import ETAFeatures


@dataclass
class ConfidenceResult:
    score: float          # 0..1
    label: str            # High / Medium / Low
    spread_minutes: float  # +/- minutes used for optimistic/pessimistic bounds


def _label_for(score: float) -> str:
    if score >= 0.8:
        return "High"
    if score >= 0.55:
        return "Medium"
    return "Low"


def compute_confidence(features: ETAFeatures, data_available: bool = True) -> ConfidenceResult:
    if not data_available:
        return ConfidenceResult(score=0.25, label="Low", spread_minutes=15.0)

    score = 1.0

    # Freshness: data older than ~2 minutes starts eroding confidence.
    freshness_penalty = min(features.data_freshness_seconds / 300.0, 0.35)
    score -= freshness_penalty

    # Distance remaining: far-out predictions are inherently less certain.
    distance_penalty = min(features.distance_to_station_km / 400.0, 0.25)
    score -= distance_penalty

    # Historical volatility of this route/section.
    volatility_penalty = min(features.historical_delay_stddev / 30.0, 0.25)
    score -= volatility_penalty

    # Sudden acceleration/deceleration adds uncertainty.
    accel_penalty = min(abs(features.acceleration_kmh_per_min) / 20.0, 0.15)
    score -= accel_penalty

    score = max(min(score, 0.97), 0.15)

    # Spread for optimistic/pessimistic bounds scales inversely with confidence.
    spread = round(3.0 + (1.0 - score) * 18.0, 1)

    return ConfidenceResult(score=round(score, 2), label=_label_for(score), spread_minutes=spread)
