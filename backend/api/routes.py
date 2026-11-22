from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.database.knowledge import DiseaseKnowledge
from backend.ml.predict import DiseasePredictor
from backend.ml.feature_schema import get_symptom_features
from backend.federated.fl_engine import FederatedCoordinator
from backend.chatbot.engine import MedicalSearchChatEngine

router = APIRouter()
knowledge_db = DiseaseKnowledge()
predictor = DiseasePredictor()
fl_coordinator = FederatedCoordinator()
chat_engine = MedicalSearchChatEngine(knowledge_db, predictor)

class PredictRequest(BaseModel):
    symptoms: List[str] = Field(..., min_length=1)

class FederatedRunRequest(BaseModel):
    rounds: int = Field(default=8, ge=1, le=30)
    dp_sigma: float = Field(default=0.05, ge=0.0, le=1.0)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_symptoms: Optional[List[str]] = []

@router.get("/symptoms")
def list_symptoms(search: Optional[str] = Query(default=None)):
    syms = get_symptom_features()
    if search:
        q = search.strip().lower()
        syms = [s for s in syms if q in s.lower() or q in s.replace("_", " ").lower()]
    return {"count": len(syms), "symptoms": syms}

@router.post("/predict")
def predict_disease(payload: PredictRequest):
    try:
        res = predictor.predict(payload.symptoms)
        res["clinical_profile"] = knowledge_db.get_disease_info(res["predicted_disease"])
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/diseases")
def list_diseases():
    d = knowledge_db.list_diseases()
    return {"count": len(d), "diseases": d}

@router.get("/diseases/{disease}")
def get_disease(disease: str):
    info = knowledge_db.get_disease_info(disease)
    if not info:
        raise HTTPException(status_code=404, detail="Disease not found")
    return info

@router.post("/federated/run")
def run_fl(payload: FederatedRunRequest):
    return fl_coordinator.run_federated_training(rounds=payload.rounds, dp_sigma=payload.dp_sigma)

@router.post("/chat")
async def chat(payload: ChatRequest):
    return await chat_engine.query(payload.message, payload.session_symptoms)
