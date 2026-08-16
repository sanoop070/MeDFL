"""
Machine Learning Models

Currently supported:
- Random Forest
"""

from sklearn.ensemble import RandomForestClassifier


class DiseasePredictionModel:

    @staticmethod
    def random_forest():

        return RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            n_jobs=-1,
        )