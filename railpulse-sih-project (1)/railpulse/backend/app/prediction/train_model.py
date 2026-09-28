"""
Placeholder training script for a future learned ETA model.

RailPulse ships with a transparent, rule-based baseline (delay_model.py)
so it works well with almost no historical data — exactly the situation
at a hackathon demo. This script sketches how a data-driven model would
be trained once enough real train-movement history is collected, using
the same feature pipeline (features.py) so the swap is a drop-in
replacement inside eta_engine.py.

Run (once you have a real `training_data.csv` with the columns below):

    python -m app.prediction.train_model --data path/to/training_data.csv

Expected columns (one row per historical station arrival):
    current_speed_kmh, previous_speed_kmh, acceleration_kmh_per_min,
    distance_to_station_km, current_delay_minutes,
    previous_station_delay_minutes, historical_avg_delay_minutes,
    historical_delay_stddev, historical_avg_travel_time_minutes,
    dwell_time_minutes, day_of_week, hour_of_day, recent_delay_trend,
    data_freshness_seconds,
    actual_remaining_minutes   <- training label

If XGBoost is not installed, or no data file is supplied, this script
exits cleanly and the application continues using the baseline model —
RailPulse never hard-fails because a trained model is unavailable.
"""
import argparse
import os
import sys

FEATURE_COLUMNS = [
    "current_speed_kmh",
    "previous_speed_kmh",
    "acceleration_kmh_per_min",
    "distance_to_station_km",
    "current_delay_minutes",
    "previous_station_delay_minutes",
    "historical_avg_delay_minutes",
    "historical_delay_stddev",
    "historical_avg_travel_time_minutes",
    "dwell_time_minutes",
    "day_of_week",
    "hour_of_day",
    "recent_delay_trend",
    "data_freshness_seconds",
]
LABEL_COLUMN = "actual_remaining_minutes"
MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "model_artifacts", "eta_xgb_model.json")


def train(data_path: str) -> bool:
    try:
        import pandas as pd
        import xgboost as xgb
    except ImportError:
        print(
            "xgboost/pandas not installed. Skipping training — the app will "
            "keep using the transparent baseline model (delay_model.py)."
        )
        return False

    if not os.path.exists(data_path):
        print(f"No training data found at {data_path}. Skipping training.")
        return False

    df = pd.read_csv(data_path)
    missing = [c for c in FEATURE_COLUMNS + [LABEL_COLUMN] if c not in df.columns]
    if missing:
        print(f"Training data is missing columns: {missing}. Skipping training.")
        return False

    X = df[FEATURE_COLUMNS]
    y = df[LABEL_COLUMN]

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
    )
    model.fit(X, y)

    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    model.save_model(MODEL_OUTPUT_PATH)
    print(f"Model trained and saved to {MODEL_OUTPUT_PATH}")
    return True


def load_trained_model():
    """Returns a loaded XGBoost model, or None if unavailable (fallback to baseline)."""
    try:
        import xgboost as xgb
    except ImportError:
        return None
    if not os.path.exists(MODEL_OUTPUT_PATH):
        return None
    model = xgb.XGBRegressor()
    model.load_model(MODEL_OUTPUT_PATH)
    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the RailPulse ETA model (optional, future use).")
    parser.add_argument("--data", default="training_data.csv", help="Path to historical training data CSV")
    args = parser.parse_args()
    success = train(args.data)
    sys.exit(0 if success else 0)  # never fail the build over an optional step
