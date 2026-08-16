"""
Disease Prediction Engine

Loads the trained Random Forest model and converts
user-selected symptoms into model-compatible input.
"""

from typing import Dict, List

import joblib
import pandas as pd

from backend.config.settings import MODEL_DIR
from backend.ml.feature_schema import get_symptom_features


class DiseasePredictor:
    """Generate disease predictions from selected symptoms."""

    def __init__(self):
        """Load the trained model and label encoder."""

        model_path = MODEL_DIR / "random_forest_model.pkl"
        encoder_path = MODEL_DIR / "label_encoder.pkl"

        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found: {model_path}"
            )

        if not encoder_path.exists():
            raise FileNotFoundError(
                f"Label encoder not found: {encoder_path}"
            )

        self.model = joblib.load(model_path)
        self.label_encoder = joblib.load(encoder_path)

        self.symptom_features = get_symptom_features()

        self.symptom_set = set(self.symptom_features)

    def create_feature_vector(
        self,
        symptoms: List[str],
    ) -> pd.DataFrame:
        """
        Convert selected symptoms into the 230-feature format
        expected by the trained model.
        """

        normalized_symptoms = {
            symptom.strip().lower()
            for symptom in symptoms
        }

        invalid_symptoms = (
            normalized_symptoms - self.symptom_set
        )

        if invalid_symptoms:
            raise ValueError(
                f"Unknown symptoms: {sorted(invalid_symptoms)}"
            )

        feature_vector = {
            symptom: 1
            if symptom in normalized_symptoms
            else 0
            for symptom in self.symptom_features
        }

        return pd.DataFrame([feature_vector])

    def predict(
        self,
        symptoms: List[str],
        top_k: int = 3,
    ) -> Dict:
        """
        Generate the top disease predictions.

        Parameters
        ----------
        symptoms:
            List of symptoms selected by the user.

        top_k:
            Number of predictions to return.

        Returns
        -------
        Dict
            Prediction results with disease names
            and confidence scores.
        """

        if not symptoms:
            raise ValueError(
                "At least one symptom must be provided."
            )

        if top_k < 1:
            raise ValueError(
                "top_k must be at least 1."
            )

        if top_k > len(self.label_encoder.classes_):
            top_k = len(self.label_encoder.classes_)

        feature_vector = self.create_feature_vector(
            symptoms
        )

        probabilities = self.model.predict_proba(
            feature_vector
        )[0]

        top_indices = probabilities.argsort()[-top_k:][::-1]

        predictions = []

        for index in top_indices:
            disease = self.label_encoder.inverse_transform(
                [index]
            )[0]

            confidence = float(probabilities[index])

            predictions.append(
                {
                    "disease": disease,
                    "confidence": confidence,
                }
            )

        return {
            "prediction": predictions[0]["disease"],
            "confidence": predictions[0]["confidence"],
            "top_predictions": predictions,
        }