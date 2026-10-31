-- =====================================================================
-- ROADGUARD TN: AI-Powered Statewide Predictive Road Safety
-- and Traffic Intervention Management System
-- State of Tamil Nadu - Decision Support & Engineering Platform
-- =====================================================================

CREATE DATABASE IF NOT EXISTS roadguard_tn;
USE roadguard_tn;

-- 1. DISTRICTS TABLE
CREATE TABLE IF NOT EXISTS districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    zone VARCHAR(50) NOT NULL,
    headquarters VARCHAR(100) NOT NULL,
    total_roads_km DECIMAL(10,2) DEFAULT 0.00,
    critical_hotspots INT DEFAULT 0,
    police_jurisdiction VARCHAR(150),
    contact_officer VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USERS TABLE (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM(
        'State Administrator',
        'District Road Safety Officer',
        'Traffic Police Officer',
        'Highway Engineer',
        'Municipal Officer'
    ) NOT NULL,
    department VARCHAR(100) NOT NULL,
    district_id INT NULL,
    badge_id VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ROAD LOCATIONS (Geographically grounded TN Blackspots & Arteries)
CREATE TABLE IF NOT EXISTS road_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    road_code VARCHAR(50) NOT NULL,
    road_name VARCHAR(200) NOT NULL,
    road_type ENUM('National Highway', 'State Highway', 'Major District Road', 'City Arterial') NOT NULL,
    chainage VARCHAR(50),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    speed_limit INT DEFAULT 60,
    lanes INT DEFAULT 4,
    surface_type VARCHAR(50) DEFAULT 'Asphalt Concrete',
    junction_type VARCHAR(100) DEFAULT 'Grade Separated',
    geometry_type VARCHAR(100) DEFAULT 'Straight Divided',
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    risk_level ENUM('Critical', 'High', 'Medium', 'Low') DEFAULT 'Low',
    has_pedestrian_crossing BOOLEAN DEFAULT FALSE,
    has_street_lights BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_demo_data BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. CAMERAS TABLE (PTZ, 4K Fixed, AI Vision Sensors)
CREATE TABLE IF NOT EXISTS cameras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    road_location_id INT NOT NULL,
    camera_code VARCHAR(50) NOT NULL UNIQUE,
    model_name VARCHAR(100),
    camera_type ENUM('PTZ Optical Zoom', '4K Ultra-HD Fixed', 'AI Dual-Spectrum Thermal', 'Smart Dome ANPR') DEFAULT '4K Ultra-HD Fixed',
    ip_address VARCHAR(50),
    stream_url VARCHAR(255),
    status ENUM('Online', 'Offline', 'Maintenance', 'Degraded') DEFAULT 'Online',
    fps INT DEFAULT 30,
    resolution VARCHAR(20) DEFAULT '3840x2160',
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_ai_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (road_location_id) REFERENCES road_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. CAMERA EVENTS (Anonymous Detection & Violations)
CREATE TABLE IF NOT EXISTS camera_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_id INT NOT NULL,
    event_type ENUM('Speeding', 'Near-Miss Conflict', 'Jaywalking', 'Lane Encroachment', 'Illegal Parking', 'Hazard Detected') NOT NULL,
    anonymous_object_id VARCHAR(50) NOT NULL,
    vehicle_class VARCHAR(50),
    speed_kmh DECIMAL(5,2),
    confidence DECIMAL(5,4) NOT NULL,
    snapshot_url VARCHAR(255),
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TRAFFIC OBSERVATIONS (Real-time and aggregate flow)
CREATE TABLE IF NOT EXISTS traffic_observations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    road_location_id INT NOT NULL,
    vehicle_count INT DEFAULT 0,
    car_count INT DEFAULT 0,
    bus_count INT DEFAULT 0,
    truck_count INT DEFAULT 0,
    twowheeler_count INT DEFAULT 0,
    pedestrian_count INT DEFAULT 0,
    avg_speed_kmh DECIMAL(5,2) DEFAULT 45.0,
    p85_speed_kmh DECIMAL(5,2) DEFAULT 62.0,
    density_pcu_per_km DECIMAL(6,2) DEFAULT 120.0,
    congestion_level ENUM('Fluid', 'Moderate', 'Dense', 'Severe Gridlock') DEFAULT 'Fluid',
    conflict_count INT DEFAULT 0,
    observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (road_location_id) REFERENCES road_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. WEATHER OBSERVATIONS
CREATE TABLE IF NOT EXISTS weather_observations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    temperature_c DECIMAL(4,1) DEFAULT 31.5,
    rainfall_mm DECIMAL(5,2) DEFAULT 0.00,
    humidity_pct INT DEFAULT 65,
    visibility_meters INT DEFAULT 9500,
    wind_speed_kmh DECIMAL(5,2) DEFAULT 14.0,
    weather_condition VARCHAR(100) DEFAULT 'Partly Cloudy',
    wet_road_factor DECIMAL(4,2) DEFAULT 1.00,
    aquaplaning_risk ENUM('None', 'Low', 'Moderate', 'High', 'Severe') DEFAULT 'None',
    alert_level ENUM('Normal', 'Advisory', 'Severe Warning') DEFAULT 'Normal',
    observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ROAD HAZARDS
CREATE TABLE IF NOT EXISTS road_hazards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    road_location_id INT NOT NULL,
    hazard_type ENUM(
        'Pothole / Road Surface Cratering',
        'Illegal Shoulder Parking / Encroachment',
        'Missing / Faded Road Markings',
        'Damaged Median / Missing Guardrail',
        'Waterlogging / Drainage Failure',
        'Malfunctioning Traffic Signal',
        'Blind Curve Visibility Obstruction',
        'Debris / Construction Material'
    ) NOT NULL,
    severity ENUM('Critical', 'Major', 'Minor') NOT NULL,
    status ENUM('Detected', 'Engineer Verified', 'Assigned', 'In Progress', 'Repaired', 'Closed') DEFAULT 'Detected',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    image_url VARCHAR(255),
    ai_confidence DECIMAL(5,4) DEFAULT 0.92,
    reported_by VARCHAR(100) DEFAULT 'AI Automated Video Inspection',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    repaired_at TIMESTAMP NULL,
    FOREIGN KEY (road_location_id) REFERENCES road_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. RISK ASSESSMENTS (XGBoost Prediction Logs)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    road_location_id INT NOT NULL,
    risk_score DECIMAL(5,2) NOT NULL,
    risk_category ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    predicted_accident_prob DECIMAL(5,4) NOT NULL,
    model_version VARCHAR(50) DEFAULT 'XGBoost-TN-v2.4',
    is_demo_data BOOLEAN DEFAULT TRUE,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (road_location_id) REFERENCES road_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. RISK FACTORS (SHAP Explainability Contributions)
CREATE TABLE IF NOT EXISTS risk_factors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    factor_name VARCHAR(150) NOT NULL,
    feature_value VARCHAR(100) NOT NULL,
    shap_value DECIMAL(6,3) NOT NULL,
    benchmark_norm VARCHAR(100),
    impact_direction ENUM('Increases Risk', 'Decreases Risk') NOT NULL,
    description TEXT,
    FOREIGN KEY (assessment_id) REFERENCES risk_assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. RECOMMENDATIONS (AI Safety Recommendations)
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    road_location_id INT NOT NULL,
    assessment_id INT NULL,
    recommendation_type ENUM(
        'Zebra Crossing & Solar Blinkers',
        'Pedestrian Pelican Signal',
        'Retroreflective Chevron Warning Signs',
        'Speed Table / Rumble Strips',
        'High-Friction Anti-Skid Surfacing',
        'Dangerous Junction Channelization & Redesign',
        'LED Street Lighting Retrofit',
        'Pothole Milling & Bituminous Resurfacing',
        'Crash Barrier & Guardrail Installation'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    problem_identified TEXT NOT NULL,
    risk_explanation TEXT NOT NULL,
    suggested_solution TEXT NOT NULL,
    responsible_department ENUM(
        'Highways Department / NHAI',
        'Traffic Police Department',
        'Municipal Corporation',
        'Transport Department'
    ) NOT NULL,
    priority ENUM('Urgent P1', 'High P2', 'Medium P3', 'Routine P4') NOT NULL,
    expected_risk_reduction_pct DECIMAL(5,2) NOT NULL,
    estimated_cost_inr DECIMAL(12,2) NOT NULL,
    estimated_timeline_days INT NOT NULL,
    status ENUM('Pending Approval', 'Approved', 'Rejected', 'Field Review Requested') DEFAULT 'Pending Approval',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (road_location_id) REFERENCES road_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES risk_assessments(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. WORK ORDERS (9-Stage Engineering Intervention Workflow)
CREATE TABLE IF NOT EXISTS work_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id INT NOT NULL,
    work_order_no VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    department ENUM(
        'Highways Department / NHAI',
        'Traffic Police Department',
        'Municipal Corporation',
        'Transport Department'
    ) NOT NULL,
    assigned_division VARCHAR(150),
    assigned_contractor_agency VARCHAR(150),
    sanction_order_no VARCHAR(100),
    sanctioned_budget_inr DECIMAL(12,2),
    current_stage ENUM(
        'AI Detection',
        'Recommendation',
        'Engineer Verification',
        'Department Approval',
        'Work Assignment',
        'Implementation',
        'Evidence Upload',
        'Verification',
        'Before/After Evaluation'
    ) NOT NULL DEFAULT 'Work Assignment',
    status ENUM('Draft', 'In Progress', 'Pending Inspection', 'Completed', 'On Hold') DEFAULT 'In Progress',
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE NULL,
    progress_percentage INT DEFAULT 0,
    before_photo_url VARCHAR(255),
    after_photo_url VARCHAR(255),
    verification_notes TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. INTERVENTIONS
CREATE TABLE IF NOT EXISTS interventions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_order_id INT NOT NULL UNIQUE,
    road_location_id INT NOT NULL,
    intervention_type VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    implementation_date DATE NOT NULL,
    engineer_in_charge VARCHAR(150) NOT NULL,
    contractor VARCHAR(150) NOT NULL,
    quality_inspection_passed BOOLEAN DEFAULT TRUE,
    before_photo_url VARCHAR(255),
    after_photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (road_location_id) REFERENCES road_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. BEFORE AND AFTER METRICS (Real vs SUMO Simulation)
CREATE TABLE IF NOT EXISTS before_after_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    intervention_id INT NOT NULL,
    road_location_id INT NOT NULL,
    evaluation_window VARCHAR(50) DEFAULT '90-Day Post-Intervention',
    traffic_density_before DECIMAL(6,2),
    traffic_density_after DECIMAL(6,2),
    avg_speed_before DECIMAL(5,2),
    avg_speed_after DECIMAL(5,2),
    p85_speed_before DECIMAL(5,2),
    p85_speed_after DECIMAL(5,2),
    waiting_time_sec_before DECIMAL(6,2),
    waiting_time_sec_after DECIMAL(6,2),
    queue_length_meters_before DECIMAL(6,2),
    queue_length_meters_after DECIMAL(6,2),
    conflict_frequency_before DECIMAL(6,2),
    conflict_frequency_after DECIMAL(6,2),
    historical_accidents_annual INT,
    post_intervention_accidents INT,
    crash_reduction_pct DECIMAL(5,2),
    is_sumo_simulation BOOLEAN DEFAULT FALSE,
    certified_by VARCHAR(150),
    verified_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
    FOREIGN KEY (road_location_id) REFERENCES road_locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    road_location_id INT NULL,
    alert_level ENUM('Critical', 'High', 'Medium', 'Info') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    source ENUM('AI Video Analytics', 'Weather Sensor Network', 'Traffic Control Room', 'Highway Patrol') NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INT NULL,
    dispatched_units VARCHAR(255) NULL,
    is_demo_data BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
    FOREIGN KEY (road_location_id) REFERENCES road_locations(id) ON DELETE SET NULL,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- SEED DATA - TAMIL NADU STATEWIDE ROAD SAFETY DEMONSTRATION DATA
-- All demo records are clearly cataloged for government testing.
-- =====================================================================

-- Districts Seed
INSERT INTO districts (id, name, zone, headquarters, total_roads_km, critical_hotspots, police_jurisdiction, contact_officer) VALUES
(1, 'Chennai', 'North Zone', 'Chennai City', 1845.50, 14, 'Greater Chennai Police Traffic Wing', 'Joint Commissioner (Traffic)'),
(2, 'Coimbatore', 'West Zone', 'Coimbatore City', 2420.20, 11, 'Coimbatore City Traffic Police', 'Deputy Commissioner (Traffic)'),
(3, 'Madurai', 'South Zone', 'Madurai', 2110.80, 9, 'Madurai City Traffic Police', 'Superintendent of Police'),
(4, 'Salem', 'West Zone', 'Salem', 2315.40, 8, 'Salem District Police', 'Deputy Superintendent (Traffic)'),
(5, 'Tiruchirappalli', 'Central Zone', 'Trichy', 1980.60, 7, 'Trichy City Police Traffic Branch', 'Assistant Commissioner (Traffic)'),
(6, 'Tiruppur', 'West Zone', 'Tiruppur', 1650.30, 6, 'Tiruppur City Police', 'Inspector of Police (Traffic)'),
(7, 'Erode', 'West Zone', 'Erode', 1780.00, 5, 'Erode District Traffic Police', 'Deputy Superintendent (Road Safety)'),
(8, 'Thanjavur', 'Central Zone', 'Thanjavur', 1540.75, 4, 'Thanjavur District Police', 'Sub-Divisional Officer (Traffic)'),
(9, 'Tirunelveli', 'South Zone', 'Tirunelveli', 1820.90, 6, 'Tirunelveli City Police', 'Traffic Planning Officer'),
(10, 'Vellore', 'North Zone', 'Vellore', 1490.20, 5, 'Vellore District Police', 'DSP Traffic Safety'),
(11, 'Dindigul', 'South Zone', 'Dindigul', 1675.40, 4, 'Dindigul Rural Police', 'Highway Patrol Inspector'),
(12, 'Kanchipuram', 'North Zone', 'Kanchipuram', 1390.10, 5, 'Kanchipuram Traffic Division', 'Traffic Enforcement Lead')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Users Seed (Admin@123 hashed via bcrypt)
-- Hash: $2b$12$GwoiMEz7E/N1f68jkFy2XO1bhWjs1TUIyWLp5DxyUxflvb127hSka
INSERT INTO users (id, email, password_hash, full_name, role, department, district_id, badge_id, phone, is_active) VALUES
(1, 'state.admin@tn.gov.in', '$2b$12$GwoiMEz7E/N1f68jkFy2XO1bhWjs1TUIyWLp5DxyUxflvb127hSka', 'Thiru K. Balasubramanian, IAS', 'State Administrator', 'Transport & Road Safety Commission', 1, 'TN-IAS-084', '+91 44 2567 1101', TRUE),
(2, 'dro.chennai@tn.gov.in', '$2b$12$GwoiMEz7E/N1f68jkFy2XO1bhWjs1TUIyWLp5DxyUxflvb127hSka', 'Dr. S. Meenakshi, DRO', 'District Road Safety Officer', 'District Collectorate Chennai', 1, 'TN-REV-341', '+91 44 2526 8200', TRUE),
(3, 'traffic.police@tn.gov.in', '$2b$12$GwoiMEz7E/N1f68jkFy2XO1bhWjs1TUIyWLp5DxyUxflvb127hSka', 'ADGP Pradeep Kumar, IPS', 'Traffic Police Officer', 'Tamil Nadu Traffic Police Headquarters', 1, 'TN-IPS-109', '+91 44 2844 7722', TRUE),
(4, 'highway.engg@tn.gov.in', '$2b$12$GwoiMEz7E/N1f68jkFy2XO1bhWjs1TUIyWLp5DxyUxflvb127hSka', 'Er. R. Senthil Nathan, SE', 'Highway Engineer', 'Highways Department & NHAI TN Cell', 2, 'TN-PWD-512', '+91 422 230 4490', TRUE),
(5, 'corp.officer@tn.gov.in', '$2b$12$GwoiMEz7E/N1f68jkFy2XO1bhWjs1TUIyWLp5DxyUxflvb127hSka', 'Er. M. Geetha, Superintending Engg', 'Municipal Officer', 'Greater Chennai Corporation / Municipalities', 1, 'TN-GCC-781', '+91 44 2538 4500', TRUE)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Road Locations Seed (Tamil Nadu Blackspots & High-Risk Corridors)
INSERT INTO road_locations (id, district_id, road_code, road_name, road_type, chainage, latitude, longitude, speed_limit, lanes, surface_type, junction_type, geometry_type, risk_score, risk_level, has_pedestrian_crossing, has_street_lights, is_demo_data) VALUES
(1, 1, 'NH-45 / GST-01', 'Kathipara Cloverleaf Junction, Guindy', 'National Highway', 'KM 12+400', 13.0067000, 80.2025000, 50, 6, 'Dense Bituminous Macadam', 'Grade Separated Interchange', 'Multi-level Grade Separated', 84.50, 'Critical', FALSE, TRUE, TRUE),
(2, 1, 'SH-49A / OMR-04', 'Sholinganallur Junction, OMR', 'State Highway', 'KM 19+200', 12.9010000, 80.2279000, 60, 6, 'Asphalt Concrete', 'Signalized 4-Way Junction', 'Dual Carriageway with Median', 78.20, 'Critical', TRUE, TRUE, TRUE),
(3, 1, 'NH-4 / PHR-08', 'Koyambedu Roundabout / Inner Ring Road', 'National Highway', 'KM 08+100', 13.0708000, 80.1944000, 40, 6, 'Asphalt Concrete', 'Signalized Rotary Interchange', 'High Volume Urban Arterial', 72.80, 'High', TRUE, TRUE, TRUE),
(4, 1, 'EVR-02 / PH-ROAD', 'Poonamallee High Road, Kilpauk', 'City Arterial', 'KM 04+600', 13.0805000, 80.2415000, 40, 4, 'Bituminous Concrete', 'Mid-Block Uncontrolled', 'Divided Urban Corridor', 63.40, 'High', FALSE, TRUE, TRUE),
(5, 1, 'AS-05 / ANNA-SALAI', 'Nandanam Signal Junction, Anna Salai', 'City Arterial', 'KM 07+800', 13.0289000, 80.2381000, 50, 6, 'Asphalt Concrete', 'Signalized T-Junction', 'Divided 6-Lane Transit Corridor', 48.00, 'Medium', TRUE, TRUE, TRUE),
(6, 2, 'NH-544 / AVN-01', 'Hope College Junction, Avinashi Road', 'National Highway', 'KM 148+300', 11.0267000, 77.0145000, 50, 6, 'Asphalt Concrete', 'Signalized Intersection with Flyover Ramp', 'Urban Expressway Corridor', 82.10, 'Critical', FALSE, TRUE, TRUE),
(7, 2, 'SH-162 / TRC-03', 'Singanallur Bus Stand Junction, Trichy Road', 'State Highway', 'KM 09+200', 10.9995000, 77.0258000, 40, 4, 'Bituminous Concrete', 'High-Density Uncontrolled Junction', 'Narrowing Dual Carriageway', 76.50, 'Critical', FALSE, TRUE, TRUE),
(8, 2, 'NH-83 / POL-02', 'Eachanari Temple Curve, Pollachi Road', 'National Highway', 'KM 11+400', 10.9328000, 76.9742000, 60, 4, 'Bituminous Concrete', 'Sharp Horizontal Curve', 'Curved Median-Divided Highway', 58.70, 'High', FALSE, TRUE, TRUE),
(9, 3, 'NH-38 / MAT-01', 'Mattuthavani Integrated Bus Terminal Junction', 'National Highway', 'KM 114+200', 9.9458000, 78.1584000, 40, 6, 'Asphalt Concrete', 'High Pedestrian Conflict Roundabout', 'Wide Arterial with Bus Merge', 80.40, 'Critical', TRUE, TRUE, TRUE),
(10, 3, 'NH-7 / VRD-04', 'Madurai Ring Road - Kappalur Toll Junction', 'National Highway', 'KM 24+800', 9.8450000, 78.0280000, 80, 4, 'Dense Bituminous Macadam', 'Unregulated U-Turn Cut', 'Divided Rural-Urban Highway', 68.90, 'High', FALSE, FALSE, TRUE),
(11, 4, 'NH-44 / SLM-01', 'Seelanaickenpatti Bypass Junction', 'National Highway', 'KM 202+400', 11.6245000, 78.1492000, 60, 4, 'Asphalt Concrete', 'Skewed Y-Junction with Heavy Freight', 'High Speed Freight Merging Zone', 85.00, 'Critical', FALSE, TRUE, TRUE),
(12, 4, 'SH-188 / 5RD-02', 'Five Roads Junction, Salem City', 'State Highway', 'KM 03+100', 11.6643000, 78.1460000, 40, 6, 'Bituminous Concrete', 'Multi-Leg Signalized Junction', 'Dense Commercial Core Intersection', 52.30, 'High', TRUE, TRUE, TRUE),
(13, 5, 'NH-83 / PAL-01', 'Palpannai Roundabout, Chennai-Trichy NH', 'National Highway', 'KM 312+500', 10.8220000, 78.7180000, 50, 4, 'Asphalt Concrete', 'Substandard Radius Rotary', 'Heavy Mixed Vehicle Choke Point', 79.80, 'Critical', FALSE, TRUE, TRUE),
(14, 5, 'SH-62 / JNC-02', 'Trichy Central Bus Stand Junction', 'City Arterial', 'KM 02+200', 10.8015000, 78.6885000, 30, 4, 'Bituminous Concrete', 'High Pedestrian Churn Terminal Gate', 'Congested Transit Node', 61.20, 'High', TRUE, TRUE, TRUE),
(15, 6, 'SH-172 / PLD-01', 'Palladam Road - Cotton Market Junction', 'State Highway', 'KM 04+500', 11.0925000, 77.3482000, 40, 4, 'Bituminous Concrete', 'Offset 4-Leg Intersection', 'Narrow Mixed Industrial Corridor', 67.40, 'High', FALSE, TRUE, TRUE),
(16, 7, 'SH-96 / PRD-01', 'Thindal Murugan Temple Curve, Perundurai Road', 'State Highway', 'KM 06+800', 11.3150000, 77.6850000, 50, 4, 'Bituminous Concrete', 'Blind S-Curve with School Zone', 'Curved Arterial with Encroachment', 71.00, 'High', TRUE, TRUE, TRUE),
(17, 8, 'NH-67 / TJV-01', 'New Bus Stand Junction, Trichy-Thanjavur Road', 'National Highway', 'KM 48+100', 10.7680000, 79.1120000, 50, 4, 'Bituminous Concrete', 'T-Junction with Intercity Bus Ingress', 'Suburban Highway Gateway', 42.50, 'Medium', TRUE, TRUE, TRUE),
(18, 9, 'NH-44 / TNV-01', 'Vannarpettai Flyover Grade Approach', 'National Highway', 'KM 148+800', 8.7280000, 77.7280000, 50, 4, 'Asphalt Concrete', 'Flyover Ingress Blind Conflict Zone', 'Grade Elevation Transition Point', 64.00, 'High', FALSE, TRUE, TRUE),
(19, 10, 'NH-48 / VLR-01', 'Katpadi Railway Station Approach, NH-48 Link', 'National Highway', 'KM 12+100', 12.9710000, 79.1380000, 40, 4, 'Bituminous Concrete', 'Station Plaza Congested Node', 'High Pedestrian/Auto Conflict Choke', 59.30, 'High', TRUE, TRUE, TRUE),
(20, 11, 'NH-44 / DGL-01', 'Dindigul Bypass - Palani Road Cut', 'National Highway', 'KM 418+200', 10.3750000, 77.9620000, 80, 4, 'Dense Bituminous Macadam', 'Uncontrolled Median Cut for Rural Traffic', 'High Speed Dual Carriageway Cut', 75.60, 'Critical', FALSE, FALSE, TRUE)
ON DUPLICATE KEY UPDATE road_name=VALUES(road_name);

-- Cameras Seed
INSERT INTO cameras (id, road_location_id, camera_code, model_name, camera_type, ip_address, stream_url, status, fps, resolution, is_ai_enabled) VALUES
(1, 1, 'CAM-CHE-001', 'Hikvision DarkFighter AI 4K', '4K Ultra-HD Fixed', '10.144.12.101', 'rtsp://demo.roadguard.tn.gov/che001/stream1', 'Online', 30, '3840x2160', TRUE),
(2, 1, 'CAM-CHE-002', 'Axis Q6225-LE PTZ Optical', 'PTZ Optical Zoom', '10.144.12.102', 'rtsp://demo.roadguard.tn.gov/che002/stream1', 'Online', 30, '1920x1080', TRUE),
(3, 2, 'CAM-CHE-003', 'Dahua TiOC AI Smart Vision', '4K Ultra-HD Fixed', '10.144.12.103', 'rtsp://demo.roadguard.tn.gov/che003/stream1', 'Online', 25, '3840x2160', TRUE),
(4, 3, 'CAM-CHE-004', 'Hanwha Techwin Wisenet X', 'PTZ Optical Zoom', '10.144.12.104', 'rtsp://demo.roadguard.tn.gov/che004/stream1', 'Online', 30, '1920x1080', TRUE),
(5, 6, 'CAM-CBE-001', 'Hikvision DeepInView AI Pro', '4K Ultra-HD Fixed', '10.142.20.101', 'rtsp://demo.roadguard.tn.gov/cbe001/stream1', 'Online', 30, '3840x2160', TRUE),
(6, 7, 'CAM-CBE-002', 'Bosch Flexidome IP Starlight', '4K Ultra-HD Fixed', '10.142.20.102', 'rtsp://demo.roadguard.tn.gov/cbe002/stream1', 'Online', 30, '3840x2160', TRUE),
(7, 9, 'CAM-MDU-001', 'Axis P3248-LVE High Dynamic', '4K Ultra-HD Fixed', '10.145.30.101', 'rtsp://demo.roadguard.tn.gov/mdu001/stream1', 'Online', 25, '3840x2160', TRUE),
(8, 11, 'CAM-SLM-001', 'Uniview Prime AI Radar-Cam', 'AI Dual-Spectrum Thermal', '10.142.40.101', 'rtsp://demo.roadguard.tn.gov/slm001/stream1', 'Online', 30, '1920x1080', TRUE),
(9, 13, 'CAM-TRY-001', 'Hikvision AcuSense Smart Dome', 'Smart Dome ANPR', '10.143.50.101', 'rtsp://demo.roadguard.tn.gov/try001/stream1', 'Online', 30, '1920x1080', TRUE),
(10, 16, 'CAM-ERD-001', 'Axis M1137 AI Network Cam', '4K Ultra-HD Fixed', '10.142.60.101', 'rtsp://demo.roadguard.tn.gov/erd001/stream1', 'Online', 25, '1920x1080', TRUE)
ON DUPLICATE KEY UPDATE camera_code=VALUES(camera_code);

-- Camera Events Seed
INSERT INTO camera_events (id, camera_id, event_type, anonymous_object_id, vehicle_class, speed_kmh, confidence, snapshot_url) VALUES
(1, 1, 'Speeding', 'TN-V-1029', 'Heavy Truck / Multi-Axle', 78.4, 0.9420, '/uploads/events/speed_truck_01.jpg'),
(2, 1, 'Near-Miss Conflict', 'TN-V-1034', 'Private Sedan', 54.2, 0.9150, '/uploads/events/conflict_sedan_01.jpg'),
(3, 3, 'Jaywalking', 'TN-P-0442', 'Pedestrian', 4.8, 0.9630, '/uploads/events/jaywalk_omr_01.jpg'),
(4, 5, 'Lane Encroachment', 'TN-V-2109', 'Intercity Bus', 62.1, 0.8990, '/uploads/events/lane_bus_01.jpg'),
(5, 8, 'Illegal Parking', 'TN-V-3481', 'Commercial Freight Van', 0.0, 0.9780, '/uploads/events/illegal_park_01.jpg')
ON DUPLICATE KEY UPDATE anonymous_object_id=VALUES(anonymous_object_id);

-- Traffic Observations Seed
INSERT INTO traffic_observations (id, road_location_id, vehicle_count, car_count, bus_count, truck_count, twowheeler_count, pedestrian_count, avg_speed_kmh, p85_speed_kmh, density_pcu_per_km, congestion_level, conflict_count) VALUES
(1, 1, 3840, 1420, 280, 540, 1600, 140, 38.5, 64.2, 210.50, 'Dense', 18),
(2, 2, 4210, 1950, 310, 220, 1730, 680, 42.0, 68.0, 235.00, 'Dense', 24),
(3, 6, 3150, 1200, 240, 410, 1300, 420, 36.2, 58.4, 185.20, 'Moderate', 15),
(4, 7, 2890, 980, 350, 320, 1240, 890, 28.4, 46.0, 240.00, 'Severe Gridlock', 32),
(5, 9, 3450, 1100, 510, 390, 1450, 1120, 24.8, 44.5, 260.40, 'Severe Gridlock', 41),
(6, 11, 2600, 680, 220, 890, 810, 95, 62.5, 84.0, 145.00, 'Moderate', 12)
ON DUPLICATE KEY UPDATE vehicle_count=VALUES(vehicle_count);

-- Weather Observations Seed (Tamil Nadu Districts)
INSERT INTO weather_observations (id, district_id, temperature_c, rainfall_mm, humidity_pct, visibility_meters, wind_speed_kmh, weather_condition, wet_road_factor, aquaplaning_risk, alert_level) VALUES
(1, 1, 32.4, 14.5, 82, 4200, 24.0, 'Moderate Coastal Monsoon Showers', 1.45, 'Moderate', 'Advisory'),
(2, 2, 27.8, 3.2, 74, 7800, 12.5, 'Scattered Light Showers', 1.15, 'Low', 'Normal'),
(3, 3, 34.1, 0.0, 58, 9800, 16.0, 'Hot and Dry Sunlight', 1.00, 'None', 'Normal'),
(4, 4, 30.5, 28.0, 88, 2800, 28.5, 'Heavy Downpour & Surface Flooding', 1.80, 'High', 'Severe Warning'),
(5, 5, 33.0, 0.0, 62, 9500, 14.0, 'Clear High Visibility', 1.00, 'None', 'Normal'),
(6, 6, 29.2, 8.4, 78, 6200, 18.0, 'Intermittent Rain', 1.30, 'Low', 'Normal'),
(7, 7, 29.8, 12.0, 80, 5500, 15.0, 'Rain with Slippery Road Surface', 1.38, 'Moderate', 'Advisory')
ON DUPLICATE KEY UPDATE rainfall_mm=VALUES(rainfall_mm);

-- Road Hazards Seed
INSERT INTO road_hazards (id, road_location_id, hazard_type, severity, status, latitude, longitude, image_url, ai_confidence, reported_by) VALUES
(1, 1, 'Pothole / Road Surface Cratering', 'Critical', 'Assigned', 13.0071000, 80.2031000, '/uploads/hazards/pothole_kathipara.jpg', 0.9420, 'AI Automated Video Inspection'),
(2, 2, 'Illegal Shoulder Parking / Encroachment', 'Major', 'In Progress', 12.9015000, 80.2285000, '/uploads/hazards/parking_omr.jpg', 0.9150, 'AI Camera Feed CAM-CHE-003'),
(3, 7, 'Missing / Faded Road Markings', 'Critical', 'Engineer Verified', 10.9998000, 77.0261000, '/uploads/hazards/markings_singanallur.jpg', 0.8890, 'District Highway Survey AI'),
(4, 9, 'Blind Curve Visibility Obstruction', 'Major', 'Assigned', 9.9462000, 78.1589000, '/uploads/hazards/obstruction_mattuthavani.jpg', 0.9340, 'Traffic Police Highway Patrol'),
(5, 11, 'Waterlogging / Drainage Failure', 'Critical', 'In Progress', 11.6248000, 78.1497000, '/uploads/hazards/waterlog_salem.jpg', 0.9620, 'Weather Sensor & Drone Feed')
ON DUPLICATE KEY UPDATE hazard_type=VALUES(hazard_type);

-- Risk Assessments Seed (XGBoost Outputs)
INSERT INTO risk_assessments (id, road_location_id, risk_score, risk_category, confidence_score, predicted_accident_prob, model_version, is_demo_data) VALUES
(1, 1, 84.50, 'Critical', 0.9320, 0.4280, 'XGBoost-TN-v2.4', TRUE),
(2, 2, 78.20, 'Critical', 0.9140, 0.3650, 'XGBoost-TN-v2.4', TRUE),
(3, 6, 82.10, 'Critical', 0.9250, 0.4020, 'XGBoost-TN-v2.4', TRUE),
(4, 7, 76.50, 'Critical', 0.8980, 0.3420, 'XGBoost-TN-v2.4', TRUE),
(5, 9, 80.40, 'Critical', 0.9410, 0.3890, 'XGBoost-TN-v2.4', TRUE),
(6, 11, 85.00, 'Critical', 0.9520, 0.4450, 'XGBoost-TN-v2.4', TRUE),
(7, 4, 63.40, 'High', 0.8750, 0.2280, 'XGBoost-TN-v2.4', TRUE),
(8, 16, 71.00, 'High', 0.8890, 0.2850, 'XGBoost-TN-v2.4', TRUE)
ON DUPLICATE KEY UPDATE risk_score=VALUES(risk_score);

-- Risk Factors Seed (SHAP Explainability Values)
INSERT INTO risk_factors (id, assessment_id, factor_name, feature_value, shap_value, benchmark_norm, impact_direction, description) VALUES
(1, 1, 'Heavy Commercial Vehicle Ratio', '22% Multi-Axle Trucks', 22.400, 'Benchmark <= 8%', 'Increases Risk', 'High percentage of heavy freight creating severe momentum differentials and braking buffer conflicts.'),
(2, 1, 'Inadequate Deceleration Lane Length', '45 meters actual', 18.200, 'IRC Standard: 90m', 'Increases Risk', 'Short weaving section at Guindy flyover split causes rapid unsafe lane changes at interchange approach.'),
(3, 1, 'Wet Road Surface Friction Index', '0.34 BPN Skid Coeff', 14.600, 'Safe Standard >= 0.55', 'Increases Risk', 'Rainfall has reduced bituminous pavement skid resistance, increasing stopping distance by 38%.'),
(4, 1, 'High-Luminance Mast Lighting', 'Operational (65 lux)', -8.500, 'Min Standard 40 lux', 'Decreases Risk', 'Adequate high-mast LED street lighting offsets nighttime pedestrian risk.'),
(5, 2, 'Unprotected Mid-Block Jaywalking Volume', '680 pedestrians/hr', 26.500, 'Critical > 200/hr', 'Increases Risk', 'IT employees crossing 6 lanes without grade-separated foot overbridge or pelican signal.'),
(6, 2, 'P85 Excessive Operating Speed', '68.0 km/h in 40 zone', 19.300, 'Speed Limit: 40 km/h', 'Increases Risk', 'Wide straight geometry induces excessive speeding during off-peak and transition hours.'),
(7, 3, 'Lack of Raised Pedestrian Crossing', 'Absent at college gate', 24.800, 'Mandatory in Urban Corridor', 'Increases Risk', 'Major college student crowd traversing multilane arterial against 60 km/h vehicle traffic.'),
(8, 6, 'Freight Speed Differential on Ingress', 'Bypass Speed 84 km/h', 28.100, 'Merge Standard 45 km/h', 'Increases Risk', 'Vehicles emerging from rural bypass into NH-44 corridor at highway speed without deceleration chicane.')
ON DUPLICATE KEY UPDATE factor_name=VALUES(factor_name);

-- Recommendations Seed
INSERT INTO recommendations (id, road_location_id, assessment_id, recommendation_type, title, problem_identified, risk_explanation, suggested_solution, responsible_department, priority, expected_risk_reduction_pct, estimated_cost_inr, estimated_timeline_days, status, remarks) VALUES
(1, 1, 1, 'High-Friction Anti-Skid Surfacing', 'Installation of Calcined Bauxite Anti-Skid Surfacing on Kathipara Ramps', 'Repeated wet weather skidding crashes on tight descending loops of Kathipara grade separator.', 'Friction coefficient drops to 0.34 during monsoon rain, exceeding tire adherence limits at 50 km/h.', 'Apply 3mm high-friction epoxy thermosetting resin with calcined bauxite aggregate to elevate skid resistance to 0.70 BPN.', 'Highways Department / NHAI', 'Urgent P1', 42.50, 3850000.00, 21, 'Approved', 'Administrative sanction accorded under TN Road Safety Fund Scheme 2026.'),
(2, 2, 2, 'Pedestrian Pelican Signal', 'Automated Push-Button Pelican Signal with Red-Light Enforcement at Sholinganallur', 'Massive pedestrian surge crossing 6-lane IT highway without signal protection, resulting in 4 fatalities in 12 months.', 'Peak pedestrian volume exceeds 680 persons/hr crossing against 68 km/h vehicular flow.', 'Install demand-actuated Pelican crossing with countdown display, 100m advance yellow flashers, and CCTV red-light enforcement.', 'Traffic Police Department', 'Urgent P1', 58.00, 1850000.00, 14, 'Approved', 'Joint inspection completed with Chennai City Police Traffic Wing.'),
(3, 6, 3, 'Speed Table / Rumble Strips', 'Raised Speed Table with Solar Warning Flasher at Hope College Gate', 'Students from engineering colleges crossing Avinashi road face vehicles exceeding 60 km/h on downhill grade.', 'High impact hazard due to lack of physical speed calming and blind sightline behind bus shelters.', 'Construct IRC:99 compliant flat-topped raised speed table (100mm height) with thermoplastic rumble strips and overhead solar blinkers.', 'Highways Department / NHAI', 'Urgent P1', 46.00, 920000.00, 10, 'Approved', 'Technical feasibility verified by SE Highways Coimbatore Division.'),
(4, 7, 4, 'Dangerous Junction Channelization & Redesign', 'Singanallur Bus Terminal Channelization and Median Island Retrofit', 'Chaotic mixed traffic merging with 350 city buses/hour exiting terminal without dedicated turning pocket.', 'Unregulated weaving angle causes frequent side-swipe collisions and long gridlock queues.', 'Install concrete splitter islands, dedicated bus priority channel, and high-intensity retroreflective road studs.', 'Municipal Corporation', 'High P2', 36.50, 4600000.00, 30, 'Pending Approval', 'Awaiting Municipal Corporation Council budget clearance.'),
(5, 11, 6, 'Retroreflective Chevron Warning Signs', 'Curved Deceleration Flare with Chevron Arrays at Seelanaickenpatti Bypass', 'Heavy freight vehicles overturning while taking high-speed skewed turn into NH-44 Salem bypass.', 'Inadequate night curve delineation and absence of speed reduction advisory signs.', 'Install 16 high-intensity microprismatic chevron warning boards (Class XI), speed radar display, and cat-eye delineators.', 'Highways Department / NHAI', 'Urgent P1', 52.00, 1450000.00, 15, 'Approved', 'Priority sanctioned by District Collector / Chairman DRSC Salem.')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Work Orders Seed (Government 9-Stage Workflow)
INSERT INTO work_orders (id, recommendation_id, work_order_no, title, department, assigned_division, assigned_contractor_agency, sanction_order_no, sanctioned_budget_inr, current_stage, status, start_date, target_completion_date, progress_percentage, before_photo_url, after_photo_url, verification_notes) VALUES
(1, 1, 'TN-HWD-2026-WO-4182', 'Anti-Skid Epoxy Pavement Treatment at Kathipara Interchange', 'Highways Department / NHAI', 'Chennai Metropolitan Circle (South)', 'M/s Southern Pavement Tech Pvt Ltd', 'GO-MS-TRANS-2026/89', 3850000.00, 'Before/After Evaluation', 'Completed', '2026-08-01', '2026-08-22', 100, '/uploads/evidence/before_kathipara.jpg', '/uploads/evidence/after_kathipara.jpg', 'Quality test verified: British Pendulum Number reached 0.72. Friction test passed IRC specifications.'),
(2, 2, 'TN-TPD-2026-WO-1094', 'Pelican Smart Pedestrian Crossing Installation - Sholinganallur OMR', 'Traffic Police Department', 'Traffic Planning & Tech Wing Chennai', 'M/s KELTRON Traffic Systems Ltd', 'POL-TECH-2026/412', 1850000.00, 'Verification', 'Completed', '2026-08-15', '2026-08-29', 100, '/uploads/evidence/before_omr.jpg', '/uploads/evidence/after_omr.jpg', 'Signal timings synchronized with SCATS junction controller. Push buttons and acoustic chimes operational.'),
(3, 3, 'TN-HWD-2026-WO-3301', 'Raised Speed Table & Solar Blinker Array - Avinashi Road Hope College', 'Highways Department / NHAI', 'Coimbatore Division (Road Safety)', 'M/s Sri Murugan Infrastructure', 'GO-HWD-2026/158', 920000.00, 'Implementation', 'In Progress', '2026-10-10', '2026-11-05', 75, '/uploads/evidence/before_avinashi.jpg', NULL, 'Bituminous profile finished. Thermoplastic marking and solar blinker synchronization underway.'),
(4, 5, 'TN-HWD-2026-WO-5519', 'Highway Deceleration Chevron & Radar Warning - Seelanaickenpatti Salem', 'Highways Department / NHAI', 'Salem Circle NH Wing', 'M/s Kongu Highway Works', 'NHAI-RO-CHE-2026/71', 1450000.00, 'Work Assignment', 'In Progress', '2026-10-25', '2026-11-15', 30, '/uploads/evidence/before_salem.jpg', NULL, 'Contractor mobilized. High-intensity sign posts foundation digging completed.')
ON DUPLICATE KEY UPDATE work_order_no=VALUES(work_order_no);

-- Interventions Seed
INSERT INTO interventions (id, work_order_id, road_location_id, intervention_type, description, implementation_date, engineer_in_charge, contractor, quality_inspection_passed, before_photo_url, after_photo_url) VALUES
(1, 1, 1, 'High-Friction Anti-Skid Surfacing', 'Full calcined bauxite epoxy treatment across 420m length of tight curved ramp.', '2026-08-20', 'Er. S. Rajendran, Divisional Engineer (Highways)', 'M/s Southern Pavement Tech Pvt Ltd', TRUE, '/uploads/evidence/before_kathipara.jpg', '/uploads/evidence/after_kathipara.jpg'),
(2, 2, 2, 'Pedestrian Pelican Signal', 'Dual side intelligent demand-responsive pedestrian signal with infrared waiting zone detection.', '2026-08-28', 'Er. N. Karthikeyan, Tech Executive Traffic Police', 'M/s KELTRON Traffic Systems Ltd', TRUE, '/uploads/evidence/before_omr.jpg', '/uploads/evidence/after_omr.jpg')
ON DUPLICATE KEY UPDATE work_order_id=VALUES(work_order_id);

-- Before & After Metrics Seed (Actual Observations vs SUMO Simulation)
INSERT INTO before_after_metrics (id, intervention_id, road_location_id, evaluation_window, traffic_density_before, traffic_density_after, avg_speed_before, avg_speed_after, p85_speed_before, p85_speed_after, waiting_time_sec_before, waiting_time_sec_after, queue_length_meters_before, queue_length_meters_after, conflict_frequency_before, conflict_frequency_after, historical_accidents_annual, post_intervention_accidents, crash_reduction_pct, is_sumo_simulation, certified_by, verified_at) VALUES
(1, 1, 1, '60-Day Post-Intervention Field Audit', 210.50, 204.20, 38.5, 36.8, 64.2, 48.5, 14.5, 11.2, 85.0, 52.0, 18.0, 2.5, 14, 1, 78.50, FALSE, 'Er. R. Senthil Nathan, SE Highways', '2026-10-20'),
(2, 2, 2, '60-Day Post-Intervention Field Audit', 235.00, 228.00, 42.0, 35.4, 68.0, 44.0, 78.0, 22.5, 110.0, 65.0, 24.0, 3.0, 9, 0, 88.00, FALSE, 'ADGP Pradeep Kumar, IPS', '2026-10-25'),
(3, 1, 1, 'SUMO TraCI Digital Twin Forecast', 210.50, 205.00, 38.5, 37.0, 64.2, 50.0, 15.0, 12.0, 86.0, 54.0, 18.0, 3.5, 14, 2, 74.20, TRUE, 'SUMO Microscopic Engine v1.19.0', '2026-07-28')
ON DUPLICATE KEY UPDATE evaluation_window=VALUES(evaluation_window);

-- Alerts Seed
INSERT INTO alerts (id, district_id, road_location_id, alert_level, title, message, source, is_acknowledged, dispatched_units, is_demo_data) VALUES
(1, 1, 1, 'Critical', 'Multiple Skidding & Near-Miss Incident at Kathipara Loop 2', 'AI camera CAM-CHE-001 detected 4 sudden braking incidents within 10 minutes during wet surface conditions. High risk of rear-end pileup.', 'AI Video Analytics', FALSE, 'Traffic Patrol Unit North-04 dispatched for speed buffering', TRUE),
(2, 4, 11, 'Critical', 'Heavy Waterlogging & Stalled Multi-Axle Vehicle on NH-44 Bypass', 'Flash runoff accumulating at Seelanaickenpatti underpass. Lane 1 and 2 blocked. Average vehicle speed reduced to 12 km/h.', 'Weather Sensor Network', FALSE, 'Highway Patrol Salem & Quick Response Recovery Crane', TRUE),
(3, 2, 7, 'High', 'Illegal School Bus Loading Encroachment at Singanallur', 'Dual-lane obstruction detected by CAM-CBE-002 creating tailback extending 350 meters on Trichy Road.', 'AI Video Analytics', TRUE, 'Singanallur Traffic Police Station Ward-3', TRUE),
(4, 1, 2, 'Medium', 'Faded Pedestrian Markings Alert on OMR Sholinganallur', 'Automated road marking visibility survey rated zebra marking reflectivity at 28 mcd/m2/lux (threshold: 100).', 'Highway Patrol', TRUE, 'GCC Works Department Zone-14 Scheduled', TRUE),
(5, 3, 9, 'Critical', 'High-Density Jaywalking Surge at Mattuthavani Gate 1', 'Night festival surge: 1200+ pedestrians/hr attempting uncontrolled crossing on NH-38 corridor.', 'Traffic Control Room', FALSE, 'Madurai City Traffic Quick Reaction Force', TRUE)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Audit Logs Seed
INSERT INTO audit_logs (id, user_id, action, resource, details, ip_address) VALUES
(1, 1, 'USER_LOGIN', 'Authentication', 'State Administrator Thiru K. Balasubramanian, IAS logged into Command Center.', '10.0.1.5'),
(2, 4, 'APPROVE_RECOMMENDATION', 'Recommendations', 'Highway Engineer approved anti-skid surfacing proposal for Kathipara (REC-01).', '10.142.1.22'),
(3, 3, 'DISPATCH_PATROL', 'Alerts', 'Dispatched Traffic Patrol Unit North-04 to Kathipara Cloverleaf interchange.', '10.144.5.12'),
(4, 5, 'UPDATE_WORK_ORDER', 'WorkOrders', 'Updated progress on WO-1094 (Pelican Signal Sholinganallur) to 100%.', '10.0.2.18'),
(5, 2, 'EXPORT_AUDIT_REPORT', 'Reports', 'Generated statewide Road Safety Compliance and Blackspot Audit Report Q3.', '10.144.1.88')
ON DUPLICATE KEY UPDATE action=VALUES(action);
