from backend.ml.predict import DiseasePredictor


print("=" * 60)
print("TESTING DISEASE PREDICTION")
print("=" * 60)


predictor = DiseasePredictor()

print(f"Number of symptoms: {len(predictor.symptom_features)}")

print("\nFirst 10 symptoms:")
print(predictor.symptom_features[:10])


test_symptoms = [
    "anxiety and nervousness",
    "depression",
    "insomnia",
]


print("\nSelected symptoms:")
print(test_symptoms)


result = predictor.predict(
    test_symptoms,
    top_k=3,
)


print("\nPrediction Result:")
print(result)