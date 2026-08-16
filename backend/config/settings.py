"""
MeDFL Project Configuration

This file stores all project paths and constants.
Every module should import paths from here instead of hardcoding them.
"""

from pathlib import Path

# ==========================================================
# Project Directories
# ==========================================================

# MeDFL/
BASE_DIR = Path(__file__).resolve().parents[2]

BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"

DATASETS_DIR = BASE_DIR / "datasets"
RAW_DATA_DIR = DATASETS_DIR / "raw"
PROCESSED_DATA_DIR = DATASETS_DIR / "processed"

MODEL_DIR = BACKEND_DIR / "saved_models"
LOG_DIR = BACKEND_DIR / "logs"

# ==========================================================
# Dataset Files
# ==========================================================

DISEASE_DATASET = RAW_DATA_DIR / "Diseases_and_Symptoms_dataset.csv"

DESCRIPTION_DATASET = RAW_DATA_DIR / "description.csv"

MEDICATION_DATASET = RAW_DATA_DIR / "medications.csv"

DIET_DATASET = RAW_DATA_DIR / "diets.csv"

PRECAUTION_DATASET = RAW_DATA_DIR / "precautions.csv"

WORKOUT_DATASET = RAW_DATA_DIR / "workout.csv"