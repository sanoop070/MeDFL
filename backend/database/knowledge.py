import ast
import pandas as pd
from typing import Dict, List, Optional
from backend.config.settings import DESCRIPTION_CSV, MEDICATIONS_CSV, DIETS_CSV, PRECAUTIONS_CSV, WORKOUTS_CSV

def _parse_list(val) -> List[str]:
    if pd.isna(val):
        return []
    text = str(val).strip()
    if text.startswith("[") and text.endswith("]"):
        try:
            return [str(x).strip() for x in ast.literal_eval(text) if str(x).strip()]
        except Exception:
            pass
    return [i.strip() for i in text.split(",") if i.strip()]

class DiseaseKnowledge:
    def __init__(self):
        self.descriptions: Dict[str, str] = {}
        self.medications: Dict[str, List[str]] = {}
        self.diets: Dict[str, List[str]] = {}
        self.precautions: Dict[str, List[str]] = {}
        self.workouts: Dict[str, List[str]] = {}
        self._load()

    def _load(self):
        if DESCRIPTION_CSV.exists():
            for _, r in pd.read_csv(DESCRIPTION_CSV).iterrows():
                d = str(r.get("Disease", "")).strip()
                if d:
                    self.descriptions[d.lower()] = str(r.get("Description", "")).strip()
        if MEDICATIONS_CSV.exists():
            for _, r in pd.read_csv(MEDICATIONS_CSV).iterrows():
                d = str(r.get("Disease", "")).strip().lower()
                if d:
                    self.medications[d] = _parse_list(r.get("Medication", ""))
        if DIETS_CSV.exists():
            for _, r in pd.read_csv(DIETS_CSV).iterrows():
                d = str(r.get("Disease", "")).strip().lower()
                if d:
                    self.diets[d] = _parse_list(r.get("Diet", ""))
        if PRECAUTIONS_CSV.exists():
            for _, r in pd.read_csv(PRECAUTIONS_CSV).iterrows():
                d = str(r.get("Disease", "")).strip().lower()
                if d:
                    self.precautions[d] = [
                        str(r.get(f"Precaution_{i}", "")).strip()
                        for i in range(1, 5)
                        if pd.notna(r.get(f"Precaution_{i}")) and str(r.get(f"Precaution_{i}")).strip()
                    ]
        if WORKOUTS_CSV.exists():
            df = pd.read_csv(WORKOUTS_CSV)
            for d, items in df.groupby(df["disease"].astype(str).str.strip().str.lower())["workout"].apply(list).items():
                self.workouts[d] = [str(w).strip() for w in items if pd.notna(w) and str(w).strip()]

    def list_diseases(self) -> List[str]:
        return sorted([k.title() for k in self.descriptions.keys()])

    def get_disease_info(self, name: str) -> Optional[Dict]:
        key = name.strip().lower()
        if key not in self.descriptions:
            matches = [k for k in self.descriptions if key in k or k in key]
            if not matches:
                return None
            key = matches[0]
        return {
            "disease": key.title(),
            "description": self.descriptions.get(key, ""),
            "medications": self.medications.get(key, []),
            "diets": self.diets.get(key, []),
            "precautions": self.precautions.get(key, []),
            "workouts": self.workouts.get(key, []),
        }
