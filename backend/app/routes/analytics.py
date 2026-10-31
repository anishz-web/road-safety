from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.models import (
    RoadLocation, Camera, Alert, WorkOrder, Recommendation,
    District, RoadHazard, BeforeAfterMetric
)

router = APIRouter(prefix="/api/analytics", tags=["Department Analytics"])

@router.get("/dashboard")
def get_main_dashboard_analytics(db: Session = Depends(get_db)):
    total_locations = db.query(RoadLocation).count()
    critical_zones = db.query(RoadLocation).filter(RoadLocation.risk_level == "Critical").count()
    high_zones = db.query(RoadLocation).filter(RoadLocation.risk_level == "High").count()
    med_zones = db.query(RoadLocation).filter(RoadLocation.risk_level == "Medium").count()
    low_zones = db.query(RoadLocation).filter(RoadLocation.risk_level == "Low").count()

    active_cameras = db.query(Camera).filter(Camera.status == "Online").count()
    total_cameras = db.query(Camera).count()

    active_alerts = db.query(Alert).filter(Alert.is_acknowledged == False).count()
    pending_interventions = db.query(WorkOrder).filter(WorkOrder.status.in_(["In Progress", "Draft"])).count()
    completed_interventions = db.query(WorkOrder).filter(WorkOrder.status == "Completed").count()

    # District risk distribution
    districts = db.query(District).all()
    district_risk = []
    for d in districts:
        roads = db.query(RoadLocation).filter(RoadLocation.district_id == d.id).all()
        crit = sum(1 for r in roads if r.risk_level == "Critical")
        high = sum(1 for r in roads if r.risk_level == "High")
        avg_score = sum(r.risk_score for r in roads) / max(len(roads), 1)
        district_risk.append({
            "district": d.name,
            "zone": d.zone,
            "critical_count": crit,
            "high_count": high,
            "total_monitored": len(roads),
            "average_risk_score": round(avg_score, 1)
        })

    # Sort top risk districts
    district_risk = sorted(district_risk, key=lambda x: x["average_risk_score"], reverse=True)

    # Monthly trends (Demo calibrated against TN Road Safety Authority figures)
    monthly_trends = [
        {"month": "May 2026", "traffic_index": 118, "predicted_incidents": 42, "actual_crashes": 38, "interventions": 4},
        {"month": "Jun 2026", "traffic_index": 124, "predicted_incidents": 45, "actual_crashes": 39, "interventions": 6},
        {"month": "Jul 2026", "traffic_index": 131, "predicted_incidents": 48, "actual_crashes": 34, "interventions": 8},
        {"month": "Aug 2026", "traffic_index": 128, "predicted_incidents": 41, "actual_crashes": 29, "interventions": 11},
        {"month": "Sep 2026", "traffic_index": 135, "predicted_incidents": 39, "actual_crashes": 24, "interventions": 14},
        {"month": "Oct 2026", "traffic_index": 142, "predicted_incidents": 35, "actual_crashes": 21, "interventions": 18}
    ]

    # Department performance resolution
    dept_stats = [
        {"department": "Highways Department / NHAI", "assigned": 14, "completed": 9, "avg_days": 18.5, "efficiency": 88.0},
        {"department": "Traffic Police Department", "assigned": 12, "completed": 10, "avg_days": 8.2, "efficiency": 94.5},
        {"department": "Municipal Corporation", "assigned": 9, "completed": 5, "avg_days": 24.0, "efficiency": 72.0},
        {"department": "Transport Department", "assigned": 6, "completed": 5, "avg_days": 12.0, "efficiency": 89.0}
    ]

    # Hazard type distribution
    hazard_counts = db.query(RoadHazard.hazard_type, func.count(RoadHazard.id))\
                      .group_by(RoadHazard.hazard_type).all()
    hazard_dist = [{"type": htype.split("/")[0].strip(), "count": count} for htype, count in hazard_counts]

    return {
        "kpis": {
            "total_monitored_locations": total_locations,
            "critical_risk_zones": critical_zones,
            "high_risk_zones": high_zones,
            "medium_risk_zones": med_zones,
            "low_risk_zones": low_zones,
            "active_camera_count": active_cameras,
            "total_camera_count": total_cameras,
            "current_alerts": active_alerts,
            "pending_interventions": pending_interventions,
            "completed_interventions": completed_interventions,
            "average_reduction_pct": 74.2
        },
        "district_risk_breakdown": district_risk,
        "monthly_trends": monthly_trends,
        "department_performance": dept_stats,
        "hazard_distribution": hazard_dist,
        "is_demo_data": True
    }

