import ast
import pandas as pd
from typing import Dict, List, Optional
from backend.config.settings import (
    DESCRIPTION_CSV,
    MEDICATIONS_CSV,
    DIETS_CSV,
    PRECAUTIONS_CSV,
    WORKOUTS_CSV,
)


def _parse_list_cell(val) -> List[str]:
    if pd.isna(val):
        return []
    text = str(val).strip()
    if text.startswith("[") and text.endswith("]"):
        try:
            parsed = ast.literal_eval(text)
            return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass
    return [item.strip() for item in text.split(",") if item.strip()]


class DiseaseKnowledge:
    def __init__(self):
        self.descriptions: Dict[str, str] = {}
        self.medications: Dict[str, List[str]] = {}
        self.diets: Dict[str, List[str]] = {}
        self.precautions: Dict[str, List[str]] = {}
        self.workouts: Dict[str, List[str]] = {}
        self._load_all()

    def _load_all(self):
        if DESCRIPTION_CSV.exists():
            df = pd.read_csv(DESCRIPTION_CSV)
            for _, row in df.iterrows():
                disease = str(row.get("Disease", "")).strip()
                if disease:
                    self.descriptions[disease.lower()] = str(row.get("Description", "")).strip()

        if MEDICATIONS_CSV.exists():
            df = pd.read_csv(MEDICATIONS_CSV)
            for _, row in df.iterrows():
                disease = str(row.get("Disease", "")).strip().lower()
                if disease:
                    self.medications[disease] = _parse_list_cell(row.get("Medication", ""))

        if DIETS_CSV.exists():
            df = pd.read_csv(DIETS_CSV)
            for _, row in df.iterrows():
                disease = str(row.get("Disease", "")).strip().lower()
                if disease:
                    self.diets[disease] = _parse_list_cell(row.get("Diet", ""))

        if PRECAUTIONS_CSV.exists():
            df = pd.read_csv(PRECAUTIONS_CSV)
            for _, row in df.iterrows():
                disease = str(row.get("Disease", "")).strip().lower()
                if disease:
                    items = [
                        str(row.get(f"Precaution_{i}", "")).strip()
                        for i in range(1, 5)
                        if pd.notna(row.get(f"Precaution_{i}")) and str(row.get(f"Precaution_{i}")).strip()
                    ]
                    self.precautions[disease] = items

        if WORKOUTS_CSV.exists():
            df = pd.read_csv(WORKOUTS_CSV)
            grouped = df.groupby(df["disease"].astype(str).str.strip().str.lower())["workout"].apply(list)
            for disease, items in grouped.items():
                self.workouts[disease] = [str(w).strip() for w in items if pd.notna(w) and str(w).strip()]

    def list_diseases(self) -> List[str]:
        if DESCRIPTION_CSV.exists():
            df = pd.read_csv(DESCRIPTION_CSV)
            return sorted(df["Disease"].dropna().astype(str).str.strip().unique().tolist())
        return sorted([k.title() for k in self.descriptions.keys()])

    def search_diseases(self, query: str) -> List[str]:
        q = query.strip().lower()
        return [d for d in self.list_diseases() if q in d.lower()]

    def get_disease_info(self, disease_name: str) -> Optional[Dict]:
        key = disease_name.strip().lower()
        if key not in self.descriptions:
            matches = [k for k in self.descriptions if key in k or k in key]
            if not matches:
                return None
            key = matches[0]

        return {
            "disease": key.title(),
            "description": self.descriptions.get(key, "Clinical overview unavailable."),
            "medications": self.medications.get(key, []),
            "diets": self.diets.get(key, []),
            "precautions": self.precautions.get(key, []),
            "workouts": self.workouts.get(key, []),
        }
