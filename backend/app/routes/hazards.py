import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import RoadHazard, RoadLocation, District
from backend.app.schemas.schemas import HazardResponse, HazardUpdateStatus
from backend.app.ai.vision_detector import VisionDetector

router = APIRouter(prefix="/api/hazards", tags=["Hazard Detection"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))

@router.get("", response_model=List[HazardResponse])
def get_hazards(
    district_id: Optional[int] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RoadHazard, RoadLocation.road_name.label("road_name"))\
              .join(RoadLocation, RoadHazard.road_location_id == RoadLocation.id)

    if district_id:
        query = query.filter(RoadLocation.district_id == district_id)
    if severity and severity != "All":
        query = query.filter(RoadHazard.severity == severity)
    if status and status != "All":
        query = query.filter(RoadHazard.status == status)

    results = query.order_by(RoadHazard.detected_at.desc()).all()
    out = []
    for h, rname in results:
        res = HazardResponse.from_orm(h)
        res.road_name = rname
        out.append(res)
    return out

@router.patch("/{hazard_id}/status")
def update_hazard_status(hazard_id: int, payload: HazardUpdateStatus, db: Session = Depends(get_db)):
    hazard = db.query(RoadHazard).filter(RoadHazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="Hazard not found")

    hazard.status = payload.status
    if payload.status in ["Repaired", "Closed"]:
        hazard.repaired_at = datetime.utcnow()
    db.commit()
    db.refresh(hazard)
    return {"success": True, "hazard": hazard}

@router.post("/report-defect")
async def report_hazard_with_evidence(
    road_location_id: int = Form(...),
    hazard_type: str = Form(...),
    severity: str = Form("Major"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    img_url = None
    ai_conf = 0.92

    if file:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"hazard_{int(datetime.utcnow().timestamp())}_{file.filename}"
        fpath = os.path.join(UPLOAD_DIR, filename)
        with open(fpath, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
        img_url = f"/uploads/{filename}"

    road = db.query(RoadLocation).filter(RoadLocation.id == road_location_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road location not found")

    new_hazard = RoadHazard(
        road_location_id=road_location_id,
        hazard_type=hazard_type,
        severity=severity,
        status="Detected",
        latitude=road.latitude,
        longitude=road.longitude,
        image_url=img_url,
        ai_confidence=ai_conf,
        reported_by="Field Officer Mobile Dispatch"
    )
    db.add(new_hazard)
    db.commit()
    db.refresh(new_hazard)

    return {"success": True, "hazard_id": new_hazard.id, "hazard": new_hazard}

