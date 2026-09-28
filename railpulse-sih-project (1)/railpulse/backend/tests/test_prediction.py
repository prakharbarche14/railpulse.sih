from datetime import datetime

from app.prediction.features import build_features
from app.prediction.delay_model import predict_remaining_minutes, explain_breakdown
from app.prediction.confidence import compute_confidence
from app.prediction.eta_engine import predict_upcoming_stations


def _sample_features(**overrides):
    defaults = dict(
        current_speed_kmh=70.0,
        previous_speed_kmh=74.0,
        distance_to_station_km=62.0,
        current_delay_minutes=17.0,
        previous_station_delay_minutes=13.0,
        historical_avg_delay_minutes=8.0,
        historical_delay_stddev=4.0,
        historical_avg_travel_time_minutes=55.0,
        dwell_time_minutes=3.0,
        recent_delay_trend=2.0,
        data_freshness_seconds=12.0,
        at_time=datetime(2026, 9, 4, 18, 0),
    )
    defaults.update(overrides)
    return build_features(**defaults)


def test_delay_model_produces_positive_travel_time():
    features = _sample_features()
    breakdown = predict_remaining_minutes(features)
    assert breakdown.total_minutes > 0
    assert breakdown.base_travel_minutes > 0


def test_delay_model_slower_speed_increases_time():
    fast = _sample_features(current_speed_kmh=90.0, previous_speed_kmh=90.0)
    slow = _sample_features(current_speed_kmh=40.0, previous_speed_kmh=90.0)
    fast_breakdown = predict_remaining_minutes(fast)
    slow_breakdown = predict_remaining_minutes(slow)
    assert slow_breakdown.total_minutes > fast_breakdown.total_minutes


def test_explanation_is_non_empty_string():
    features = _sample_features()
    breakdown = predict_remaining_minutes(features)
    explanation = explain_breakdown(breakdown, features)
    assert isinstance(explanation, str)
    assert len(explanation) > 10


def test_confidence_within_bounds():
    features = _sample_features()
    confidence = compute_confidence(features)
    assert 0.0 <= confidence.score <= 1.0
    assert confidence.label in {"High", "Medium", "Low"}


def test_confidence_drops_with_stale_data():
    fresh = _sample_features(data_freshness_seconds=5)
    stale = _sample_features(data_freshness_seconds=1200)
    fresh_conf = compute_confidence(fresh)
    stale_conf = compute_confidence(stale)
    assert stale_conf.score < fresh_conf.score


def test_confidence_zero_when_no_data():
    features = _sample_features()
    result = compute_confidence(features, data_available=False)
    assert result.label == "Low"
    assert result.score < 0.5


def test_predict_upcoming_stations_returns_increasing_times():
    stops = [
        {
            "station_code": "BINA",
            "station_name": "Bina Jn",
            "scheduled_arrival": "18:20",
            "distance_from_origin_km": 537,
            "avg_dwell_minutes": 3,
            "historical_avg_delay_minutes": 8,
            "historical_delay_stddev": 4,
            "historical_avg_travel_time_minutes": 60,
        },
        {
            "station_code": "VD",
            "station_name": "Vidisha",
            "scheduled_arrival": "19:35",
            "distance_from_origin_km": 600,
            "avg_dwell_minutes": 2,
            "historical_avg_delay_minutes": 6,
            "historical_delay_stddev": 3,
            "historical_avg_travel_time_minutes": 50,
        },
        {
            "station_code": "BPL",
            "station_name": "Bhopal Jn",
            "scheduled_arrival": "20:30",
            "distance_from_origin_km": 662,
            "avg_dwell_minutes": 5,
            "historical_avg_delay_minutes": 9,
            "historical_delay_stddev": 4,
            "historical_avg_travel_time_minutes": 45,
        },
    ]
    results = predict_upcoming_stations(
        upcoming_stops=stops,
        current_speed_kmh=74.0,
        previous_speed_kmh=78.0,
        current_delay_minutes=17.0,
        previous_station_delay_minutes=13.0,
        distance_to_first_stop_km=40.0,
        recent_delay_trend=2.0,
        data_freshness_seconds=12.0,
        now=datetime(2026, 9, 4, 17, 30),
    )
    assert len(results) == 3
    for r in results:
        assert r.confidence > 0
        assert r.predicted_arrival  # non-empty "HH:MM" string
        assert ":" in r.predicted_arrival
