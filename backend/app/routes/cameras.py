import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Camera, CameraEvent, RoadLocation
from backend.app.schemas.schemas import CameraResponse, CameraEventResponse
from backend.app.ai.vision_detector import VisionDetector

router = APIRouter(prefix="/api/cameras", tags=["Cameras"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))

@router.get("", response_model=List[CameraResponse])
def get_cameras(
    district_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Camera).join(RoadLocation, Camera.road_location_id == RoadLocation.id)
    if district_id:
        query = query.filter(RoadLocation.district_id == district_id)
    if status and status != "All":
        query = query.filter(Camera.status == status)
    return query.all()

@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera_by_id(camera_id: int, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.get("/{camera_id}/telemetry")
def get_camera_telemetry(camera_id: int, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")

    detector = VisionDetector.get_instance()
    telemetry = detector.generate_synthetic_live_frame_data(cam.camera_code)
    telemetry["camera_id"] = cam.id
    telemetry["camera_type"] = cam.camera_type
    telemetry["resolution"] = cam.resolution
    telemetry["stream_url"] = cam.stream_url
    return telemetry

@router.get("/{camera_id}/events", response_model=List[CameraEventResponse])
def get_camera_events(camera_id: int, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(CameraEvent)\
             .filter(CameraEvent.camera_id == camera_id)\
             .order_by(CameraEvent.event_timestamp.desc())\
             .limit(limit)\
             .all()

@router.post("/analyze-upload")
async def analyze_uploaded_media(
    file: UploadFile = File(...),
    camera_id: Optional[int] = Form(1),
    db: Session = Depends(get_db)
):
    """
    Accepts uploaded image or video clip, saves it, and runs YOLO + OpenCV detection.
    Returns detected vehicles, pedestrians, hazard tags, and annotated visual preview.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"upload_{int(os.path.getmtime(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else 0)}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    annotated_filename = f"analyzed_{filename}"
    annotated_path = os.path.join(UPLOAD_DIR, annotated_filename)

    detector = VisionDetector.get_instance()
    analysis_results = detector.process_image(file_path, annotated_path)

    # Record camera event in database
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if cam:
        event = CameraEvent(
            camera_id=cam.id,
            event_type="Hazard Detected" if analysis_results["hazards_detected"] else "Speeding",
            anonymous_object_id=f"TN-V-{detector.anonymous_track_counter}",
            vehicle_class="Mixed Fleet",
            speed_kmh=58.5,
            confidence=0.9450,
            snapshot_url=f"/uploads/{annotated_filename}"
        )
        db.add(event)
        db.commit()

    return {
        "success": True,
        "original_file": filename,
        "annotated_preview_url": f"/uploads/{annotated_filename}",
        "metrics": analysis_results
    }

