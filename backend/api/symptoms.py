"""
Symptom API

Provides the symptom vocabulary used by the
MeDFL disease prediction model.
"""

from fastapi import APIRouter, Query

from backend.ml.feature_schema import get_symptom_features


router = APIRouter(
    prefix="/api",
    tags=["Symptoms"],
)


@router.get("/symptoms")
def get_symptoms(
    search: str = Query(
        default="",
        description="Optional text used to search symptoms.",
    )
):
    """
    Return the available symptoms.

    If search is provided, only symptoms containing
    the search text are returned.
    """

    symptoms = get_symptom_features()

    search = search.strip().lower()

    if search:
        symptoms = [
            symptom
            for symptom in symptoms
            if search in symptom.lower()
        ]

    return {
        "count": len(symptoms),
        "symptoms": symptoms,
    }