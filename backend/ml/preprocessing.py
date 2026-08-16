"""
Data Preprocessing Module

Responsible for:
- Splitting features and labels
- Encoding disease labels
- Train-test split
"""

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


class DataPreprocessor:

    def __init__(self, dataframe):
        self.dataframe = dataframe
        self.label_encoder = LabelEncoder()

    def preprocess(self):

        X = self.dataframe.drop(columns=["diseases"])
        y = self.dataframe["diseases"]

        y_encoded = self.label_encoder.fit_transform(y)

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y_encoded,
            test_size=0.2,
            random_state=42,
            stratify=y_encoded,
        )

        return (
            X_train,
            X_test,
            y_train,
            y_test,
            self.label_encoder,
        )