import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    passenger = "passenger"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.passenger, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    alerts = relationship("Alert", back_populates="user")


class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, unique=True, index=True, nullable=False)
    train_name = Column(String, nullable=False)
    train_type = Column(String, default="Express")  # Rajdhani, Shatabdi, Express...
    origin_station_code = Column(String)
    destination_station_code = Column(String)
    is_demo = Column(Boolean, default=True)

    routes = relationship("RouteStop", back_populates="train", order_by="RouteStop.sequence")
    positions = relationship("TrainPosition", back_populates="train")
    predictions = relationship("Prediction", back_populates="train")


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String, unique=True, index=True, nullable=False)
    station_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)


class RouteStop(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    scheduled_arrival = Column(String)    # "HH:MM" offset time-of-day for demo simplicity
    scheduled_departure = Column(String)
    distance_from_origin_km = Column(Float, default=0.0)
    avg_dwell_minutes = Column(Float, default=2.0)
    historical_avg_delay_minutes = Column(Float, default=5.0)
    historical_delay_stddev = Column(Float, default=3.0)

    train = relationship("Train", back_populates="routes")
    station = relationship("Station")


class TrainPosition(Base):
    __tablename__ = "train_positions"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    prev_speed_kmh = Column(Float, default=0.0)
    current_delay_minutes = Column(Float, default=0.0)
    last_station_code = Column(String)
    next_station_code = Column(String)
    distance_to_next_km = Column(Float, default=0.0)
    status = Column(String, default="running")  # running, halted, arrived, not_started
    timestamp = Column(DateTime, default=datetime.utcnow)

    train = relationship("Train", back_populates="positions")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    scheduled_arrival = Column(String)
    predicted_arrival = Column(String)
    predicted_arrival_optimistic = Column(String)
    predicted_arrival_pessimistic = Column(String)
    delay_minutes = Column(Float, default=0.0)
    confidence = Column(Float, default=0.5)
    confidence_label = Column(String, default="Medium")
    explanation = Column(Text, default="")
    is_actual = Column(Boolean, default=False)   # true once the train has actually arrived
    actual_arrival = Column(String, nullable=True)
    error_minutes = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    train = relationship("Train", back_populates="predictions")
    station = relationship("Station")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    alert_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="alerts")
    train = relationship("Train")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
