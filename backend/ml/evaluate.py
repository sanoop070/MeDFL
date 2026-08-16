"""
Model Evaluation Module

Evaluates the trained Random Forest model using:
- Accuracy
- Precision
- Recall
- F1 Score
- Top-3 Accuracy
- Classification Report
- Confusion Matrix
"""

from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

from backend.config.settings import MODEL_DIR
from backend.ml.dataset import DatasetLoader
from backend.ml.preprocessing import DataPreprocessor


RESULTS_DIR = Path("results") / "evaluation"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def top_k_accuracy(y_true, probabilities, k=3):
    """
    Calculate Top-K accuracy.

    A prediction is considered correct if the true class
    appears among the model's top K predictions.
    """
    top_k_predictions = np.argsort(probabilities, axis=1)[:, -k:]

    correct = [
        true_label in predicted_labels
        for true_label, predicted_labels in zip(
            y_true, top_k_predictions
        )
    ]

    return np.mean(correct)


def evaluate_model():
    """Load the trained model and evaluate it on the test dataset."""

    print("=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    # --------------------------------------------------
    # Load dataset
    # --------------------------------------------------

    loader = DatasetLoader()

    df = loader.load_main_dataset()

    # --------------------------------------------------
    # Preprocess dataset
    # --------------------------------------------------

    preprocessor = DataPreprocessor(df)

    (
        X_train,
        X_test,
        y_train,
        y_test,
        encoder,
    ) = preprocessor.preprocess()

    print(f"Test samples: {len(X_test)}")

    # --------------------------------------------------
    # Load trained model
    # --------------------------------------------------

    model_path = MODEL_DIR / "random_forest_model.pkl"

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}"
        )

    model = joblib.load(model_path)

    print("Model loaded successfully.")

    # --------------------------------------------------
    # Predictions
    # --------------------------------------------------

    print("Generating predictions...")

    y_pred = model.predict(X_test)

    y_probabilities = model.predict_proba(X_test)

    # --------------------------------------------------
    # Metrics
    # --------------------------------------------------

    accuracy = accuracy_score(y_test, y_pred)

    precision = precision_score(
        y_test,
        y_pred,
        average="weighted",
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        y_pred,
        average="weighted",
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        y_pred,
        average="weighted",
        zero_division=0,
    )

    top3 = top_k_accuracy(
        y_test,
        y_probabilities,
        k=3,
    )

    # --------------------------------------------------
    # Display metrics
    # --------------------------------------------------

    print()
    print("=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)

    print(f"Accuracy       : {accuracy:.4f}")
    print(f"Precision      : {precision:.4f}")
    print(f"Recall         : {recall:.4f}")
    print(f"F1 Score       : {f1:.4f}")
    print(f"Top-3 Accuracy : {top3:.4f}")

    # --------------------------------------------------
    # Classification report
    # --------------------------------------------------

    report = classification_report(
        y_test,
        y_pred,
        target_names=encoder.classes_,
        zero_division=0,
    )

    print()
    print("=" * 60)
    print("CLASSIFICATION REPORT")
    print("=" * 60)

    print(report)

    report_path = RESULTS_DIR / "classification_report.txt"

    with open(report_path, "w", encoding="utf-8") as file:
        file.write(report)

    # --------------------------------------------------
    # Confusion Matrix
    # --------------------------------------------------

    print("Generating confusion matrix...")

    cm = confusion_matrix(y_test, y_pred)

    plt.figure(figsize=(24, 20))

    sns.heatmap(
        cm,
        cmap="Blues",
        xticklabels=encoder.classes_,
        yticklabels=encoder.classes_,
    )

    plt.title("Disease Prediction Confusion Matrix")
    plt.xlabel("Predicted Disease")
    plt.ylabel("Actual Disease")

    plt.xticks(rotation=90)
    plt.yticks(rotation=0)

    plt.tight_layout()

    confusion_matrix_path = RESULTS_DIR / "confusion_matrix.png"

    plt.savefig(
        confusion_matrix_path,
        dpi=300,
    )

    plt.close()

    print()
    print("Evaluation complete.")
    print(f"Classification report: {report_path}")
    print(f"Confusion matrix: {confusion_matrix_path}")


if __name__ == "__main__":
    evaluate_model()