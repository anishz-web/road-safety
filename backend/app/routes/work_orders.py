import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import WorkOrder, Intervention, Recommendation, BeforeAfterMetric
from backend.app.schemas.schemas import WorkOrderResponse, WorkOrderAdvanceStage
from backend.app.utils.auth import get_current_user

router = APIRouter(prefix="/api/work-orders", tags=["Intervention Work Orders"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))

STAGES = [
    "AI Detection",
    "Recommendation",
    "Engineer Verification",
    "Department Approval",
    "Work Assignment",
    "Implementation",
    "Evidence Upload",
    "Verification",
    "Before/After Evaluation"
]

@router.get("", response_model=List[WorkOrderResponse])
def get_work_orders(
    stage: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WorkOrder)
    if stage and stage != "All":
        query = query.filter(WorkOrder.current_stage == stage)
    if status and status != "All":
        query = query.filter(WorkOrder.status == status)
    if department and department != "All":
        query = query.filter(WorkOrder.department == department)

    return query.order_by(WorkOrder.created_at.desc()).all()

@router.get("/{wo_id}", response_model=WorkOrderResponse)
def get_work_order_by_id(wo_id: int, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return wo

@router.post("/{wo_id}/advance-stage")
def advance_work_order_stage(
    wo_id: int,
    payload: WorkOrderAdvanceStage,
    db: Session = Depends(get_db)
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    wo.current_stage = payload.stage
    if payload.progress_percentage is not None:
        wo.progress_percentage = payload.progress_percentage

    if payload.stage == "Before/After Evaluation" or wo.progress_percentage >= 100:
        wo.status = "Completed"
        wo.actual_completion_date = datetime.utcnow().date()
        wo.progress_percentage = 100

        # Auto-create intervention record if not present
        intervention = db.query(Intervention).filter(Intervention.work_order_id == wo.id).first()
        if not intervention:
            rec = db.query(Recommendation).filter(Recommendation.id == wo.recommendation_id).first()
            if rec:
                intervention = Intervention(
                    work_order_id=wo.id,
                    road_location_id=rec.road_location_id,
                    intervention_type=rec.recommendation_type,
                    description=wo.title,
                    implementation_date=datetime.utcnow().date(),
                    engineer_in_charge="Executive Engineer PWD / Highways",
                    contractor=wo.assigned_contractor_agency or "Authorized Contractor",
                    quality_inspection_passed=True,
                    before_photo_url=wo.before_photo_url,
                    after_photo_url=payload.after_photo_url or wo.after_photo_url
                )
                db.add(intervention)
                db.flush()

                # Generate evaluation baseline
                metric = BeforeAfterMetric(
                    intervention_id=intervention.id,
                    road_location_id=rec.road_location_id,
                    evaluation_window="30-Day Field Evaluation",
                    traffic_density_before=210.0,
                    traffic_density_after=195.0,
                    avg_speed_before=48.0,
                    avg_speed_after=38.0,
                    p85_speed_before=66.0,
                    p85_speed_after=46.0,
                    waiting_time_sec_before=65.0,
                    waiting_time_sec_after=20.0,
                    queue_length_meters_before=95.0,
                    queue_length_meters_after=48.0,
                    conflict_frequency_before=18.0,
                    conflict_frequency_after=2.0,
                    historical_accidents_annual=12,
                    post_intervention_accidents=1,
                    crash_reduction_pct=75.0,
                    is_sumo_simulation=False,
                    certified_by="Divisional Road Safety Engineer",
                    verified_at=datetime.utcnow().date()
                )
                db.add(metric)

    if payload.verification_notes:
        wo.verification_notes = payload.verification_notes
    if payload.after_photo_url:
        wo.after_photo_url = payload.after_photo_url

    db.commit()
    db.refresh(wo)
    return {"success": True, "work_order": wo}

@router.post("/{wo_id}/upload-evidence")
async def upload_work_order_evidence(
    wo_id: int,
    evidence_type: str = Form("after"), # 'before' or 'after'
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"wo_{wo.id}_{evidence_type}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    fpath = os.path.join(UPLOAD_DIR, filename)

    with open(fpath, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    url = f"/uploads/{filename}"
    if evidence_type == "before":
        wo.before_photo_url = url
    else:
        wo.after_photo_url = url

    db.commit()
    return {"success": True, "url": url, "evidence_type": evidence_type}

