print("Starting preprocessing test...")

from backend.ml.dataset import DatasetLoader
from backend.ml.preprocessing import DataPreprocessor

print("Imports successful")

loader = DatasetLoader()
print("Loader created")

df = loader.load_main_dataset()
print(f"Dataset loaded: {df.shape}")

preprocessor = DataPreprocessor(df)
print("Preprocessor initialized")

X_train, X_test, y_train, y_test, encoder = preprocessor.preprocess()
print("Preprocessing completed")

print("\n========== RESULTS ==========")
print(f"Training Features : {X_train.shape}")
print(f"Testing Features  : {X_test.shape}")

print(f"Training Labels   : {y_train.shape}")
print(f"Testing Labels    : {y_test.shape}")

print(f"Number of Classes : {len(encoder.classes_)}")

print("\nFirst 10 Diseases:")
print(encoder.classes_[:10])