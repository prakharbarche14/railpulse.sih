from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


# ---------- Auth ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Stations / Routes ----------

class StationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    station_code: str
    station_name: str
    latitude: float
    longitude: float


class RouteStopOut(BaseModel):
    station: StationOut
    sequence: int
    scheduled_arrival: Optional[str]
    scheduled_departure: Optional[str]
    distance_from_origin_km: float
    status: str  # departed / current / upcoming
    actual_time: Optional[str] = None
    predicted_time: Optional[str] = None
    delay_minutes: Optional[float] = None
    confidence: Optional[float] = None
    confidence_label: Optional[str] = None


# ---------- Trains ----------

class TrainOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    train_number: str
    train_name: str
    train_type: str
    is_demo: bool


class TrainPositionOut(BaseModel):
    latitude: float
    longitude: float
    speed_kmh: float
    prev_speed_kmh: float
    current_delay_minutes: float
    last_station_code: Optional[str]
    next_station_code: Optional[str]
    distance_to_next_km: float
    status: str
    timestamp: datetime
    seconds_ago: int = 0


class ETAStationOut(BaseModel):
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


class LiveTrainSummary(BaseModel):
    train_number: str
    train_name: str
    train_type: str
    current_location: str
    speed_kmh: float
    delay_minutes: float
    next_station: str
    predicted_eta: Optional[str]
    confidence_label: Optional[str]
    status: str


class TrainDetail(BaseModel):
    train: TrainOut
    position: Optional[TrainPositionOut]
    route: List[RouteStopOut]
    eta: List[ETAStationOut]


# ---------- Alerts ----------

class SubscribeRequest(BaseModel):
    pass


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    train_id: int
    alert_type: str
    message: str
    is_read: bool
    created_at: datetime


# ---------- Analytics / Admin ----------

class DashboardStats(BaseModel):
    active_trains: int
    on_time_pct: float
    delayed_pct: float
    average_delay_minutes: float
    prediction_accuracy_pct: float


class ModelPerformancePoint(BaseModel):
    label: str
    mae: float
    rmse: float
    accuracy_pct: float


class PredictionRecord(BaseModel):
    train_number: str
    station_name: str
    predicted_arrival: str
    actual_arrival: Optional[str]
    error_minutes: Optional[float]
    created_at: datetime


class AdminMetrics(BaseModel):
    total_tracked_trains: int
    active_predictions: int
    average_delay_minutes: float
    eta_accuracy_pct: float
    mean_absolute_error: float
    rmse: float
    data_freshness_seconds: float
    api_status: str
    model_version: str
    performance_over_time: List[ModelPerformancePoint]
    recent_predictions: List[PredictionRecord]
