"""
MeDFL FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.prediction import router as prediction_router
from backend.api.disease import router as disease_router
from backend.api.symptoms import router as symptoms_router


app = FastAPI(
    title="MeDFL API",
    description=(
        "Privacy-preserving AI healthcare platform "
        "using Federated Learning."
    ),
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

# Development only.
# Allows the Vite/Lovable frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API ROUTERS
# ---------------------------------------------------------

app.include_router(prediction_router)
app.include_router(disease_router)
app.include_router(symptoms_router)


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():
    """
    Health check endpoint.
    """

    return {
        "message": "MeDFL API is running",
        "status": "healthy",
    }