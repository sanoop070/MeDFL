from pathlib import Path
from pydantic import BaseModel

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASETS_RAW_DIR = PROJECT_ROOT / "datasets" / "raw"
SAVED_MODELS_DIR = PROJECT_ROOT / "backend" / "saved_models"

SYMPTOM_DATASET_PATH = DATASETS_RAW_DIR / "Diseases_and_Symptoms_dataset.csv"
DESCRIPTION_CSV = DATASETS_RAW_DIR / "description.csv"
MEDICATIONS_CSV = DATASETS_RAW_DIR / "medications.csv"
DIETS_CSV = DATASETS_RAW_DIR / "diets.csv"
PRECAUTIONS_CSV = DATASETS_RAW_DIR / "precautions_df.csv"
WORKOUTS_CSV = DATASETS_RAW_DIR / "workout_df.csv"

MODEL_ARTIFACT_PATH = SAVED_MODELS_DIR / "random_forest_model.pkl"
ENCODER_ARTIFACT_PATH = SAVED_MODELS_DIR / "label_encoder.pkl"
SCHEMA_ARTIFACT_PATH = SAVED_MODELS_DIR / "feature_schema.json"
FEDERATED_MODEL_PATH = SAVED_MODELS_DIR / "federated_global_mlp.pkl"

class Settings(BaseModel):
    app_name: str = "MeDFL — Federated Medical Intelligence API"
    version: str = "2.0.0"
    api_prefix: str = "/api"
    cors_origins: list[str] = ["*"]

settings = Settings()
