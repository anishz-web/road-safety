from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import RiskAssessment, RiskFactor, RoadLocation, District
from backend.app.schemas.schemas import RiskPredictionRequest
from backend.app.ai.risk_engine import RiskPredictionEngine

router = APIRouter(prefix="/api/risk", tags=["AI Road Risk Prediction"])

@router.post("/predict")
def predict_road_risk(payload: RiskPredictionRequest, db: Session = Depends(get_db)):
    """
    Runs XGBoost inference & SHAP explainability on input parameters.
    """
    engine = RiskPredictionEngine.get_instance()
    results = engine.predict(payload.dict())

    # Optionally persist if road_location_id provided
    if payload.road_location_id:
        road = db.query(RoadLocation).filter(RoadLocation.id == payload.road_location_id).first()
        if road:
            # Update road score
            road.risk_score = results["risk_score"]
            road.risk_level = results["risk_category"]

            assessment = RiskAssessment(
                road_location_id=road.id,
                risk_score=results["risk_score"],
                risk_category=results["risk_category"],
                confidence_score=results["confidence_score"],
                predicted_accident_prob=results["predicted_accident_prob"],
                model_version=results["model_version"],
                is_demo_data=True
            )
            db.add(assessment)
            db.flush()

            for item in results["shap_breakdown"]:
                rf = RiskFactor(
                    assessment_id=assessment.id,
                    factor_name=item["factor_name"],
                    feature_value=item["feature_value"],
                    shap_value=item["shap_value"],
                    impact_direction=item["impact_direction"],
                    description=item["description"]
                )
                db.add(rf)
            db.commit()

    return results

@router.get("/assessments")
def get_risk_assessments(limit: int = 15, db: Session = Depends(get_db)):
    records = db.query(RiskAssessment, RoadLocation.road_name, District.name.label("district_name"))\
                .join(RoadLocation, RiskAssessment.road_location_id == RoadLocation.id)\
                .join(District, RoadLocation.district_id == District.id)\
                .order_by(RiskAssessment.assessed_at.desc())\
                .limit(limit)\
                .all()

    out = []
    for ass, rname, dname in records:
        factors = db.query(RiskFactor).filter(RiskFactor.assessment_id == ass.id).all()
        out.append({
            "id": ass.id,
            "road_location_id": ass.road_location_id,
            "road_name": rname,
            "district_name": dname,
            "risk_score": ass.risk_score,
            "risk_category": ass.risk_category,
            "confidence_score": ass.confidence_score,
            "predicted_accident_prob": ass.predicted_accident_prob,
            "model_version": ass.model_version,
            "assessed_at": ass.assessed_at,
            "factors": factors
        })
    return out

@router.get("/factors/{assessment_id}")
def get_assessment_shap_factors(assessment_id: int, db: Session = Depends(get_db)):
    factors = db.query(RiskFactor).filter(RiskFactor.assessment_id == assessment_id).all()
    return factors

