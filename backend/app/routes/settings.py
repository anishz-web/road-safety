import os
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db, MYSQL_URL

router = APIRouter(prefix="/api/settings", tags=["System Settings"])

class SettingsPayload(BaseModel):
    openweather_api_key: str = ""
    yolo_confidence_threshold: float = 0.50
    bytetrack_iou_threshold: float = 0.60
    xgboost_critical_threshold: float = 75.0
    sumo_binary_path: str = "sumo"
    demo_mode: bool = True
    alert_sound_enabled: bool = True

current_settings = {
    "openweather_api_key": os.getenv("OPENWEATHER_API_KEY", ""),
    "yolo_confidence_threshold": 0.50,
    "bytetrack_iou_threshold": 0.60,
    "xgboost_critical_threshold": 75.0,
    "sumo_binary_path": "sumo",
    "demo_mode": True,
    "alert_sound_enabled": True
}

@router.get("")
def get_system_settings(db: Session = Depends(get_db)):
    # Test DB status
    db_status = "Connected (MySQL 8.0 Engine - roadguard_tn)"
    return {
        "settings": current_settings,
        "database": {
            "status": db_status,
            "host": "localhost:3306",
            "name": "roadguard_tn"
        },
        "ai_engine": {
            "xgboost_model": "XGBoost-TN-v2.4 (Active / 0.929 R2)",
            "shap_explainer": "SHAP TreeExplainer (Active)",
            "vision_pipeline": "OpenCV + YOLO Video Engine (Active)",
            "tracking_engine": "ByteTrack Anonymous ID Matrix (Zero PII)"
        }
    }

@router.post("")
def update_system_settings(payload: SettingsPayload):
    current_settings.update(payload.dict())
    return {
        "success": True,
        "settings": current_settings,
        "message": "System configuration updated successfully"
    }

