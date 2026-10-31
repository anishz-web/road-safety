from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.models import District, RoadLocation, Alert
from backend.app.schemas.schemas import DistrictResponse

router = APIRouter(prefix="/api/districts", tags=["Districts"])

@router.get("", response_model=List[DistrictResponse])
def get_all_districts(db: Session = Depends(get_db)):
    return db.query(District).order_by(District.name).all()

@router.get("/{district_id}", response_model=DistrictResponse)
def get_district_by_id(district_id: int, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return district

@router.get("/{district_id}/summary")
def get_district_safety_summary(district_id: int, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    roads = db.query(RoadLocation).filter(RoadLocation.district_id == district_id).all()
    critical_count = sum(1 for r in roads if r.risk_level == "Critical")
    high_count = sum(1 for r in roads if r.risk_level == "High")
    med_count = sum(1 for r in roads if r.risk_level == "Medium")
    low_count = sum(1 for r in roads if r.risk_level == "Low")
    avg_risk = sum(r.risk_score for r in roads) / max(len(roads), 1)

    active_alerts = db.query(Alert).filter(Alert.district_id == district_id, Alert.is_acknowledged == False).count()

    return {
        "district": district,
        "total_monitored_locations": len(roads),
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": med_count,
        "low_count": low_count,
        "average_risk_score": round(avg_risk, 1),
        "active_alerts_count": active_alerts
    }

