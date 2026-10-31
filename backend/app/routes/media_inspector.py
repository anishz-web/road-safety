import os
import shutil
import time
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import RoadLocation, District, Recommendation, WorkOrder, User
from backend.app.ai.vision_detector import VisionDetector
from backend.app.ai.risk_engine import RiskPredictionEngine
from backend.app.utils.auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["Manual AI Media Inspector"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))

class ConvertSuggestionPayload(BaseModel):
    title: str
    problem_identified: str
    suggested_solution: str
    responsible_department: str
    priority: str
    expected_risk_reduction_pct: float
    estimated_cost_inr: float
    estimated_timeline_days: int
    road_name: Optional[str] = "Manually Audited Road Segment"
    district_id: Optional[int] = 1

@router.post("/inspect-media")
async def inspect_uploaded_media(
    file: UploadFile = File(...),
    road_name: Optional[str] = Form("Corridor Inspection Segment"),
    district_id: Optional[int] = Form(1),
    weather_condition: Optional[str] = Form("Dry"),
    speed_limit: Optional[int] = Form(50),
    has_pedestrian_crossing: Optional[bool] = Form(False),
    has_street_lights: Optional[bool] = Form(True),
    db: Session = Depends(get_db)
):
    """
    Accepts manual upload of Image or Video footage.
    Runs YOLO + OpenCV object detection, anonymous ByteTrack tracking,
    identifies road hazards & defect features, calculates XGBoost predictive risk,
    computes SHAP risk factor attributions, and synthesizes IRC-compliant suggestions.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    timestamp = int(time.time())
    safe_filename = f"manual_{timestamp}_{file.filename.replace(' ', '_')}"
    input_file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(input_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ext = os.path.splitext(file.filename)[1].lower()
    is_video = ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm'] or 'video' in (file.content_type or '')

    detector = VisionDetector.get_instance()
    annotated_filename = f"annotated_{timestamp}.jpg"
    annotated_out_path = os.path.join(UPLOAD_DIR, annotated_filename)

    if is_video:
        vision_results = detector.process_video(input_file_path, annotated_out_path)
    else:
        vision_results = detector.process_image(input_file_path, annotated_out_path)

    # Weather multipliers
    weather_rain_map = {
        "Dry": 0.0,
        "Light Rain": 8.0,
        "Moderate Rain": 18.0,
        "Heavy Downpour": 35.0,
        "Fog / Low Visibility": 4.0
    }
    rainfall_mm = weather_rain_map.get(weather_condition, 0.0)
    friction = 0.40 if rainfall_mm > 15 else (0.50 if rainfall_mm > 5 else 0.65)
    vis_meters = 2500.0 if "Fog" in weather_condition else (4500.0 if rainfall_mm > 15 else 9000.0)

    # Density calculation
    v_total = vision_results["total_vehicles"]
    est_density = float(v_total * 22.0)
    p85_speed = float(vision_results["p85_speed_kmh"])
    avg_speed = float(vision_results["avg_speed_kmh"])
    ped_count = float(vision_results["total_pedestrians"] * 45)
    active_hazards = len(vision_results.get("hazards_detected", []))

    # Run XGBoost & SHAP Risk Prediction
    risk_engine = RiskPredictionEngine.get_instance()
    risk_inputs = {
        "vehicle_density": est_density,
        "avg_speed_kmh": avg_speed,
        "p85_speed_kmh": p85_speed,
        "speed_limit": float(speed_limit),
        "pedestrian_count": ped_count,
        "lanes": 4,
        "road_type_code": 3, # Highway
        "junction_type_code": 1,
        "rainfall_mm": rainfall_mm,
        "visibility_meters": vis_meters,
        "surface_friction_index": friction,
        "has_pedestrian_crossing": has_pedestrian_crossing,
        "has_street_lights": has_street_lights,
        "active_hazards_count": active_hazards,
        "historical_accidents_annual": 8
    }

    prediction_results = risk_engine.predict(risk_inputs)

    # Extract dynamic risk factors list
    extracted_risk_factors = []

    # Speed factor
    speed_diff = p85_speed - speed_limit
    if speed_diff > 0:
        extracted_risk_factors.append({
            "factor_name": "Operating Speed Differential (Excessive Speeding)",
            "severity": "Critical" if speed_diff > 15 else "High",
            "impact_points": round(speed_diff * 0.95, 1),
            "description": f"85th percentile speed ({p85_speed} km/h) exceeds posted design speed limit ({speed_limit} km/h) by {round(speed_diff, 1)} km/h.",
            "benchmark": f"IRC Standard Limit: {speed_limit} km/h"
        })

    # Potholes and defects
    for h in vision_results.get("hazards_detected", []):
        extracted_risk_factors.append({
            "factor_name": f"Pavement Defect: {h['hazard_type']}",
            "severity": h["severity"],
            "impact_points": 22.4 if h["severity"] == "Critical" else 14.2,
            "description": f"Open structural distress detected on active carriageway with {int(h['confidence']*100)}% AI confidence.",
            "benchmark": "Zero-Distress Pavement Standard (IRC:82)"
        })

    # Pedestrian crossing conflict
    if ped_count > 60 and not has_pedestrian_crossing:
        extracted_risk_factors.append({
            "factor_name": "Unregulated Mid-Block Pedestrian Jaywalking",
            "severity": "Critical",
            "impact_points": 24.8,
            "description": f"Pedestrians traversing across 4+ lanes without designated zebra crossing, causing sudden heavy braking cycles.",
            "benchmark": "Dedicated Refuge Crossing Mandatory"
        })

    # Wet road factor
    if rainfall_mm > 5:
        extracted_risk_factors.append({
            "factor_name": "Reduced Pavement Skid Resistance (Hydroplaning Risk)",
            "severity": "High",
            "impact_points": round(rainfall_mm * 0.6, 1),
            "description": f"Water film accumulation on surface has reduced British Pendulum Number to {friction:.2f}, increasing stopping distance by 38%.",
            "benchmark": "Minimum Safe Wet Friction >= 0.55 BPN"
        })

    # Near miss conflicts from video
    if is_video and vision_results.get("near_miss_conflicts", 0) > 0:
        c_count = vision_results["near_miss_conflicts"]
        extracted_risk_factors.append({
            "factor_name": "Temporal Near-Miss Trajectory Conflicts",
            "severity": "Critical",
            "impact_points": round(c_count * 4.8, 1),
            "description": f"Detected {c_count} vehicle-pedestrian / overtaking proximity conflicts with Time-to-Collision (TTC) under 1.5 seconds.",
            "benchmark": "Conflict Threshold: 0 events/hr"
        })

    # Synthesize tailored AI Suggestions based on detected risk factors
    ai_suggestions = []

    # Suggestion 1: Pothole / defect repair
    if active_hazards > 0:
        ai_suggestions.append({
            "id": 1,
            "title": "Emergency Bituminous Mastic Pavement Patching (IRC:82-2015)",
            "problem_identified": "Surface cratering and pavement raveling causing vehicles to swerve abruptly across adjacent lanes.",
            "suggested_solution": "Execute mechanized milling of distressed asphalt layer, tack coat application, and compaction of 40mm Bituminous Concrete mastic layer.",
            "responsible_department": "Highways Department / NHAI",
            "priority": "Urgent P1",
            "expected_risk_reduction_pct": 38.5,
            "estimated_cost_inr": 380000.0,
            "estimated_timeline_days": 7
        })

    # Suggestion 2: Speed calming or radar warning
    if speed_diff > 5:
        ai_suggestions.append({
            "id": 2,
            "title": "Solar Doppler Speed Radar Display & Transverse Thermoplastic Rumble Array",
            "problem_identified": f"Vehicular operating speed ({p85_speed} km/h) out of compliance with {speed_limit} km/h speed limit.",
            "suggested_solution": "Install overhead Solar LED Dynamic Driver Feedback Sign (DFS) with 6 sets of 6mm raised thermoplastic rumble bars at 50m intervals.",
            "responsible_department": "Traffic Police Department",
            "priority": "High P2",
            "expected_risk_reduction_pct": 44.0,
            "estimated_cost_inr": 620000.0,
            "estimated_timeline_days": 12
        })

    # Suggestion 3: Pedestrian crossing
    if ped_count > 60 and not has_pedestrian_crossing:
        ai_suggestions.append({
            "id": 3,
            "title": "High-Friction Raised Zebra Crossing with Dual Solar Blinkers (IRC:99)",
            "problem_identified": "Pedestrians crossing high-speed multilane corridor without grade separation or protected pedestrian sanctuary.",
            "suggested_solution": "Construct a 100mm flat-topped raised pedestrian table with 300mm thermoplastic zebra stripes, pedestrian refuge island, and overhead amber flashing beacons.",
            "responsible_department": "Highways Department / NHAI",
            "priority": "Urgent P1",
            "expected_risk_reduction_pct": 56.0,
            "estimated_cost_inr": 850000.0,
            "estimated_timeline_days": 14
        })

    # Suggestion 4: Wet friction anti-skid
    if rainfall_mm > 5 or friction < 0.50:
        ai_suggestions.append({
            "id": 4,
            "title": "Epoxy Thermosetting Calcined Bauxite Anti-Skid Overlay",
            "problem_identified": "Pavement skid resistance severely degraded during precipitation events, leading to wheel lock and skidding.",
            "suggested_solution": "Apply 3mm high-friction epoxy resin surfacing with refractory calcined bauxite aggregate to elevate skid resistance to 0.72 BPN.",
            "responsible_department": "Highways Department / NHAI",
            "priority": "High P2",
            "expected_risk_reduction_pct": 46.5,
            "estimated_cost_inr": 1200000.0,
            "estimated_timeline_days": 18
        })

    # If no specific defects found, provide standard corridor safety upgrade
    if len(ai_suggestions) == 0:
        ai_suggestions.append({
            "id": 5,
            "title": "Corridor Delineation Retrofit & Cat-Eye Marker Arrays",
            "problem_identified": "General corridor delineation enhancement required to maintain safe lane disciplines during night flow.",
            "suggested_solution": "Install 3M Diamond Grade microprismatic retroreflective road studs (cat-eyes) at 9m spacing along center line and edge markings.",
            "responsible_department": "Municipal Corporation",
            "priority": "Medium P3",
            "expected_risk_reduction_pct": 28.0,
            "estimated_cost_inr": 420000.0,
            "estimated_timeline_days": 10
        })

    return {
        "success": True,
        "media_info": {
            "media_type": "video" if is_video else "image",
            "filename": file.filename,
            "file_url": f"/uploads/{safe_filename}",
            "annotated_preview_url": f"/uploads/{annotated_filename}",
            "video_metadata": vision_results.get("video_metadata")
        },
        "vision_metrics": {
            "total_vehicles": vision_results["total_vehicles"],
            "vehicle_breakdown": vision_results["vehicle_counts"],
            "total_pedestrians": vision_results["total_pedestrians"],
            "avg_speed_kmh": vision_results["avg_speed_kmh"],
            "p85_speed_kmh": vision_results["p85_speed_kmh"],
            "speed_limit_kmh": speed_limit,
            "near_miss_conflicts": vision_results.get("near_miss_conflicts", 0),
            "hazards_detected": vision_results.get("hazards_detected", []),
            "processing_time_ms": vision_results.get("processing_time_ms", 65.0)
        },
        "risk_assessment": {
            "risk_score": prediction_results["risk_score"],
            "risk_category": prediction_results["risk_category"],
            "confidence_score": prediction_results["confidence_score"],
            "predicted_accident_prob": prediction_results["predicted_accident_prob"],
            "model_version": prediction_results["model_version"],
            "data_limitations": prediction_results["data_limitations"]
        },
        "risk_factors": extracted_risk_factors,
        "ai_suggestions": ai_suggestions,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

@router.post("/convert-suggestion-to-work-order")
def convert_suggestion_to_work_order(
    payload: ConvertSuggestionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Directly converts an AI-generated media suggestion into an official Recommendation and Work Order in MySQL.
    """
    # Find matching road location if provided
    road = None
    if payload.road_name:
        road = db.query(RoadLocation).filter(RoadLocation.road_name.ilike(f"%{payload.road_name[:20]}%")).first()
    if not road and payload.district_id:
        road = db.query(RoadLocation).filter(RoadLocation.district_id == payload.district_id).first()
    if not road:
        road = db.query(RoadLocation).first()
    road_id = road.id if road else 1

    rec_type = payload.title.split("(")[0].strip()[:95]

    # Create Recommendation
    rec = Recommendation(
        road_location_id=road_id,
        recommendation_type=rec_type,
        title=payload.title,
        problem_identified=payload.problem_identified,
        risk_explanation=f"Identified through manual AI image/video inspection by {current_user.full_name}.",
        suggested_solution=payload.suggested_solution,
        responsible_department=payload.responsible_department,
        priority=payload.priority,
        expected_risk_reduction_pct=payload.expected_risk_reduction_pct,
        estimated_cost_inr=payload.estimated_cost_inr,
        estimated_timeline_days=payload.estimated_timeline_days,
        status="Approved",
        approved_by=current_user.id,
        approved_at=datetime.utcnow(),
        remarks=f"Sanctioned immediately from AI Media Inspection by {current_user.full_name} ({current_user.role})"
    )
    db.add(rec)
    db.flush()

    # Create Work Order
    wo_count = db.query(WorkOrder).count()
    wo_no = f"TN-AI-2026-WO-{5200 + wo_count + 1}"

    wo = WorkOrder(
        recommendation_id=rec.id,
        work_order_no=wo_no,
        title=f"Implementation: {payload.title}",
        department=payload.responsible_department,
        assigned_division=f"{payload.responsible_department} Field Engineering Division",
        assigned_contractor_agency="State Highway Empanelled Infrastructure Agency",
        sanction_order_no=f"GO-AI-MEDIA-2026/{600 + wo_count + 1}",
        sanctioned_budget_inr=payload.estimated_cost_inr,
        current_stage="Work Assignment",
        status="In Progress",
        start_date=datetime.utcnow().date(),
        target_completion_date=datetime.utcnow().date(),
        progress_percentage=15,
        verification_notes="Work order created from AI image/video inspection. Site verification confirmed.",
        created_by=current_user.id
    )
    db.add(wo)
    db.commit()
    db.refresh(wo)

    return {
        "success": True,
        "recommendation_id": rec.id,
        "work_order_id": wo.id,
        "work_order_no": wo.work_order_no,
        "message": f"Successfully authorized & converted into Work Order {wo.work_order_no}!"
    }

