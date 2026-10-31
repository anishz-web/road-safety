from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import BeforeAfterMetric, Intervention, RoadLocation, WorkOrder
from backend.app.schemas.schemas import BeforeAfterResponse

router = APIRouter(prefix="/api/before-after", tags=["Before and After Evaluation"])

@router.get("", response_model=List[BeforeAfterResponse])
def get_before_after_evaluations(
    road_location_id: Optional[int] = None,
    include_simulations: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(BeforeAfterMetric, RoadLocation.road_name.label("road_name"))\
              .join(RoadLocation, BeforeAfterMetric.road_location_id == RoadLocation.id)

    if road_location_id:
        query = query.filter(BeforeAfterMetric.road_location_id == road_location_id)
    if not include_simulations:
        query = query.filter(BeforeAfterMetric.is_sumo_simulation == False)

    results = query.order_by(BeforeAfterMetric.created_at.desc()).all()
    out = []
    for metric, rname in results:
        res = BeforeAfterResponse.from_orm(metric)
        res.road_name = rname
        out.append(res)
    return out

@router.get("/interventions")
def get_completed_interventions(db: Session = Depends(get_db)):
    interventions = db.query(Intervention, RoadLocation.road_name, WorkOrder.work_order_no)\
                      .join(RoadLocation, Intervention.road_location_id == RoadLocation.id)\
                      .join(WorkOrder, Intervention.work_order_id == WorkOrder.id)\
                      .all()
    out = []
    for inv, rname, wono in interventions:
        out.append({
            "id": inv.id,
            "work_order_id": inv.work_order_id,
            "work_order_no": wono,
            "road_location_id": inv.road_location_id,
            "road_name": rname,
            "intervention_type": inv.intervention_type,
            "description": inv.description,
            "implementation_date": inv.implementation_date,
            "engineer_in_charge": inv.engineer_in_charge,
            "contractor": inv.contractor,
            "quality_inspection_passed": inv.quality_inspection_passed,
            "before_photo_url": inv.before_photo_url,
            "after_photo_url": inv.after_photo_url
        })
    return out

