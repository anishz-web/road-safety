from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Alert, District, RoadLocation, User
from backend.app.schemas.schemas import AlertResponse, AlertAction
from backend.app.utils.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts and Notifications"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    district_id: Optional[int] = None,
    alert_level: Optional[str] = None,
    unacknowledged_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(
        Alert,
        District.name.label("district_name"),
        RoadLocation.road_name.label("road_name")
    ).join(District, Alert.district_id == District.id)\
     .outerjoin(RoadLocation, Alert.road_location_id == RoadLocation.id)

    if district_id:
        query = query.filter(Alert.district_id == district_id)
    if alert_level and alert_level != "All":
        query = query.filter(Alert.alert_level == alert_level)
    if unacknowledged_only:
        query = query.filter(Alert.is_acknowledged == False)

    results = query.order_by(Alert.created_at.desc()).all()
    out = []
    for alert, dname, rname in results:
        res = AlertResponse.from_orm(alert)
        res.district_name = dname
        res.road_name = rname
        out.append(res)
    return out

@router.post("/{alert_id}/action")
def process_alert_action(
    alert_id: int,
    payload: AlertAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    action = payload.action.lower()
    if action == "acknowledge":
        alert.is_acknowledged = True
        alert.acknowledged_by = current_user.id
    elif action == "dispatch":
        alert.is_acknowledged = True
        alert.acknowledged_by = current_user.id
        alert.dispatched_units = payload.dispatched_units or f"Traffic QRF Patrol Unit dispatched by {current_user.full_name}"

    db.commit()
    db.refresh(alert)
    return {"success": True, "alert": alert}

