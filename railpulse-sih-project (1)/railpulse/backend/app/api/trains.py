from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.models import Train, RouteStop, Station, Subscription, User
from app.schemas.schemas import (
    TrainOut, TrainDetail, TrainPositionOut, LiveTrainSummary,
    ETAStationOut,
)
from app.services.eta_service import compute_eta_and_timeline, get_latest_position
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/trains", tags=["trains"])


@router.get("", response_model=List[LiveTrainSummary])
def list_trains(
    q: Optional[str] = Query(None, description="Search by train number, name, station, or type"),
    db: Session = Depends(get_db),
):
    query = db.query(Train)
    if q:
        like = f"%{q}%"
        matching_station_train_ids = (
            db.query(RouteStop.train_id)
            .join(Station, RouteStop.station_id == Station.id)
            .filter(or_(Station.station_name.ilike(like), Station.station_code.ilike(like)))
            .subquery()
        )
        query = query.filter(
            or_(
                Train.train_number.ilike(like),
                Train.train_name.ilike(like),
                Train.train_type.ilike(like),
                Train.id.in_(matching_station_train_ids),
            )
        )
    trains = query.all()

    results = []
    for train in trains:
        position = get_latest_position(db, train.id)
        stops = {s.station.station_code: s for s in train.routes}
        next_stop = stops.get(position.next_station_code) if position else None
        _, eta = compute_eta_and_timeline(db, train, persist=False)
        next_eta = eta[0] if eta else None

        results.append(
            LiveTrainSummary(
                train_number=train.train_number,
                train_name=train.train_name,
                train_type=train.train_type,
                current_location=(
                    f"{position.last_station_code} → {position.next_station_code}"
                    if position else "Not started"
                ),
                speed_kmh=position.speed_kmh if position else 0.0,
                delay_minutes=position.current_delay_minutes if position else 0.0,
                next_station=next_stop.station.station_name if next_stop else "—",
                predicted_eta=next_eta.predicted_arrival if next_eta else None,
                confidence_label=next_eta.confidence_label if next_eta else None,
                status=position.status if position else "not_started",
            )
        )
    return results


@router.get("/{train_number}", response_model=TrainDetail)
def get_train_detail(train_number: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.train_number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    position = get_latest_position(db, train.id)
    route, eta = compute_eta_and_timeline(db, train)

    position_out = None
    if position:
        seconds_ago = int((datetime.utcnow() - position.timestamp).total_seconds())
        position_out = TrainPositionOut(
            latitude=position.latitude,
            longitude=position.longitude,
            speed_kmh=position.speed_kmh,
            prev_speed_kmh=position.prev_speed_kmh,
            current_delay_minutes=position.current_delay_minutes,
            last_station_code=position.last_station_code,
            next_station_code=position.next_station_code,
            distance_to_next_km=position.distance_to_next_km,
            status=position.status,
            timestamp=position.timestamp,
            seconds_ago=seconds_ago,
        )

    return TrainDetail(
        train=TrainOut.model_validate(train),
        position=position_out,
        route=route,
        eta=eta,
    )


@router.get("/{train_number}/route")
def get_route(train_number: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.train_number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    route, _ = compute_eta_and_timeline(db, train, persist=False)
    return route


@router.get("/{train_number}/position", response_model=TrainPositionOut)
def get_position(train_number: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.train_number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    position = get_latest_position(db, train.id)
    if not position:
        raise HTTPException(status_code=404, detail="No position data yet for this train")
    seconds_ago = int((datetime.utcnow() - position.timestamp).total_seconds())
    return TrainPositionOut(
        latitude=position.latitude,
        longitude=position.longitude,
        speed_kmh=position.speed_kmh,
        prev_speed_kmh=position.prev_speed_kmh,
        current_delay_minutes=position.current_delay_minutes,
        last_station_code=position.last_station_code,
        next_station_code=position.next_station_code,
        distance_to_next_km=position.distance_to_next_km,
        status=position.status,
        timestamp=position.timestamp,
        seconds_ago=seconds_ago,
    )


@router.get("/{train_number}/eta", response_model=List[ETAStationOut])
def get_eta(train_number: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.train_number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    _, eta = compute_eta_and_timeline(db, train, persist=False)
    return eta


@router.get("/{train_number}/predictions")
def get_predictions(train_number: str, limit: int = 50, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.train_number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    preds = (
        sorted(train.predictions, key=lambda p: p.created_at, reverse=True)[:limit]
    )
    return [
        {
            "station": p.station.station_name,
            "scheduled_arrival": p.scheduled_arrival,
            "predicted_arrival": p.predicted_arrival,
            "delay_minutes": p.delay_minutes,
            "confidence": p.confidence,
            "confidence_label": p.confidence_label,
            "explanation": p.explanation,
            "created_at": p.created_at,
        }
        for p in preds
    ]


@router.post("/{train_number}/subscribe")
def subscribe(train_number: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    train = db.query(Train).filter(Train.train_number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    existing = (
        db.query(Subscription)
        .filter(Subscription.user_id == user.id, Subscription.train_id == train.id)
        .first()
    )
    if existing:
        return {"subscribed": True, "message": "Already subscribed"}

    db.add(Subscription(user_id=user.id, train_id=train.id))
    db.commit()
    return {"subscribed": True, "message": f"Subscribed to alerts for {train.train_name}"}


@router.delete("/{train_number}/subscribe")
def unsubscribe(train_number: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    train = db.query(Train).filter(Train.train_number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == user.id, Subscription.train_id == train.id)
        .first()
    )
    if sub:
        db.delete(sub)
        db.commit()
    return {"subscribed": False}
