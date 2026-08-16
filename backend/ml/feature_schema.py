"""
Feature Schema

Defines the exact symptom feature order used by the ML model.
The order must remain identical during training and prediction.
"""

from typing import List

from backend.ml.dataset import DatasetLoader


def get_symptom_features() -> List[str]:
    """
    Return the symptom features in the exact order used by the dataset.
    """
    loader = DatasetLoader()
    dataframe = loader.load_main_dataset()

    return [
        column
        for column in dataframe.columns
        if column != "diseases"
    ]