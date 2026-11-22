import numpy as np
from typing import Dict, List

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False


class ModelExplainer:
    def __init__(self, model, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        self._explainer = shap.TreeExplainer(model) if SHAP_AVAILABLE else None

    def explain_instance(self, input_vector: np.ndarray, class_idx: int, active_symptoms: List[str]) -> List[Dict]:
        scores: Dict[str, float] = {}

        if self._explainer is not None:
            shap_vals = self._explainer.shap_values(input_vector)
            if isinstance(shap_vals, list):
                class_shap = shap_vals[class_idx][0]
            elif shap_vals.ndim == 3:
                class_shap = shap_vals[0, :, class_idx]
            else:
                class_shap = shap_vals[0]

            for sym in active_symptoms:
                if sym in self.feature_names:
                    idx = self.feature_names.index(sym)
                    scores[sym] = max(float(class_shap[idx]), 0.001)
        else:
            importances = getattr(self.model, "feature_importances_", np.ones(len(self.feature_names)))
            for sym in active_symptoms:
                if sym in self.feature_names:
                    idx = self.feature_names.index(sym)
                    scores[sym] = max(float(importances[idx]), 0.001)

        total = sum(scores.values()) or 1.0
        return [
            {
                "symptom": sym,
                "raw_weight": round(val, 5),
                "contribution_pct": round((val / total) * 100, 1),
            }
            for sym, val in sorted(scores.items(), key=lambda x: x[1], reverse=True)
        ]
