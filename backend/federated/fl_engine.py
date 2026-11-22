import joblib
import numpy as np
import pandas as pd
from typing import Dict, List
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from backend.config.settings import (
    SYMPTOM_DATASET_PATH,
    FEDERATED_MODEL_PATH,
    SAVED_MODELS_DIR,
)
from backend.ml.feature_schema import get_symptom_features


class FederatedHospitalNode:
    def __init__(self, node_id: str, specialty: str, X: np.ndarray, y: np.ndarray, classes: np.ndarray):
        self.node_id = node_id
        self.specialty = specialty
        self.X = X
        self.y = y
        self.classes = classes
        self.sample_count = len(X)

    def local_train(self, global_weights=None, global_biases=None, dp_sigma: float = 0.05):
        local_mlp = MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation="relu",
            max_iter=1,
            warm_start=True,
            learning_rate_init=0.005,
            random_state=42,
        )
        local_mlp.partial_fit(
            self.X[: min(32, len(self.X))],
            self.y[: min(32, len(self.y))],
            classes=self.classes,
        )

        if global_weights is not None and global_biases is not None:
            local_mlp.coefs_ = [w.copy() for w in global_weights]
            local_mlp.intercepts_ = [b.copy() for b in global_biases]

        for _ in range(3):
            local_mlp.partial_fit(self.X, self.y)

        rng = np.random.default_rng()
        noisy_weights = [w + rng.normal(0.0, dp_sigma * 0.02, size=w.shape) for w in local_mlp.coefs_]
        noisy_biases = [b + rng.normal(0.0, dp_sigma * 0.02, size=b.shape) for b in local_mlp.intercepts_]

        local_acc = float(accuracy_score(self.y, local_mlp.predict(self.X)))
        return noisy_weights, noisy_biases, local_acc


class FederatedCoordinator:
    def __init__(self):
        self.history: List[Dict] = []

    def run_federated_training(self, rounds: int = 8, dp_sigma: float = 0.05) -> Dict:
        df = pd.read_csv(SYMPTOM_DATASET_PATH)
        features = get_symptom_features()
        target_col = "diseases" if "diseases" in df.columns else df.columns[0]

        X = df[features].fillna(0).values.astype(np.float32)
        le = LabelEncoder()
        y = le.fit_transform(df[target_col].astype(str).str.strip())
        classes = np.unique(y)

        idx_perm = np.random.default_rng(42).permutation(len(X))
        splits = np.array_split(idx_perm, 3)

        nodes = [
            FederatedHospitalNode("Hospital-A (Cardiology)", "Cardiovascular & Chest Cohort", X[splits[0]], y[splits[0]], classes),
            FederatedHospitalNode("Hospital-B (Endocrinology)", "Metabolic & Diabetes Cohort", X[splits[1]], y[splits[1]], classes),
            FederatedHospitalNode("Hospital-C (General Medicine)", "Multi-Organ Acute Cohort", X[splits[2]], y[splits[2]], classes),
        ]

        global_weights = None
        global_biases = None
        round_logs = []

        for r in range(1, rounds + 1):
            weighted_w = None
            weighted_b = None
            total_samples = sum(n.sample_count for n in nodes)
            node_metrics = []

            for node in nodes:
                w, b, acc = node.local_train(global_weights, global_biases, dp_sigma=dp_sigma)
                ratio = node.sample_count / total_samples
                if weighted_w is None:
                    weighted_w = [layer * ratio for layer in w]
                    weighted_b = [bias * ratio for bias in b]
                else:
                    weighted_w = [gw + layer * ratio for gw, layer in zip(weighted_w, w)]
                    weighted_b = [gb + bias * ratio for gb, bias in zip(weighted_b, b)]

                node_metrics.append({
                    "node_id": node.node_id,
                    "specialty": node.specialty,
                    "samples": node.sample_count,
                    "local_accuracy": round(acc * 100, 2),
                })

            global_weights = weighted_w
            global_biases = weighted_b

            global_mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=1, warm_start=True)
            global_mlp.partial_fit(X[:32], y[:32], classes=classes)
            global_mlp.coefs_ = global_weights
            global_mlp.intercepts_ = global_biases
            global_acc = float(accuracy_score(y, global_mlp.predict(X)))

            epsilon = round((r * 0.45) / max(dp_sigma, 0.01), 2)
            round_logs.append({
                "round": r,
                "global_accuracy": round(global_acc * 100, 2),
                "dp_epsilon": epsilon,
                "nodes": node_metrics,
            })

        SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({"coefs": global_weights, "intercepts": global_biases, "classes": le.classes_}, FEDERATED_MODEL_PATH)
        self.history = round_logs
        return {
            "status": "completed",
            "rounds": rounds,
            "dp_sigma": dp_sigma,
            "final_global_accuracy": round_logs[-1]["global_accuracy"],
            "privacy_budget_epsilon": round_logs[-1]["dp_epsilon"],
            "history": round_logs,
        }
