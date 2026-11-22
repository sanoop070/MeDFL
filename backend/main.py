from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config.settings import settings
from backend.api.routes import router

app = FastAPI(title=settings.app_name, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix)


@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": settings.app_name,
        "version": settings.version,
        "endpoints": [
            "/api/symptoms",
            "/api/predict",
            "/api/diseases",
            "/api/federated/run",
            "/api/chat",
        ],
    }
