import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from backend.config.settings import SYMPTOM_DATASET_PATH, SAVED_MODELS_DIR, MODEL_ARTIFACT_PATH, ENCODER_ARTIFACT_PATH
from backend.ml.feature_schema import extract_and_save_schema

def train_centralized_model():
    df = pd.read_csv(SYMPTOM_DATASET_PATH)
    features = extract_and_save_schema()
    target = "diseases" if "diseases" in df.columns else df.columns[0]
    X = df[features].fillna(0).values
    le = LabelEncoder()
    y = le.fit_transform(df[target].astype(str).str.strip())
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=42)
    clf.fit(X_train, y_train)
    acc = accuracy_score(y_test, clf.predict(X_test))
    print(f"Validation Accuracy: {acc * 100:.2f}% across {len(le.classes_)} conditions")
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_ARTIFACT_PATH)
    joblib.dump(le, ENCODER_ARTIFACT_PATH)

if __name__ == "__main__":
    train_centralized_model()
