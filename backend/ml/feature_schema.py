import json
import pandas as pd
from typing import List
from backend.config.settings import SYMPTOM_DATASET_PATH, SCHEMA_ARTIFACT_PATH, SAVED_MODELS_DIR

def extract_and_save_schema() -> List[str]:
    df = pd.read_csv(SYMPTOM_DATASET_PATH, nrows=5)
    target = "diseases" if "diseases" in df.columns else df.columns[0]
    features = [c for c in df.columns if c != target]
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    with open(SCHEMA_ARTIFACT_PATH, "w", encoding="utf-8") as f:
        json.dump({"target": target, "features": features}, f, indent=2)
    return features

def get_symptom_features() -> List[str]:
    if SCHEMA_ARTIFACT_PATH.exists():
        with open(SCHEMA_ARTIFACT_PATH, "r", encoding="utf-8") as f:
            return json.load(f)["features"]
    return extract_and_save_schema()
