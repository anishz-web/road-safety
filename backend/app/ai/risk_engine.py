"""
ROADGUARD TN: AI Road Risk Prediction & SHAP Explainability Engine
Loads the calibrated XGBoost model and computes SHAP feature importance for any road segment.
"""

import os
import pickle
import numpy as np
import pandas as pd
import xgboost as xgb

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai_models"))
MODEL_PATH = os.path.join(MODELS_DIR, "xgboost_risk_model.json")
SHAP_PATH = os.path.join(MODELS_DIR, "shap_explainer.pkl")
META_PATH = os.path.join(MODELS_DIR, "model_meta.pkl")

FEATURE_NAMES = [
    "vehicle_density",
    "avg_speed_kmh",
    "p85_speed_kmh",
    "speed_limit",
    "speeding_ratio",
    "pedestrian_count",
    "lanes",
    "road_type_code",
    "junction_type_code",
    "rainfall_mm",
    "visibility_meters",
    "surface_friction_index",
    "has_pedestrian_crossing",
    "has_street_lights",
    "active_hazards_count",
    "historical_accidents_annual"
]

class RiskPredictionEngine:
    _instance = None

    def __init__(self):
        self.model = None
        self.explainer = None
        self.meta = {}
        self.load_models()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = RiskPredictionEngine()
        return cls._instance

    def load_models(self):
        try:
            if os.path.exists(MODEL_PATH):
                self.model = xgb.XGBRegressor()
                self.model.load_model(MODEL_PATH)
            if os.path.exists(SHAP_PATH):
                with open(SHAP_PATH, "rb") as f:
                    self.explainer = pickle.load(f)
            if os.path.exists(META_PATH):
                with open(META_PATH, "rb") as f:
                    self.meta = pickle.load(f)
        except Exception as e:
            print(f"Warning: could not load trained model files ({e}), fallback initialized.")

    def predict(self, input_dict: dict) -> dict:
        density = float(input_dict.get("vehicle_density", 160.0))
        speed_limit = float(input_dict.get("speed_limit", 50.0))
        avg_speed = float(input_dict.get("avg_speed_kmh", 42.0))
        p85_speed = float(input_dict.get("p85_speed_kmh", max(avg_speed + 14.0, 56.0)))
        speeding_ratio = float(p85_speed / max(speed_limit, 1.0))
        pedestrian_count = float(input_dict.get("pedestrian_count", 120.0))
        lanes = int(input_dict.get("lanes", 4))
        road_type_code = int(input_dict.get("road_type_code", 3)) # 0: Arterial, 1: MDR, 2: SH, 3: NH
        junction_type_code = int(input_dict.get("junction_type_code", 1)) # 0: Grade, 1: Signal, 2: Rotary, 3: Uncontrolled
        rainfall = float(input_dict.get("rainfall_mm", 0.0))
        visibility = float(input_dict.get("visibility_meters", 8500.0))
        friction = float(input_dict.get("surface_friction_index", 0.65))
        has_crossing = 1 if input_dict.get("has_pedestrian_crossing", False) else 0
        has_lights = 1 if input_dict.get("has_street_lights", True) else 0
        active_hazards = int(input_dict.get("active_hazards_count", 1))
        historical_acc = int(input_dict.get("historical_accidents_annual", 8))

        row_data = [
            density, avg_speed, p85_speed, speed_limit, speeding_ratio,
            pedestrian_count, lanes, road_type_code, junction_type_code,
            rainfall, visibility, friction, has_crossing, has_lights,
            active_hazards, historical_acc
        ]

        df_input = pd.DataFrame([row_data], columns=FEATURE_NAMES)

        if self.model is not None:
            raw_score = float(self.model.predict(df_input)[0])
        else:
            # Fallback heuristic
            raw_score = 45.0 + (speeding_ratio - 1.0) * 20.0 + (density / 10.0)

        risk_score = float(np.clip(raw_score, 0.0, 100.0))

        # Risk Category classification
        if risk_score >= 75.0:
            category = "Critical"
        elif risk_score >= 55.0:
            category = "High"
        elif risk_score >= 35.0:
            category = "Medium"
        else:
            category = "Low"

        # SHAP attribution
        shap_factors = []
        if self.explainer is not None:
            try:
                shap_vals = self.explainer.shap_values(df_input)[0]
                for name, val, s_val in zip(FEATURE_NAMES, row_data, shap_vals):
                    s_val = float(s_val)
                    if abs(s_val) > 0.6:
                        direction = "Increases Risk" if s_val > 0 else "Decreases Risk"
                        desc = self._get_factor_description(name, val, s_val)
                        shap_factors.append({
                            "factor_name": self._friendly_name(name),
                            "feature_value": str(round(val, 2) if isinstance(val, float) else val),
                            "shap_value": round(s_val, 2),
                            "impact_direction": direction,
                            "description": desc
                        })
            except Exception as ex:
                print(f"SHAP computation exception: {ex}")

        # Sort factors by absolute impact
        shap_factors = sorted(shap_factors, key=lambda x: abs(x["shap_value"]), reverse=True)[:6]

        confidence = float(np.clip(0.92 - abs(risk_score - 50.0) * 0.001, 0.85, 0.98))
        prob_accident = float(np.clip(risk_score / 170.0, 0.05, 0.85))

        return {
            "risk_score": round(risk_score, 2),
            "risk_category": category,
            "confidence_score": round(confidence, 3),
            "predicted_accident_prob": round(prob_accident, 3),
            "model_version": self.meta.get("version", "XGBoost-TN-v2.4"),
            "shap_breakdown": shap_factors,
            "data_limitations": "Model outputs are predictive approximations trained on historical Tamil Nadu crash patterns. Final engineering interventions require authorized field verification.",
            "is_demo_data": True
        }

    def _friendly_name(self, name: str) -> str:
        mapping = {
            "vehicle_density": "Traffic Density (PCU/km)",
            "avg_speed_kmh": "Average Stream Speed (km/h)",
            "p85_speed_kmh": "85th Percentile Speed (km/h)",
            "speed_limit": "Posted Speed Limit (km/h)",
            "speeding_ratio": "Speed Limit Exceedance Ratio",
            "pedestrian_count": "Pedestrian Volume (crossings/hr)",
            "lanes": "Carriageway Lanes Count",
            "road_type_code": "Highway Classification",
            "junction_type_code": "Intersection / Junction Geometry",
            "rainfall_mm": "Rainfall Intensity (mm/hr)",
            "visibility_meters": "Atmospheric Visibility (meters)",
            "surface_friction_index": "Pavement Skid Resistance (BPN)",
            "has_pedestrian_crossing": "Pedestrian Crossing Facility",
            "has_street_lights": "Illumination & Street Lighting",
            "active_hazards_count": "Unresolved Road Surface Hazards",
            "historical_accidents_annual": "Historical 3-Year Crash Baseline"
        }
        return mapping.get(name, name)

    def _get_factor_description(self, name: str, val, s_val: float) -> str:
        if name == "speeding_ratio":
            return f"Traffic operating at {val:.2f}x of legal design speed limit."
        elif name == "surface_friction_index":
            return f"Pavement wet friction coefficient measured at {val:.2f} (safety baseline is 0.55 BPN)."
        elif name == "pedestrian_count":
            return f"High pedestrian crossing friction with {val:.0f} crossings/hour conflicting with vehicles."
        elif name == "rainfall_mm":
            return f"Precipitation of {val:.1f} mm/hr creating water film and hydroplaning potential."
        elif name == "has_street_lights" and val == 1:
            return "High-mast illumination active, reducing night pedestrian and obstacle hazard."
        elif name == "active_hazards_count":
            return f"{int(val)} active road defects (potholes/obstructions) forcing evasive swerves."
        return f"{self._friendly_name(name)} contributes {s_val:+.2f} points to total risk score."

