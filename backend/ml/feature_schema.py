import json
import pandas as pd
from typing import List
from backend.config.settings import SYMPTOM_DATASET_PATH, SCHEMA_ARTIFACT_PATH, SAVED_MODELS_DIR


def extract_and_save_schema() -> List[str]:
    if not SYMPTOM_DATASET_PATH.exists():
        raise FileNotFoundError(f"Symptom dataset not found at {SYMPTOM_DATASET_PATH}")

    df = pd.read_csv(SYMPTOM_DATASET_PATH, nrows=5)
    target_col = "diseases" if "diseases" in df.columns else df.columns[0]
    features = [col for col in df.columns if col != target_col]

    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    with open(SCHEMA_ARTIFACT_PATH, "w", encoding="utf-8") as f:
        json.dump({"target": target_col, "features": features}, f, indent=2)

    return features


def get_symptom_features() -> List[str]:
    if SCHEMA_ARTIFACT_PATH.exists():
        with open(SCHEMA_ARTIFACT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data["features"]
    return extract_and_save_schema()
