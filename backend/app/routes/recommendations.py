from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Recommendation, RoadLocation, WorkOrder, User
from backend.app.schemas.schemas import RecommendationResponse, RecommendationAction
from backend.app.utils.auth import get_current_user

router = APIRouter(prefix="/api/recommendations", tags=["Safety Recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(
    department: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Recommendation, RoadLocation.road_name.label("road_name"))\
              .join(RoadLocation, Recommendation.road_location_id == RoadLocation.id)

    if department and department != "All":
        query = query.filter(Recommendation.responsible_department == department)
    if priority and priority != "All":
        query = query.filter(Recommendation.priority == priority)
    if status and status != "All":
        query = query.filter(Recommendation.status == status)

    results = query.order_by(Recommendation.created_at.desc()).all()
    out = []
    for rec, rname in results:
        res = RecommendationResponse.from_orm(rec)
        res.road_name = rname
        out.append(res)
    return out

@router.post("/{rec_id}/action")
def process_recommendation_action(
    rec_id: int,
    payload: RecommendationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    action = payload.action.lower()
    if action == "approve":
        rec.status = "Approved"
        rec.approved_by = current_user.id
        rec.approved_at = datetime.utcnow()
        rec.remarks = payload.remarks or f"Approved by {current_user.full_name} ({current_user.role})"

        # Automatically spawn Work Order in government workflow
        wo_count = db.query(WorkOrder).count()
        wo_no = f"TN-{rec.responsible_department[:3].upper()}-2026-WO-{4100 + wo_count + 1}"

        wo = WorkOrder(
            recommendation_id=rec.id,
            work_order_no=wo_no,
            title=f"Implementation: {rec.title}",
            department=rec.responsible_department,
            assigned_division=f"{rec.responsible_department} Field Division",
            assigned_contractor_agency="State Empanelled Contractor Pool",
            sanction_order_no=f"GO-MS-RS-2026/{500 + wo_count + 1}",
            sanctioned_budget_inr=rec.estimated_cost_inr,
            current_stage="Work Assignment",
            status="In Progress",
            start_date=datetime.utcnow().date(),
            target_completion_date=datetime.utcnow().date(),
            progress_percentage=10,
            verification_notes="Engineering estimate sanctioned. Contractor work assignment in progress.",
            created_by=current_user.id
        )
        db.add(wo)

    elif action == "reject":
        rec.status = "Rejected"
        rec.approved_by = current_user.id
        rec.approved_at = datetime.utcnow()
        rec.remarks = payload.remarks or "Rejected during technical review."

    elif action == "field_review":
        rec.status = "Field Review Requested"
        rec.remarks = payload.remarks or "Site verification requested prior to sanction."

    db.commit()
    db.refresh(rec)
    return {
        "success": True,
        "recommendation": rec,
        "action": action
    }

