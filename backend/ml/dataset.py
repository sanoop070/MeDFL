"""
Dataset Loader Module

Responsible for:
- Loading all datasets
- Validating dataset paths
- Returning pandas DataFrames
"""

from pathlib import Path
import pandas as pd

from backend.config.settings import (
    DISEASE_DATASET,
    DESCRIPTION_DATASET,
    MEDICATION_DATASET,
    DIET_DATASET,
    PRECAUTION_DATASET,
    WORKOUT_DATASET,
)


class DatasetLoader:
    """
    Loads all datasets used in MeDFL.
    """

    @staticmethod
    def _load_csv(file_path: Path) -> pd.DataFrame:
        """
        Load a CSV file after checking it exists.
        """
        if not file_path.exists():
            raise FileNotFoundError(f"Dataset not found: {file_path}")

        return pd.read_csv(file_path)

    def load_main_dataset(self) -> pd.DataFrame:
        return self._load_csv(DISEASE_DATASET)

    def load_description(self) -> pd.DataFrame:
        return self._load_csv(DESCRIPTION_DATASET)

    def load_medications(self) -> pd.DataFrame:
        return self._load_csv(MEDICATION_DATASET)

    def load_diets(self) -> pd.DataFrame:
        return self._load_csv(DIET_DATASET)

    def load_precautions(self) -> pd.DataFrame:
        return self._load_csv(PRECAUTION_DATASET)

    def load_workouts(self) -> pd.DataFrame:
        return self._load_csv(WORKOUT_DATASET)