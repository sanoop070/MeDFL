import numpy as np
from typing import Dict, List

class ModelExplainer:
    def __init__(self, model, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names

    def explain_instance(self, active_symptoms: List[str]) -> List[Dict]:
        importances = getattr(self.model, "feature_importances_", np.ones(len(self.feature_names)))
        scores = {}
        for sym in active_symptoms:
            if sym in self.feature_names:
                idx = self.feature_names.index(sym)
                scores[sym] = max(float(importances[idx]), 0.001)
        total = sum(scores.values()) or 1.0
        return [
            {"symptom": sym, "raw_weight": round(val, 5), "contribution_pct": round((val / total) * 100, 1)}
            for sym, val in sorted(scores.items(), key=lambda x: x[1], reverse=True)
        ]
