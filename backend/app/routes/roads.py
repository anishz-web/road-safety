from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import RoadLocation, District, RoadHazard, Recommendation, TrafficObservation, WeatherObservation
from backend.app.schemas.schemas import RoadLocationResponse, RoadLocationCreate

router = APIRouter(prefix="/api/roads", tags=["Road Locations"])

@router.get("", response_model=List[RoadLocationResponse])
def get_roads(
    district_id: Optional[int] = Query(None),
    risk_level: Optional[str] = Query(None),
    road_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RoadLocation, District.name.label("district_name"))\
              .join(District, RoadLocation.district_id == District.id)

    if district_id:
        query = query.filter(RoadLocation.district_id == district_id)
    if risk_level and risk_level != "All":
        query = query.filter(RoadLocation.risk_level == risk_level)
    if road_type and road_type != "All":
        query = query.filter(RoadLocation.road_type == road_type)
    if search:
        query = query.filter(
            (RoadLocation.road_name.ilike(f"%{search}%")) |
            (RoadLocation.road_code.ilike(f"%{search}%")) |
            (District.name.ilike(f"%{search}%"))
        )

    results = query.order_by(RoadLocation.risk_score.desc()).all()
    out = []
    for road, dname in results:
        data = RoadLocationResponse.from_orm(road)
        data.district_name = dname
        out.append(data)
    return out

@router.get("/{road_id}")
def get_road_detail(road_id: int, db: Session = Depends(get_db)):
    road = db.query(RoadLocation).filter(RoadLocation.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road location not found")

    district = db.query(District).filter(District.id == road.district_id).first()
    hazards = db.query(RoadHazard).filter(RoadHazard.road_location_id == road_id).all()
    recommendations = db.query(Recommendation).filter(Recommendation.road_location_id == road_id).all()
    traffic = db.query(TrafficObservation).filter(TrafficObservation.road_location_id == road_id).order_by(TrafficObservation.observed_at.desc()).first()
    weather = db.query(WeatherObservation).filter(WeatherObservation.district_id == road.district_id).order_by(WeatherObservation.observed_at.desc()).first()

    return {
        "road": road,
        "district": district,
        "hazards": hazards,
        "recommendations": recommendations,
        "traffic_observation": traffic,
        "weather_observation": weather
    }

@router.post("", response_model=RoadLocationResponse)
def create_road_location(payload: RoadLocationCreate, db: Session = Depends(get_db)):
    new_road = RoadLocation(**payload.dict())
    db.add(new_road)
    db.commit()
    db.refresh(new_road)
    district = db.query(District).filter(District.id == new_road.district_id).first()
    res = RoadLocationResponse.from_orm(new_road)
    res.district_name = district.name if district else "Tamil Nadu"
    return res

