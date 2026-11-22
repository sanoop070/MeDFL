import joblib
import numpy as np
from typing import Dict, List
from backend.config.settings import MODEL_ARTIFACT_PATH, ENCODER_ARTIFACT_PATH
from backend.ml.feature_schema import get_symptom_features
from backend.ml.explainability import ModelExplainer


class DiseasePredictor:
    def __init__(self):
        self.features = get_symptom_features()
        self.feature_to_idx = {feat.lower(): i for i, feat in enumerate(self.features)}
        self.model = None
        self.encoder = None
        self.explainer = None
        self._load_artifacts()

    def _load_artifacts(self):
        if MODEL_ARTIFACT_PATH.exists() and ENCODER_ARTIFACT_PATH.exists():
            self.model = joblib.load(MODEL_ARTIFACT_PATH)
            self.encoder = joblib.load(ENCODER_ARTIFACT_PATH)
            self.explainer = ModelExplainer(self.model, self.features)

    def predict(self, symptoms: List[str]) -> Dict:
        if self.model is None or self.encoder is None:
            raise RuntimeError("Model artifacts not found. Run `python -m backend.ml.train` first.")

        vec = np.zeros((1, len(self.features)), dtype=np.float32)
        matched_symptoms = []
        for s in symptoms:
            clean = s.strip().lower().replace(" ", "_")
            idx = self.feature_to_idx.get(s.strip().lower())
            if idx is None:
                idx = self.feature_to_idx.get(clean)
            if idx is not None:
                vec[0, idx] = 1.0
                matched_symptoms.append(self.features[idx])

        if not matched_symptoms:
            raise ValueError("None of the provided symptoms matched the model feature schema.")

        probs = self.model.predict_proba(vec)[0]
        top_indices = np.argsort(probs)[::-1][:3]

        top_predictions = [
            {
                "disease": str(self.encoder.inverse_transform([idx])[0]),
                "confidence": round(float(probs[idx]) * 100, 2),
            }
            for idx in top_indices
        ]

        top_idx = int(top_indices[0])
        explanation = self.explainer.explain_instance(vec, top_idx, matched_symptoms)

        return {
            "predicted_disease": top_predictions[0]["disease"],
            "confidence": top_predictions[0]["confidence"],
            "top_3": top_predictions,
            "matched_symptoms": matched_symptoms,
            "shap_explanation": explanation,
        }
