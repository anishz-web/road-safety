# ROADGUARD TN
## AI-Powered Statewide Predictive Road Safety and Traffic Intervention Management System
**Government of Tamil Nadu • Road Safety Commission • Transport & Highways Department**

---

### Project Overview
**ROADGUARD TN** is a centralized decision-support command center engineered specifically for the State of Tamil Nadu. It ingests traffic optical feeds, geometry attributes, weather variables, hazard inspections, and historical collision patterns to forecast hazardous road conditions *before* fatal crashes occur, explain predictive drivers via SHAP explainability, recommend calibrated civil engineering interventions, and audit before-and-after post-implementation safety gains.

Designed for:
- Tamil Nadu Road Safety Department
- Greater Chennai & City Traffic Police Wings
- State Highways Department / NHAI Tamil Nadu Regional Office
- Municipal Corporations (GCC, Coimbatore, Madurai, Trichy, Salem, Tiruppur, Erode)
- District Road Safety Committees (DRSC) chaired by District Collectors

---

### End-to-End Government Lifecycle
```
OBSERVE → DETECT → PREDICT → EXPLAIN → RECOMMEND → HUMAN APPROVAL → IMPLEMENT → VERIFY → BEFORE/AFTER EVALUATION
```

---

### 1. Technology Stack

| Layer | Component | Implementation |
|---|---|---|
| **Frontend** | React.js (Vite) | Single Page Application with React Router DOM v7 |
| **Styling** | Tailwind CSS v4 | Professional Dark Navy Blue Command Center Theme |
| **Icons** | Lucide React | High-contrast vector government iconography |
| **GIS Mapping** | React Leaflet | Interactive Tamil Nadu district maps & color-coded risk markers |
| **Visualizations** | Recharts | DIurnal curves, SHAP waterfalls, monthly trajectories, before/after bars |
| **Backend** | Python 3.11 + FastAPI | Async REST API with Pydantic validation & OpenAPI documentation |
| **Database** | MySQL 8.0 / SQLAlchemy | 16 Relational tables, Foreign Keys, Cascades, Indexes, and seed datasets |
| **Computer Vision** | YOLO + OpenCV | Vehicle/pedestrian counting, hazard detection, video upload inspection |
| **Anonymous Tracking**| ByteTrack | Temporary anonymized session IDs (`TN-V-1029`, `TN-P-0442`, zero PII) |
| **Predictive Model** | XGBoost Regressor | Physics-calibrated Tamil Nadu road risk model (`RMSE: 5.09`, `R2: 0.929`) |
| **AI Explainability**| SHAP (TreeExplainer)| Feature attribution breakdown of positive and mitigating risk factors |
| **Traffic Simulation**| Eclipse SUMO + TraCI| Microscopic car-following digital twin comparing engineering interventions |

---

### 2. Sixteen Operational Modules

1. **Login Portal (`/login`)**: Secure role-authenticated portal with 1-click official government persona switcher.
2. **Main Dashboard (`/`)**: Executive command center with real-time KPIs, district risk rankings, active camera counts, and 6-month crash trends.
3. **Tamil Nadu Road Safety Map (`/map`)**: Interactive React Leaflet map plotting verified blackspots across Chennai, Coimbatore, Madurai, Salem, Trichy, Erode, Tiruppur, etc.
4. **Camera Monitoring (`/cameras`)**: Live optical CCTV stream simulator with ByteTrack anonymous bounding boxes, vehicle counting, and upload analysis tool.
5. **AI Road Risk Analysis (`/risk-analysis`)**: XGBoost predictive sandbox allowing engineers to adjust corridor parameters and view SHAP attribution charts.
6. **Weather Intelligence (`/weather`)**: Real-time precipitation and fog monitoring linked with empirical pavement skid resistance curves.
7. **Hazard Detection (`/hazards`)**: Road defect tracking (potholes, illegal parking, missing signage, waterlogging) with field defect reporting.
8. **Safety Recommendations (`/recommendations`)**: AI-generated engineering proposals with formal human approval/rejection workflows.
9. **Intervention Work Orders (`/work-orders`)**: 9-stage engineering workflow tracker with photographic evidence upload and progress bars.
10. **Digital Twin Traffic Simulation (`/simulation`)**: SUMO TraCI microscopic simulation engine measuring vehicle delay, queue length, and surrogate TTC conflicts.
11. **Before-and-After Comparison (`/before-after`)**: Post-implementation audit dashboard distinguishing observed metrics from SUMO simulations.
12. **Department Analytics (`/analytics`)**: Departmental resolution speed leaderboard, 24-hour diurnal risk curve, and DRSI rankings.
13. **Alerts & Notifications (`/alerts`)**: Multi-agency dispatch center for immediate highway patrol unit deployment.
14. **Official Reports (`/reports`)**: Government Gazette formatted road safety compliance and blackspot audit reports with PDF print layout.
15. **User and Role Management (`/users`)**: 5-tier role-based access control (RBAC) with complete security audit trail.
16. **Settings (`/settings`)**: Model cutoff calibration, MySQL connection verification, and demonstration mode flags.

---

### 3. User Roles & Default Credentials

Password for all accounts: `Admin@123`

| Role | Officer Name | Department | Badge ID |
|---|---|---|---|
| **State Administrator** | Thiru K. Balasubramanian, IAS | Transport & Road Safety Commission | `TN-IAS-084` |
| **District Road Safety Officer** | Dr. S. Meenakshi, DRO | District Collectorate Chennai | `TN-REV-341` |
| **Traffic Police Officer** | ADGP Pradeep Kumar, IPS | Tamil Nadu Traffic Police HQ | `TN-IPS-109` |
| **Highway Engineer** | Er. R. Senthil Nathan, SE | Highways Department & NHAI TN Cell | `TN-PWD-512` |
| **Municipal Officer** | Er. M. Geetha, Superintending Engg | Greater Chennai Corporation | `TN-GCC-781` |

*(All 5 profiles can also be tested instantly using the 1-click persona buttons on the Login page and top navigation bar).*

---

### 4. Database Schema (`database/database.sql`)

The system uses MySQL 8.0 (`roadguard_tn`) with 16 interconnected tables:
- `districts`
- `users`
- `road_locations`
- `cameras`
- `camera_events`
- `traffic_observations`
- `weather_observations`
- `road_hazards`
- `risk_assessments`
- `risk_factors`
- `recommendations`
- `work_orders`
- `interventions`
- `before_after_metrics`
- `alerts`
- `audit_logs`

To re-seed or inspect the database:
```powershell
Get-Content database\database.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot roadguard_tn
```

---

### 5. Running the Application on Windows

#### A. Start the Python FastAPI Backend (Terminal 1)
```powershell
# From project root
& "backend\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API will be available at:* `http://127.0.0.1:8000`  
*Swagger Documentation:* `http://127.0.0.1:8000/docs`

#### B. Start the React Frontend (Terminal 2)
```powershell
# From project root
cd frontend
npm run dev
```
*Frontend will be available at:* `http://localhost:5173`

---

### 6. AI Model Re-Training Pipeline
To re-train the XGBoost model on newly recorded crash data:
```powershell
& "backend\.venv\Scripts\python.exe" backend\app\ai\train_risk_model.py
```
This updates `ai_models/xgboost_risk_model.json` and `ai_models/shap_explainer.pkl` automatically.

