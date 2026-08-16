"""
MeDFL Disease API

Provides endpoints for:
- Listing diseases
- Searching diseases
- Getting complete educational information about a disease
"""

from fastapi import APIRouter, HTTPException, Query

from backend.database.knowledge import disease_knowledge


router = APIRouter(
    prefix="/api/diseases",
    tags=["Diseases"],
)


@router.get("")
def get_diseases():
    """
    Return all available diseases.
    """

    diseases = disease_knowledge.get_all_diseases()

    return {
        "count": len(diseases),
        "diseases": diseases,
    }


@router.get("/search")
def search_diseases(
    search: str = Query(
        default="",
        description="Optional text used to search diseases.",
    )
):
    """
    Search diseases by name.

    Example:
        /api/diseases/search?search=panic
    """

    diseases = disease_knowledge.search_diseases(search)

    return {
        "count": len(diseases),
        "diseases": diseases,
    }


@router.get("/{disease}")
def get_disease(disease: str):
    """
    Return educational information for a specific disease.

    Example:
        /api/diseases/panic%20disorder
    """

    result = disease_knowledge.get_disease(disease)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Disease not found: {disease}",
        )

    return result