"""
MeDFL Disease Knowledge Service

Loads and combines the supporting medical knowledge datasets:

- description.csv
- medications.csv
- diets.csv
- precautions.csv
- workout.csv

This module provides educational disease information to the API.
"""

from pathlib import Path

import ast
import pandas as pd


class DiseaseKnowledge:
    """Load and provide access to disease-related educational information."""

    def __init__(self):
        # Project root:
        # MeDFL/
        self.project_root = Path(__file__).resolve().parents[2]

        self.data_path = self.project_root / "datasets" / "raw"

        self.description_df = None
        self.medications_df = None
        self.diets_df = None
        self.precautions_df = None
        self.workout_df = None

        self._load_data()

    def _load_data(self):
        """Load all supporting CSV files."""

        self.description_df = pd.read_csv(
            self.data_path / "description.csv"
        )

        self.medications_df = pd.read_csv(
            self.data_path / "medications.csv"
        )

        self.diets_df = pd.read_csv(
            self.data_path / "diets.csv"
        )

        self.precautions_df = pd.read_csv(
            self.data_path / "precautions.csv"
        )

        self.workout_df = pd.read_csv(
            self.data_path / "workout.csv"
        )

        # Normalize disease names for reliable matching.
        for dataframe in [
            self.description_df,
            self.medications_df,
            self.diets_df,
            self.precautions_df,
            self.workout_df,
        ]:
            dataframe["Disease"] = (
                dataframe["Disease"]
                .astype(str)
                .str.strip()
                .str.lower()
            )

    @staticmethod
    def _parse_list(value):
        """
        Convert CSV strings that represent Python lists into actual lists.

        Example:
        "['A', 'B', 'C']"
        becomes:
        ["A", "B", "C"]
        """

        if pd.isna(value):
            return []

        if isinstance(value, list):
            return value

        try:
            parsed = ast.literal_eval(str(value))

            if isinstance(parsed, list):
                return [
                    str(item).strip()
                    for item in parsed
                    if str(item).strip()
                ]

        except (ValueError, SyntaxError):
            pass

        # Fallback for normal text.
        return [str(value).strip()]

    def get_disease(self, disease_name):
        """
        Return all educational information for a disease.

        Returns None if the disease does not exist.
        """

        if not disease_name:
            return None

        disease = disease_name.strip().lower()

        # Check whether disease exists.
        if disease not in set(self.description_df["Disease"]):
            return None

        # Description
        description_row = self.description_df[
            self.description_df["Disease"] == disease
        ]

        description = (
            description_row.iloc[0]["Description"]
            if not description_row.empty
            else ""
        )

        # Medications
        medication_row = self.medications_df[
            self.medications_df["Disease"] == disease
        ]

        medications = []

        if not medication_row.empty:
            medications = self._parse_list(
                medication_row.iloc[0]["Medication"]
            )

        # Diet
        diet_row = self.diets_df[
            self.diets_df["Disease"] == disease
        ]

        diet = []

        if not diet_row.empty:
            diet = self._parse_list(
                diet_row.iloc[0]["Diet"]
            )

        # Precautions
        precaution_row = self.precautions_df[
            self.precautions_df["Disease"] == disease
        ]

        precautions = []

        if not precaution_row.empty:
            row = precaution_row.iloc[0]

            for column in [
                "Precaution_1",
                "Precaution_2",
                "Precaution_3",
                "Precaution_4",
            ]:
                value = row[column]

                if pd.notna(value) and str(value).strip():
                    precautions.append(str(value).strip())

        # Workout
        workout_row = self.workout_df[
            self.workout_df["Disease"] == disease
        ]

        workouts = []

        if not workout_row.empty:
            workouts = self._parse_list(
                workout_row.iloc[0]["Workouts"]
            )

        return {
            "disease": disease,
            "description": description,
            "medications": medications,
            "diet": diet,
            "precautions": precautions,
            "workouts": workouts,
        }

    def get_all_diseases(self):
        """Return the list of available diseases."""

        return sorted(
            self.description_df["Disease"].dropna().unique().tolist()
        )

    def search_diseases(self, search=None):
        """
        Search diseases by name.

        If no search text is provided, return all diseases.
        """

        diseases = self.get_all_diseases()

        if not search:
            return diseases

        search = search.strip().lower()

        return [
            disease
            for disease in diseases
            if search in disease
        ]


# Shared service instance.
disease_knowledge = DiseaseKnowledge()