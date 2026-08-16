"""
Prediction API

Provides REST endpoints for disease prediction.
"""

from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.ml.predict import DiseasePredictor


router = APIRouter(
    prefix="/api",
    tags=["Prediction"],
)


# Load the trained ML model once when the API starts.
predictor = DiseasePredictor()


class PredictionRequest(BaseModel):
    """Request body for disease prediction."""

    symptoms: List[str] = Field(
        ...,
        min_length=1,
        description="List of symptoms selected by the user.",
    )


@router.post("/predict")
def predict_disease(request: PredictionRequest):
    """
    Predict diseases from the supplied symptoms.
    """

    try:
        result = predictor.predict(
            symptoms=request.symptoms,
            top_k=3,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Prediction failed.",
        ) from error