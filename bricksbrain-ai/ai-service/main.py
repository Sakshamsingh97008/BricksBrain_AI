from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from models.price_predictor import predict_price
from models.forecast import combined_forecast
from models.recommender import recommend
from models.chatbot import generate_reply
from models.interior_design import generate_interior_design

app = FastAPI(title="BricksBrain AI - ML/AI Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "BricksBrain AI ML Service", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- Price Prediction ----------
class PricePredictRequest(BaseModel):
    city: str
    propertyType: str = "Apartment"
    furnishing: str = "Unfurnished"
    bhk: int = 2
    bathrooms: int = 2
    areaSqft: float
    age: int = 5
    floor: int = 2
    totalFloors: int = 10


@app.post("/predict-price")
def api_predict_price(payload: PricePredictRequest):
    try:
        result = predict_price(payload.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Forecasting (ARIMA + LSTM) ----------
class ForecastRequest(BaseModel):
    city: str
    areaSqft: float = 1000
    monthsAhead: int = 36


@app.post("/forecast-price")
def api_forecast_price(payload: ForecastRequest):
    try:
        result = combined_forecast(payload.city, payload.areaSqft, payload.monthsAhead)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Recommendations ----------
class RecommendRequest(BaseModel):
    user_preferences: Optional[Dict[str, Any]] = {}
    viewed_property_ids: Optional[List[str]] = []
    saved_property_ids: Optional[List[str]] = []
    candidate_properties: List[Dict[str, Any]]


@app.post("/recommend")
def api_recommend(payload: RecommendRequest):
    try:
        ids = recommend(payload.dict())
        return {"recommended_ids": ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Chatbot ----------
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []


@app.post("/chatbot")
def api_chatbot(payload: ChatRequest):
    try:
        result = generate_reply(payload.message, payload.history)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Interior Design ----------
class InteriorDesignRequest(BaseModel):
    room_type: str
    style: str
    notes: Optional[str] = ""


@app.post("/interior-design")
def api_interior_design(payload: InteriorDesignRequest):
    try:
        result = generate_interior_design(payload.room_type, payload.style, payload.notes or "")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
