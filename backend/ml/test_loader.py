from backend.ml.dataset import DatasetLoader

loader = DatasetLoader()

df = loader.load_main_dataset()

print("=" * 60)
print("DATASET INFORMATION")
print("=" * 60)

print(f"Shape: {df.shape}")

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 5 Rows:")
print(df.head())

print("\nMissing Values:")
print(df.isnull().sum().sum())

print("\nDuplicate Rows:")
print(df.duplicated().sum())

print("\nData Types:")
print(df.dtypes)

print("\nUnique Diseases:")
print(df["diseases"].nunique())

print("\nDisease Counts:")
print(df["diseases"].value_counts())