from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import AlertOut
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/me", response_model=List[AlertOut])
def my_alerts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return sorted(user.alerts, key=lambda a: a.created_at, reverse=True)[:100]
