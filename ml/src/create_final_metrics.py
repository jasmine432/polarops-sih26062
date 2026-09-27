from pathlib import Path
import json


# ============================================================
# PATHS
# ============================================================

ML_ROOT = Path(__file__).resolve().parent.parent

MODEL_DIR = (
    ML_ROOT
    / "models"
    / "leakage_safe"
)

BASELINE_FILE = MODEL_DIR / "baseline_metrics.json"
VALIDATION_FILE = MODEL_DIR / "validation_results.csv"
TEST_FILE = MODEL_DIR / "test_results.csv"

OUTPUT_FILE = MODEL_DIR / "metrics.json"


# ============================================================
# IMPORT PANDAS
# ============================================================

import pandas as pd


# ============================================================
# CHECK FILES
# ============================================================

print("=" * 70)
print("CREATING FINAL ML METRICS")
print("=" * 70)

for file_path in [
    BASELINE_FILE,
    VALIDATION_FILE,
    TEST_FILE
]:

    if not file_path.exists():

        raise FileNotFoundError(
            f"Required file not found:\n{file_path}"
        )


# ============================================================
# LOAD RESULTS
# ============================================================

with open(
    BASELINE_FILE,
    "r",
    encoding="utf-8"
) as f:

    baseline = json.load(f)


validation_df = pd.read_csv(
    VALIDATION_FILE
)

test_df = pd.read_csv(
    TEST_FILE
)


# ============================================================
# FIND BEST MODEL
# ============================================================

validation_sorted = (
    validation_df
    .sort_values("RMSE")
    .reset_index(drop=True)
)

best_model = validation_sorted.iloc[0]["model"]


# ============================================================
# CONVERT MODEL RESULTS
# ============================================================

model_results = {}

for _, row in validation_df.iterrows():

    model_name = row["model"]

    test_row = test_df[
        test_df["model"] == model_name
    ]

    if test_row.empty:

        raise ValueError(
            f"Test result not found for model: {model_name}"
        )

    test_row = test_row.iloc[0]

    model_results[model_name] = {

        "validation": {

            "mae": round(
                float(row["MAE"]),
                6
            ),

            "rmse": round(
                float(row["RMSE"]),
                6
            ),

            "r2": round(
                float(row["R2"]),
                6
            )
        },

        "test": {

            "mae": round(
                float(test_row["MAE"]),
                6
            ),

            "rmse": round(
                float(test_row["RMSE"]),
                6
            ),

            "r2": round(
                float(test_row["R2"]),
                6
            )
        }
    }


# ============================================================
# FINAL METRICS OBJECT
# ============================================================

final_metrics = {

    "project": (
        "Integrated Polar Expedition Logistics "
        "and Asset Management System"
    ),

    "ml_task": (
        "Inventory Demand Prediction"
    ),

    "target": "future_7day_requirement",

    "forecast_horizon_days": 7,

    "feature_count": 23,

    "training_data": (
        "Synthetic operational inventory "
        "prototype data"
    ),

    "weather_data": (
        "NCPOR weather datasets used as "
        "environmental/context features"
    ),

    "model_selection_metric": (
        "Validation RMSE"
    ),

    "selected_model": best_model,

    "model_version": (
        "inventory_demand_gb_v1"
        if best_model == "Gradient Boosting"
        else "inventory_demand_v1"
    ),

    "baseline": {

        "model": "Category-Mean Baseline",

        "validation": {

            "mae": baseline["validation"]["mae"],

            "rmse": baseline["validation"]["rmse"],

            "r2": baseline["validation"]["r2"]
        },

        "test": {

            "mae": baseline["test"]["mae"],

            "rmse": baseline["test"]["rmse"],

            "r2": baseline["test"]["r2"]
        }
    },

    "models": model_results,

    "leakage_excluded": [

        "consumed_quantity",

        "closing_stock",

        "expedition_id"
    ],

    "notes": [

        "Operational inventory data are synthetic/prototype data.",

        "NCPOR weather data are used as environmental/context features.",

        "The test set was not used for model selection.",

        "Model selection was performed using validation RMSE.",

        "R2 is a goodness-of-fit metric and is not prediction accuracy."
    ]
}


# ============================================================
# SAVE
# ============================================================

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        final_metrics,
        f,
        indent=4
    )


# ============================================================
# DISPLAY
# ============================================================

print()
print("Selected model:")
print(best_model)

print()
print("Final metrics saved to:")
print(OUTPUT_FILE)

print()
print("=" * 70)
print("✓ FINAL METRICS CREATED")
print("=" * 70)