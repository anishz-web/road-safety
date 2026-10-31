from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    zone = Column(String(50), nullable=False)
    headquarters = Column(String(100), nullable=False)
    total_roads_km = Column(Float, default=0.0)
    critical_hotspots = Column(Integer, default=0)
    police_jurisdiction = Column(String(150))
    contact_officer = Column(String(150))
    created_at = Column(DateTime, server_default=func.now())

    users = relationship("User", back_populates="district")
    roads = relationship("RoadLocation", back_populates="district")
    weather_records = relationship("WeatherObservation", back_populates="district")
    alerts = relationship("Alert", back_populates="district")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(100), nullable=False) # 'State Administrator', 'District Road Safety Officer', 'Traffic Police Officer', 'Highway Engineer', 'Municipal Officer'
    department = Column(String(100), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    badge_id = Column(String(50))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    district = relationship("District", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")


class RoadLocation(Base):
    __tablename__ = "road_locations"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    road_code = Column(String(50), nullable=False)
    road_name = Column(String(200), nullable=False)
    road_type = Column(String(50), nullable=False) # 'National Highway', 'State Highway', 'Major District Road', 'City Arterial'
    chainage = Column(String(50))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_limit = Column(Integer, default=60)
    lanes = Column(Integer, default=4)
    surface_type = Column(String(50), default="Asphalt Concrete")
    junction_type = Column(String(100), default="Grade Separated")
    geometry_type = Column(String(100), default="Straight Divided")
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="Low") # 'Critical', 'High', 'Medium', 'Low'
    has_pedestrian_crossing = Column(Boolean, default=False)
    has_street_lights = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    is_demo_data = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    district = relationship("District", back_populates="roads")
    cameras = relationship("Camera", back_populates="road")
    traffic_observations = relationship("TrafficObservation", back_populates="road")
    hazards = relationship("RoadHazard", back_populates="road")
    risk_assessments = relationship("RiskAssessment", back_populates="road")
    recommendations = relationship("Recommendation", back_populates="road")
    before_after_metrics = relationship("BeforeAfterMetric", back_populates="road")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    road_location_id = Column(Integer, ForeignKey("road_locations.id"), nullable=False)
    camera_code = Column(String(50), unique=True, nullable=False)
    model_name = Column(String(100))
    camera_type = Column(String(50), default="4K Ultra-HD Fixed")
    ip_address = Column(String(50))
    stream_url = Column(String(255))
    status = Column(String(50), default="Online") # 'Online', 'Offline', 'Maintenance', 'Degraded'
    fps = Column(Integer, default=30)
    resolution = Column(String(20), default="3840x2160")
    last_heartbeat = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_ai_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    road = relationship("RoadLocation", back_populates="cameras")
    events = relationship("CameraEvent", back_populates="camera")


class CameraEvent(Base):
    __tablename__ = "camera_events"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    event_type = Column(String(100), nullable=False)
    anonymous_object_id = Column(String(50), nullable=False)
    vehicle_class = Column(String(50))
    speed_kmh = Column(Float)
    confidence = Column(Float, nullable=False)
    snapshot_url = Column(String(255))
    event_timestamp = Column(DateTime, server_default=func.now())

    camera = relationship("Camera", back_populates="events")


class TrafficObservation(Base):
    __tablename__ = "traffic_observations"

    id = Column(Integer, primary_key=True, index=True)
    road_location_id = Column(Integer, ForeignKey("road_locations.id"), nullable=False)
    vehicle_count = Column(Integer, default=0)
    car_count = Column(Integer, default=0)
    bus_count = Column(Integer, default=0)
    truck_count = Column(Integer, default=0)
    twowheeler_count = Column(Integer, default=0)
    pedestrian_count = Column(Integer, default=0)
    avg_speed_kmh = Column(Float, default=45.0)
    p85_speed_kmh = Column(Float, default=62.0)
    density_pcu_per_km = Column(Float, default=120.0)
    congestion_level = Column(String(50), default="Fluid")
    conflict_count = Column(Integer, default=0)
    observed_at = Column(DateTime, server_default=func.now())

    road = relationship("RoadLocation", back_populates="traffic_observations")


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    temperature_c = Column(Float, default=30.0)
    rainfall_mm = Column(Float, default=0.0)
    humidity_pct = Column(Integer, default=65)
    visibility_meters = Column(Integer, default=9000)
    wind_speed_kmh = Column(Float, default=12.0)
    weather_condition = Column(String(100), default="Clear")
    wet_road_factor = Column(Float, default=1.0)
    aquaplaning_risk = Column(String(50), default="None")
    alert_level = Column(String(50), default="Normal")
    observed_at = Column(DateTime, server_default=func.now())

    district = relationship("District", back_populates="weather_records")


class RoadHazard(Base):
    __tablename__ = "road_hazards"

    id = Column(Integer, primary_key=True, index=True)
    road_location_id = Column(Integer, ForeignKey("road_locations.id"), nullable=False)
    hazard_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False) # 'Critical', 'Major', 'Minor'
    status = Column(String(50), default="Detected") # 'Detected', 'Engineer Verified', 'Assigned', 'In Progress', 'Repaired', 'Closed'
    latitude = Column(Float)
    longitude = Column(Float)
    image_url = Column(String(255))
    ai_confidence = Column(Float, default=0.92)
    reported_by = Column(String(100), default="AI Automated Video Inspection")
    detected_at = Column(DateTime, server_default=func.now())
    repaired_at = Column(DateTime, nullable=True)

    road = relationship("RoadLocation", back_populates="hazards")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    road_location_id = Column(Integer, ForeignKey("road_locations.id"), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_category = Column(String(50), nullable=False) # 'Critical', 'High', 'Medium', 'Low'
    confidence_score = Column(Float, nullable=False)
    predicted_accident_prob = Column(Float, nullable=False)
    model_version = Column(String(50), default="XGBoost-TN-v2.4")
    is_demo_data = Column(Boolean, default=True)
    assessed_at = Column(DateTime, server_default=func.now())

    road = relationship("RoadLocation", back_populates="risk_assessments")
    factors = relationship("RiskFactor", back_populates="assessment")
    recommendations = relationship("Recommendation", back_populates="assessment")


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("risk_assessments.id"), nullable=False)
    factor_name = Column(String(150), nullable=False)
    feature_value = Column(String(100), nullable=False)
    shap_value = Column(Float, nullable=False)
    benchmark_norm = Column(String(100))
    impact_direction = Column(String(50), nullable=False) # 'Increases Risk', 'Decreases Risk'
    description = Column(Text)

    assessment = relationship("RiskAssessment", back_populates="factors")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    road_location_id = Column(Integer, ForeignKey("road_locations.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("risk_assessments.id"), nullable=True)
    recommendation_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    problem_identified = Column(Text, nullable=False)
    risk_explanation = Column(Text, nullable=False)
    suggested_solution = Column(Text, nullable=False)
    responsible_department = Column(String(100), nullable=False)
    priority = Column(String(50), nullable=False) # 'Urgent P1', 'High P2', 'Medium P3', 'Routine P4'
    expected_risk_reduction_pct = Column(Float, nullable=False)
    estimated_cost_inr = Column(Float, nullable=False)
    estimated_timeline_days = Column(Integer, nullable=False)
    status = Column(String(50), default="Pending Approval") # 'Pending Approval', 'Approved', 'Rejected', 'Field Review Requested'
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    road = relationship("RoadLocation", back_populates="recommendations")
    assessment = relationship("RiskAssessment", back_populates="recommendations")
    work_orders = relationship("WorkOrder", back_populates="recommendation")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=False)
    work_order_no = Column(String(100), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    assigned_division = Column(String(150))
    assigned_contractor_agency = Column(String(150))
    sanction_order_no = Column(String(100))
    sanctioned_budget_inr = Column(Float)
    current_stage = Column(String(50), default="Work Assignment") # 9 stages
    status = Column(String(50), default="In Progress")
    start_date = Column(Date)
    target_completion_date = Column(Date)
    actual_completion_date = Column(Date, nullable=True)
    progress_percentage = Column(Integer, default=0)
    before_photo_url = Column(String(255))
    after_photo_url = Column(String(255))
    verification_notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    recommendation = relationship("Recommendation", back_populates="work_orders")
    intervention = relationship("Intervention", back_populates="work_order", uselist=False)


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), unique=True, nullable=False)
    road_location_id = Column(Integer, ForeignKey("road_locations.id"), nullable=False)
    intervention_type = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    implementation_date = Column(Date, nullable=False)
    engineer_in_charge = Column(String(150), nullable=False)
    contractor = Column(String(150), nullable=False)
    quality_inspection_passed = Column(Boolean, default=True)
    before_photo_url = Column(String(255))
    after_photo_url = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    work_order = relationship("WorkOrder", back_populates="intervention")
    metrics = relationship("BeforeAfterMetric", back_populates="intervention")


class BeforeAfterMetric(Base):
    __tablename__ = "before_after_metrics"

    id = Column(Integer, primary_key=True, index=True)
    intervention_id = Column(Integer, ForeignKey("interventions.id"), nullable=False)
    road_location_id = Column(Integer, ForeignKey("road_locations.id"), nullable=False)
    evaluation_window = Column(String(50), default="90-Day Post-Intervention")
    traffic_density_before = Column(Float)
    traffic_density_after = Column(Float)
    avg_speed_before = Column(Float)
    avg_speed_after = Column(Float)
    p85_speed_before = Column(Float)
    p85_speed_after = Column(Float)
    waiting_time_sec_before = Column(Float)
    waiting_time_sec_after = Column(Float)
    queue_length_meters_before = Column(Float)
    queue_length_meters_after = Column(Float)
    conflict_frequency_before = Column(Float)
    conflict_frequency_after = Column(Float)
    historical_accidents_annual = Column(Integer)
    post_intervention_accidents = Column(Integer)
    crash_reduction_pct = Column(Float)
    is_sumo_simulation = Column(Boolean, default=False)
    certified_by = Column(String(150))
    verified_at = Column(Date)
    created_at = Column(DateTime, server_default=func.now())

    intervention = relationship("Intervention", back_populates="metrics")
    road = relationship("RoadLocation", back_populates="before_after_metrics")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    road_location_id = Column(Integer, ForeignKey("road_locations.id"), nullable=True)
    alert_level = Column(String(50), nullable=False) # 'Critical', 'High', 'Medium', 'Info'
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    dispatched_units = Column(String(255), nullable=True)
    is_demo_data = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    district = relationship("District", back_populates="alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details = Column(Text)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="audit_logs")

