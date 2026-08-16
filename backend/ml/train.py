from joblib import dump

from backend.ml.dataset import DatasetLoader
from backend.ml.preprocessing import DataPreprocessor
from backend.ml.model import DiseasePredictionModel

from backend.config.settings import MODEL_DIR


print("=" * 60)
print("TRAINING RANDOM FOREST MODEL")
print("=" * 60)


loader = DatasetLoader()

df = loader.load_main_dataset()


preprocessor = DataPreprocessor(df)

X_train, X_test, y_train, y_test, encoder = preprocessor.preprocess()


model = DiseasePredictionModel.random_forest()

print("Training...")

model.fit(X_train, y_train)

print("Training Complete")


dump(model, MODEL_DIR / "random_forest_model.pkl")
dump(encoder, MODEL_DIR / "label_encoder.pkl")


print("Model Saved")

print(MODEL_DIR)