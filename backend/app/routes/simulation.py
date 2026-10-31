from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import RoadLocation
from backend.app.ai.sumo_simulation import SumoSimulationEngine

router = APIRouter(prefix="/api/simulation", tags=["Digital Twin Traffic Simulation"])

@router.get("/run")
def run_digital_twin_simulation(
    location_id: int = Query(1),
    scenario: str = Query("roundabout_pedestrian"),
    flow_rate: int = Query(1800),
    duration_seconds: int = Query(3600),
    db: Session = Depends(get_db)
):
    """
    Simulates traffic flow and surrogate safety conflicts comparing baseline vs selected intervention.
    """
    engine = SumoSimulationEngine.get_instance()
    results = engine.run_simulation(
        location_id=location_id,
        intervention_scenario=scenario,
        vehicle_flow_rate=flow_rate,
        duration_seconds=duration_seconds
    )

    road = db.query(RoadLocation).filter(RoadLocation.id == location_id).first()
    results["road_name"] = road.road_name if road else "Tamil Nadu Highway Corridor"
    results["speed_limit"] = road.speed_limit if road else 50
    results["lanes"] = road.lanes if road else 4

    return results

@router.get("/scenarios")
def get_simulation_scenarios():
    return [
        {
            "id": "baseline",
            "name": "Current Baseline Geometry (Unregulated)",
            "description": "High friction grade crossing with uncontrolled pedestrian jaywalking and speed differentials."
        },
        {
            "id": "roundabout_pedestrian",
            "name": "Intervention A: Modern Roundabout & Raised Pedestrian Crossings",
            "description": "Eliminates high-speed right-angle conflict points with continuous circular flow and IRC:99 speed tables."
        },
        {
            "id": "adaptive_traci_signal",
            "name": "Intervention B: TraCI-Actuated Smart Split Cycle Signals",
            "description": "Adaptive split cycle optimization dynamically allocates green time via queue loop sensors."
        },
        {
            "id": "speed_calming_chicanes",
            "name": "Intervention C: Speed Table & Channelization Chicanes",
            "description": "Geometric speed management reducing approach speed to 30 km/h with raised median islands."
        }
    ]

