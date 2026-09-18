"""
ML-based property price prediction using a trained RandomForestRegressor.
Falls back to a rule-based heuristic estimate if the trained model artifacts
are not present (e.g., before `python train.py` has been run).
"""
import os
import joblib
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "price_model.pkl")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.pkl")

_model = None
_encoders = None

CITY_BASE_PSF = {
    "bangalore": 7200, "mumbai": 18500, "delhi": 12500, "pune": 6800,
    "hyderabad": 6200, "chennai": 6900, "gurugram": 9800, "noida": 6600,
}


def _load():
    global _model, _encoders
    if _model is None and os.path.exists(MODEL_PATH):
        _model = joblib.load(MODEL_PATH)
        _encoders = joblib.load(ENCODERS_PATH)
    return _model, _encoders


def _heuristic_estimate(payload: dict) -> float:
    city = payload.get("city", "Bangalore").lower()
    psf = CITY_BASE_PSF.get(city, 7000)
    type_mult = {"apartment": 1.0, "villa": 1.35, "independent house": 1.15, "plot": 0.65, "studio": 0.9}
    furnish_mult = {"unfurnished": 0.94, "semi-furnished": 1.0, "furnished": 1.09}
    ptype = str(payload.get("propertyType", "Apartment")).lower()
    furnishing = str(payload.get("furnishing", "Unfurnished")).lower()
    area = float(payload.get("areaSqft", 1000))
    age = float(payload.get("age", 5))
    floor = float(payload.get("floor", 2))

    price = area * psf * type_mult.get(ptype, 1.0) * furnish_mult.get(furnishing, 1.0)
    price *= max(0.6, 1 - age * 0.012)
    price *= 1 + min(floor, 20) * 0.003
    return round(max(800000, price))


def predict_price(payload: dict) -> dict:
    model, encoders = _load()

    if model is None:
        estimate = _heuristic_estimate(payload)
        return {
            "predicted_price": estimate,
            "confidence": "low",
            "method": "heuristic (train.py not yet run - using rule-based estimate)",
            "price_range": {"min": round(estimate * 0.9), "max": round(estimate * 1.1)},
        }

    try:
        city_val = encoders["city"].transform([payload.get("city", "Bangalore")])[0]
    except ValueError:
        city_val = 0
    try:
        type_val = encoders["propertyType"].transform([payload.get("propertyType", "Apartment")])[0]
    except ValueError:
        type_val = 0
    try:
        furnish_val = encoders["furnishing"].transform([payload.get("furnishing", "Unfurnished")])[0]
    except ValueError:
        furnish_val = 0

    features = np.array([[
        city_val, type_val, furnish_val,
        payload.get("bhk", 2), payload.get("bathrooms", 2), payload.get("areaSqft", 1000),
        payload.get("age", 5), payload.get("floor", 2), payload.get("totalFloors", 10),
    ]])

    pred = model.predict(features)[0]

    # Confidence interval using tree variance across the forest
    tree_preds = np.array([tree.predict(features)[0] for tree in model.estimators_])
    std = tree_preds.std()

    return {
        "predicted_price": round(float(pred)),
        "confidence": "high" if std / pred < 0.08 else "medium",
        "method": "RandomForestRegressor (120 trees, trained on synthetic Indian real-estate dataset)",
        "price_range": {"min": round(float(pred - std)), "max": round(float(pred + std))},
        "price_per_sqft": round(float(pred) / max(1, payload.get("areaSqft", 1000))),
    }
