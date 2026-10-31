from typing import List, Optional, Any
from datetime import datetime, date
from pydantic import BaseModel, EmailStr

# Auth & User schemas
class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    department: str
    district_id: Optional[int] = None
    badge_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    department: str
    district_id: Optional[int] = None
    badge_id: Optional[str] = None
    phone: Optional[str] = None

# District schemas
class DistrictResponse(BaseModel):
    id: int
    name: str
    zone: str
    headquarters: str
    total_roads_km: float
    critical_hotspots: int
    police_jurisdiction: Optional[str] = None
    contact_officer: Optional[str] = None

    class Config:
        from_attributes = True

# Road location schemas
class RoadLocationBase(BaseModel):
    district_id: int
    road_code: str
    road_name: str
    road_type: str
    chainage: Optional[str] = None
    latitude: float
    longitude: float
    speed_limit: int = 60
    lanes: int = 4
    surface_type: str = "Asphalt Concrete"
    junction_type: str = "Grade Separated"
    geometry_type: str = "Straight Divided"
    risk_score: float = 0.0
    risk_level: str = "Low"
    has_pedestrian_crossing: bool = False
    has_street_lights: bool = True

class RoadLocationCreate(RoadLocationBase):
    pass

class RoadLocationResponse(RoadLocationBase):
    id: int
    is_active: bool
    is_demo_data: bool
    created_at: Optional[datetime] = None
    district_name: Optional[str] = None

    class Config:
        from_attributes = True

# Camera schemas
class CameraResponse(BaseModel):
    id: int
    road_location_id: int
    camera_code: str
    model_name: Optional[str] = None
    camera_type: str
    ip_address: Optional[str] = None
    stream_url: Optional[str] = None
    status: str
    fps: int
    resolution: str
    last_heartbeat: Optional[datetime] = None
    is_ai_enabled: bool

    class Config:
        from_attributes = True

class CameraEventResponse(BaseModel):
    id: int
    camera_id: int
    event_type: str
    anonymous_object_id: str
    vehicle_class: Optional[str] = None
    speed_kmh: Optional[float] = None
    confidence: float
    snapshot_url: Optional[str] = None
    event_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True

# Hazard schemas
class HazardResponse(BaseModel):
    id: int
    road_location_id: int
    hazard_type: str
    severity: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    ai_confidence: float
    reported_by: Optional[str] = None
    detected_at: Optional[datetime] = None
    repaired_at: Optional[datetime] = None
    road_name: Optional[str] = None

    class Config:
        from_attributes = True

class HazardUpdateStatus(BaseModel):
    status: str
    repaired_at: Optional[datetime] = None

# Weather schemas
class WeatherObservationResponse(BaseModel):
    id: int
    district_id: int
    district_name: Optional[str] = None
    temperature_c: float
    rainfall_mm: float
    humidity_pct: int
    visibility_meters: int
    wind_speed_kmh: float
    weather_condition: str
    wet_road_factor: float
    aquaplaning_risk: str
    alert_level: str
    observed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Risk Prediction Request
class RiskPredictionRequest(BaseModel):
    road_location_id: Optional[int] = None
    vehicle_density: float = 180.0
    avg_speed_kmh: float = 45.0
    p85_speed_kmh: float = 64.0
    speed_limit: float = 50.0
    pedestrian_count: float = 140.0
    lanes: int = 4
    road_type_code: int = 3
    junction_type_code: int = 1
    rainfall_mm: float = 0.0
    visibility_meters: float = 8500.0
    surface_friction_index: float = 0.65
    has_pedestrian_crossing: bool = False
    has_street_lights: bool = True
    active_hazards_count: int = 1
    historical_accidents_annual: int = 8

# Recommendation schemas
class RecommendationResponse(BaseModel):
    id: int
    road_location_id: int
    road_name: Optional[str] = None
    assessment_id: Optional[int] = None
    recommendation_type: str
    title: str
    problem_identified: str
    risk_explanation: str
    suggested_solution: str
    responsible_department: str
    priority: str
    expected_risk_reduction_pct: float
    estimated_cost_inr: float
    estimated_timeline_days: int
    status: str
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecommendationAction(BaseModel):
    action: str # "approve", "reject", "field_review"
    remarks: Optional[str] = None

# Work Order schemas
class WorkOrderResponse(BaseModel):
    id: int
    recommendation_id: int
    work_order_no: str
    title: str
    department: str
    assigned_division: Optional[str] = None
    assigned_contractor_agency: Optional[str] = None
    sanction_order_no: Optional[str] = None
    sanctioned_budget_inr: Optional[float] = None
    current_stage: str
    status: str
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    progress_percentage: int
    before_photo_url: Optional[str] = None
    after_photo_url: Optional[str] = None
    verification_notes: Optional[str] = None

    class Config:
        from_attributes = True

class WorkOrderAdvanceStage(BaseModel):
    stage: str
    progress_percentage: Optional[int] = None
    verification_notes: Optional[str] = None
    after_photo_url: Optional[str] = None

# Before & After Metrics
class BeforeAfterResponse(BaseModel):
    id: int
    intervention_id: int
    road_location_id: int
    road_name: Optional[str] = None
    evaluation_window: str
    traffic_density_before: Optional[float] = None
    traffic_density_after: Optional[float] = None
    avg_speed_before: Optional[float] = None
    avg_speed_after: Optional[float] = None
    p85_speed_before: Optional[float] = None
    p85_speed_after: Optional[float] = None
    waiting_time_sec_before: Optional[float] = None
    waiting_time_sec_after: Optional[float] = None
    queue_length_meters_before: Optional[float] = None
    queue_length_meters_after: Optional[float] = None
    conflict_frequency_before: Optional[float] = None
    conflict_frequency_after: Optional[float] = None
    historical_accidents_annual: Optional[int] = None
    post_intervention_accidents: Optional[int] = None
    crash_reduction_pct: Optional[float] = None
    is_sumo_simulation: bool
    certified_by: Optional[str] = None
    verified_at: Optional[date] = None

    class Config:
        from_attributes = True

# Alerts
class AlertResponse(BaseModel):
    id: int
    district_id: int
    district_name: Optional[str] = None
    road_location_id: Optional[int] = None
    road_name: Optional[str] = None
    alert_level: str
    title: str
    message: str
    source: str
    is_acknowledged: bool
    acknowledged_by: Optional[int] = None
    dispatched_units: Optional[str] = None
    is_demo_data: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertAction(BaseModel):
    action: str # "acknowledge", "dispatch"
    dispatched_units: Optional[str] = None

# Audit Log
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    resource: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
