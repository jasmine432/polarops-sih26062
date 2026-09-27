from pathlib import Path
import json

import pandas as pd
import numpy as np

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# PATHS
# ============================================================

ML_ROOT = Path(__file__).resolve().parent.parent

TRAIN_FILE = (
    ML_ROOT
    / "data"
    / "processed"
    / "leakage_safe"
    / "train.csv"
)

VALIDATION_FILE = (
    ML_ROOT
    / "data"
    / "processed"
    / "leakage_safe"
    / "validation.csv"
)

TEST_FILE = (
    ML_ROOT
    / "data"
    / "processed"
    / "leakage_safe"
    / "test.csv"
)

OUTPUT_DIR = (
    ML_ROOT
    / "models"
    / "leakage_safe"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

METRICS_FILE = OUTPUT_DIR / "baseline_metrics.json"


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("BASELINE INVENTORY DEMAND EVALUATION")
print("=" * 70)

print(f"Training file   : {TRAIN_FILE}")
print(f"Validation file : {VALIDATION_FILE}")
print(f"Testing file    : {TEST_FILE}")

train_df = pd.read_csv(TRAIN_FILE)
validation_df = pd.read_csv(VALIDATION_FILE)
test_df = pd.read_csv(TEST_FILE)

print()
print(f"Training rows   : {len(train_df)}")
print(f"Validation rows : {len(validation_df)}")
print(f"Testing rows    : {len(test_df)}")


# ============================================================
# TARGET
# ============================================================

TARGET = "future_7day_requirement"

if TARGET not in train_df.columns:
    raise ValueError(f"Target column not found: {TARGET}")

if "item_category" not in train_df.columns:
    raise ValueError("item_category column not found")


# ============================================================
# CATEGORY BASELINE
# ============================================================

print()
print("=" * 70)
print("CREATING CATEGORY-MEAN BASELINE")
print("=" * 70)

# IMPORTANT:
# Calculate category means ONLY from training data.
# This prevents test-set leakage.

category_means = (
    train_df
    .groupby("item_category")[TARGET]
    .mean()
    .to_dict()
)

global_mean = train_df[TARGET].mean()

print()
print("Category baseline means:")

for category, value in sorted(category_means.items()):
    print(f"{category:<25} {value:.2f}")

print()
print(f"Global training mean: {global_mean:.2f}")


# ============================================================
# BASELINE PREDICTION FUNCTION
# ============================================================

def baseline_predict(df):
    predictions = []

    for category in df["item_category"]:
        prediction = category_means.get(category, global_mean)
        predictions.append(prediction)

    return np.array(predictions)


# ============================================================
# METRIC FUNCTION
# ============================================================

def calculate_metrics(actual, predicted):

    mae = mean_absolute_error(actual, predicted)

    rmse = np.sqrt(
        mean_squared_error(actual, predicted)
    )

    r2 = r2_score(actual, predicted)

    return {
        "mae": round(float(mae), 6),
        "rmse": round(float(rmse), 6),
        "r2": round(float(r2), 6)
    }


# ============================================================
# VALIDATION
# ============================================================

print()
print("=" * 70)
print("VALIDATION RESULTS")
print("=" * 70)

validation_actual = validation_df[TARGET].values
validation_predicted = baseline_predict(validation_df)

validation_metrics = calculate_metrics(
    validation_actual,
    validation_predicted
)

print(
    f"MAE  : {validation_metrics['mae']:.6f}"
)

print(
    f"RMSE : {validation_metrics['rmse']:.6f}"
)

print(
    f"R²   : {validation_metrics['r2']:.6f}"
)


# ============================================================
# TEST
# ============================================================

print()
print("=" * 70)
print("TEST RESULTS")
print("=" * 70)

test_actual = test_df[TARGET].values
test_predicted = baseline_predict(test_df)

test_metrics = calculate_metrics(
    test_actual,
    test_predicted
)

print(
    f"MAE  : {test_metrics['mae']:.6f}"
)

print(
    f"RMSE : {test_metrics['rmse']:.6f}"
)

print(
    f"R²   : {test_metrics['r2']:.6f}"
)


# ============================================================
# SAVE RESULTS
# ============================================================

results = {
    "model": "category_mean_baseline",

    "description": (
        "Non-ML baseline using mean historical "
        "7-day requirement for each item category."
    ),

    "target": TARGET,

    "training_rows": len(train_df),
    "validation_rows": len(validation_df),
    "test_rows": len(test_df),

    "validation": validation_metrics,

    "test": test_metrics,

    "category_means": {
        str(k): round(float(v), 6)
        for k, v in category_means.items()
    },

    "global_mean": round(float(global_mean), 6)
}


with open(METRICS_FILE, "w") as f:
    json.dump(results, f, indent=4)


# ============================================================
# FINAL OUTPUT
# ============================================================

print()
print("=" * 70)
print("BASELINE EVALUATION COMPLETED")
print("=" * 70)

print()
print(f"Metrics saved to:")
print(METRICS_FILE)

print()
print("✓ Baseline created successfully")
print("✓ No test-set leakage")
print("✓ Validation metrics calculated")
print("✓ Test metrics calculated")
print("✓ JSON results saved")

print("=" * 70)