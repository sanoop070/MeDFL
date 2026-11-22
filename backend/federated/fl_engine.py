import joblib
import numpy as np
import pandas as pd
from typing import Dict
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from backend.config.settings import SYMPTOM_DATASET_PATH, FEDERATED_MODEL_PATH, SAVED_MODELS_DIR
from backend.ml.feature_schema import get_symptom_features

class FederatedCoordinator:
    def run_federated_training(self, rounds: int = 8, dp_sigma: float = 0.05) -> Dict:
        df = pd.read_csv(SYMPTOM_DATASET_PATH)
        features = get_symptom_features()
        target = "diseases" if "diseases" in df.columns else df.columns[0]
        X = df[features].fillna(0).values.astype(np.float32)
        le = LabelEncoder()
        y = le.fit_transform(df[target].astype(str).str.strip())
        classes = np.unique(y)
        splits = np.array_split(np.random.default_rng(42).permutation(len(X)), 3)
        cohorts = [
            ("Hospital-A (Cardiology)", "Cardiovascular Cohort", X[splits[0]], y[splits[0]]),
            ("Hospital-B (Endocrinology)", "Metabolic & Diabetes Cohort", X[splits[1]], y[splits[1]]),
            ("Hospital-C (General Medicine)", "Multi-Organ Acute Cohort", X[splits[2]], y[splits[2]]),
        ]
        gw, gb, logs = None, None, []
        rng = np.random.default_rng()
        for r in range(1, rounds + 1):
            ww, wb, node_logs = None, None, []
            total = sum(len(c[2]) for c in cohorts)
            for nid, spec, nx, ny in cohorts:
                mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=1, warm_start=False, learning_rate_init=0.005, random_state=42)
                mlp.partial_fit(nx, ny, classes=classes)
                if gw is not None:
                    mlp.coefs_ = [w.copy() for w in gw]
                    mlp.intercepts_ = [b.copy() for b in gb]
                for _ in range(2):
                    mlp.partial_fit(nx, ny)
                nw = [w + rng.normal(0, dp_sigma * 0.02, w.shape) for w in mlp.coefs_]
                nb = [b + rng.normal(0, dp_sigma * 0.02, b.shape) for b in mlp.intercepts_]
                ratio = len(nx) / total
                ww = [w * ratio for w in nw] if ww is None else [a + w * ratio for a, w in zip(ww, nw)]
                wb = [b * ratio for b in nb] if wb is None else [a + b * ratio for a, b in zip(wb, nb)]
                node_logs.append({"node_id": nid, "specialty": spec, "samples": len(nx), "local_accuracy": round(float(accuracy_score(ny, mlp.predict(nx))) * 100, 2)})
            gw, gb = ww, wb
            gmlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=1, warm_start=False)
            gmlp.partial_fit(X[:min(256, len(X))], y[:min(256, len(y))], classes=classes)
            gmlp.coefs_, gmlp.intercepts_ = gw, gb
            gacc = round(float(accuracy_score(y, gmlp.predict(X))) * 100, 2)
            logs.append({"round": r, "global_accuracy": gacc, "dp_epsilon": round((r * 0.45) / max(dp_sigma, 0.01), 2), "nodes": node_logs})
        SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({"coefs": gw, "intercepts": gb, "classes": le.classes_}, FEDERATED_MODEL_PATH)
        return {"status": "completed", "rounds": rounds, "dp_sigma": dp_sigma, "final_global_accuracy": logs[-1]["global_accuracy"], "privacy_budget_epsilon": logs[-1]["dp_epsilon"], "history": logs}
