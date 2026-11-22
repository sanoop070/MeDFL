import joblib
import numpy as np
from typing import Dict, List
from backend.config.settings import MODEL_ARTIFACT_PATH, ENCODER_ARTIFACT_PATH
from backend.ml.feature_schema import get_symptom_features
from backend.ml.explainability import ModelExplainer

class DiseasePredictor:
    def __init__(self):
        self.features = get_symptom_features()
        self.feature_to_idx = {f.lower(): i for i, f in enumerate(self.features)}
        self.model = joblib.load(MODEL_ARTIFACT_PATH) if MODEL_ARTIFACT_PATH.exists() else None
        self.encoder = joblib.load(ENCODER_ARTIFACT_PATH) if ENCODER_ARTIFACT_PATH.exists() else None
        self.explainer = ModelExplainer(self.model, self.features) if self.model else None

    def predict(self, symptoms: List[str]) -> Dict:
        if self.model is None or self.encoder is None:
            raise RuntimeError("Run `python -m backend.ml.train` first.")
        vec = np.zeros((1, len(self.features)), dtype=np.float32)
        matched = []
        for s in symptoms:
            clean = s.strip().lower().replace(" ", "_")
            idx = self.feature_to_idx.get(s.strip().lower(), self.feature_to_idx.get(clean))
            if idx is not None:
                vec[0, idx] = 1.0
                matched.append(self.features[idx])
        if not matched:
            raise ValueError("No matching symptoms found in schema.")
        probs = self.model.predict_proba(vec)[0]
        top_idx = np.argsort(probs)[::-1][:3]
        top_3 = [{"disease": str(self.encoder.inverse_transform([i])[0]), "confidence": round(float(probs[i]) * 100, 2)} for i in top_idx]
        return {
            "predicted_disease": top_3[0]["disease"],
            "confidence": top_3[0]["confidence"],
            "top_3": top_3,
            "matched_symptoms": matched,
            "shap_explanation": self.explainer.explain_instance(matched),
        }
