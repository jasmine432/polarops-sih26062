import pandas as pd
import numpy as np
from pathlib import Path

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score
)

import joblib


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/processed/inventory_ml_with_target.csv"
)

OUTPUT_DIR = Path(
    "data/processed"
)

MODEL_DIR = Path(
    "models"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# 1. LOAD DATA
# ============================================================

print("=" * 70)
print("LOADING DATASET")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values(
    "date"
).reset_index(drop=True)

print(f"Total rows: {len(df)}")


# ============================================================
# 2. CREATE DATE-BASED TRAIN / VALIDATION / TEST SPLIT
# ============================================================

print("\n" + "=" * 70)
print("CREATING CHRONOLOGICAL SPLIT")
print("=" * 70)

unique_dates = np.sort(
    df["date"].unique()
)

number_of_dates = len(unique_dates)

train_date_index = int(
    number_of_dates * 0.70
)

validation_date_index = int(
    number_of_dates * 0.85
)

train_end_date = unique_dates[
    train_date_index - 1
]

validation_end_date = unique_dates[
    validation_date_index - 1
]


train_df = df[
    df["date"] <= train_end_date
].copy()

validation_df = df[
    (df["date"] > train_end_date)
    &
    (df["date"] <= validation_end_date)
].copy()

test_df = df[
    df["date"] > validation_end_date
].copy()


print(
    f"Train rows      : {len(train_df)}"
)

print(
    f"Validation rows : {len(validation_df)}"
)

print(
    f"Test rows       : {len(test_df)}"
)

print()

print(
    f"Train dates      : "
    f"{train_df['date'].min().date()} "
    f"→ "
    f"{train_df['date'].max().date()}"
)

print(
    f"Validation dates : "
    f"{validation_df['date'].min().date()} "
    f"→ "
    f"{validation_df['date'].max().date()}"
)

print(
    f"Test dates       : "
    f"{test_df['date'].min().date()} "
    f"→ "
    f"{test_df['date'].max().date()}"
)


# ============================================================
# 3. VERIFY NO DATE OVERLAP
# ============================================================

train_dates = set(
    train_df["date"]
)

validation_dates = set(
    validation_df["date"]
)

test_dates = set(
    test_df["date"]
)

print("\nChecking date overlap...")

if train_dates.isdisjoint(validation_dates):
    print("✓ Train and Validation have no overlapping dates.")
else:
    print("✗ ERROR: Train/Validation date overlap!")

if validation_dates.isdisjoint(test_dates):
    print("✓ Validation and Test have no overlapping dates.")
else:
    print("✗ ERROR: Validation/Test date overlap!")

if train_dates.isdisjoint(test_dates):
    print("✓ Train and Test have no overlapping dates.")
else:
    print("✗ ERROR: Train/Test date overlap!")


# ============================================================
# 4. SAVE CLEAN SPLITS
# ============================================================

train_df.to_csv(
    OUTPUT_DIR / "inventory_train_date_based.csv",
    index=False
)

validation_df.to_csv(
    OUTPUT_DIR / "inventory_validation_date_based.csv",
    index=False
)

test_df.to_csv(
    OUTPUT_DIR / "inventory_test_date_based.csv",
    index=False
)


# ============================================================
# 5. FEATURES
# ============================================================

features = [
    "item_id",
    "item_name",
    "item_category",
    "station",

    "personnel_count",
    "expedition_duration",

    "opening_stock",
    "received_quantity",
    "consumed_quantity",
    "closing_stock",

    "minimum_stock",
    "lead_time",

    "previous_expedition_consumption",
    "inventory_usage_history"
]

target = "future_7day_requirement"


# ============================================================
# 6. PREPARE X AND Y
# ============================================================

X_train = train_df[features]
y_train = train_df[target]

X_validation = validation_df[features]
y_validation = validation_df[target]

X_test = test_df[features]
y_test = test_df[target]


# ============================================================
# 7. FEATURE TYPES
# ============================================================

categorical_features = [
    "item_id",
    "item_name",
    "item_category",
    "station"
]

numeric_features = [
    "personnel_count",
    "expedition_duration",
    "opening_stock",
    "received_quantity",
    "consumed_quantity",
    "closing_stock",
    "minimum_stock",
    "lead_time",
    "previous_expedition_consumption",
    "inventory_usage_history"
]


# ============================================================
# 8. PREPROCESSING
# ============================================================

numeric_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="median"
            )
        )
    ]
)


categorical_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(
                strategy="most_frequent"
            )
        ),

        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            )
        )
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_transformer,
            numeric_features
        ),

        (
            "categorical",
            categorical_transformer,
            categorical_features
        )
    ]
)


# ============================================================
# 9. DEFINE MODELS
# ============================================================

models = {

    "Linear Regression":
        LinearRegression(),

    "Random Forest":
        RandomForestRegressor(
            n_estimators=150,
            random_state=42,
            n_jobs=-1
        ),

    "Gradient Boosting":
        GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=3,
            random_state=42
        )
}


# ============================================================
# 10. METRIC FUNCTION
# ============================================================

def evaluate_model(
    model,
    X,
    y
):

    predictions = model.predict(X)

    mse = mean_squared_error(
        y,
        predictions
    )

    rmse = np.sqrt(mse)

    mae = mean_absolute_error(
        y,
        predictions
    )

    r2 = r2_score(
        y,
        predictions
    )

    return mse, rmse, mae, r2


# ============================================================
# 11. TRAIN AND VALIDATE
# ============================================================

validation_results = []

trained_models = {}


print("\n")
print("=" * 70)
print("MODEL TRAINING + VALIDATION")
print("=" * 70)


for model_name, model in models.items():

    print(
        f"\nTraining: {model_name}"
    )

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor
            ),

            (
                "model",
                model
            )
        ]
    )

    pipeline.fit(
        X_train,
        y_train
    )

    mse, rmse, mae, r2 = evaluate_model(
        pipeline,
        X_validation,
        y_validation
    )

    validation_results.append({
        "Model": model_name,
        "MSE": mse,
        "RMSE": rmse,
        "MAE": mae,
        "R2": r2
    })

    trained_models[
        model_name
    ] = pipeline

    print(
        f"MSE  : {mse:.6f}"
    )

    print(
        f"RMSE : {rmse:.6f}"
    )

    print(
        f"MAE  : {mae:.6f}"
    )

    print(
        f"R²   : {r2:.6f}"
    )


# ============================================================
# 12. VALIDATION RESULTS
# ============================================================

validation_results_df = pd.DataFrame(
    validation_results
)

validation_results_df = (
    validation_results_df
    .sort_values(
        "RMSE"
    )
    .reset_index(drop=True)
)


validation_results_df.to_csv(
    OUTPUT_DIR /
    "validation_model_comparison.csv",
    index=False
)


print("\n")
print("=" * 70)
print("VALIDATION RESULTS")
print("=" * 70)

print(
    validation_results_df.to_string(
        index=False
    )
)


# ============================================================
# 13. SELECT MODEL USING VALIDATION RMSE
# ============================================================

best_model_name = (
    validation_results_df
    .iloc[0]["Model"]
)

best_model = trained_models[
    best_model_name
]


print("\n")
print(
    f"Selected model based on "
    f"validation RMSE: {best_model_name}"
)


# ============================================================
# 14. FINAL TEST EVALUATION
# ============================================================

print("\n")
print("=" * 70)
print("FINAL TEST EVALUATION")
print("=" * 70)

test_results = []

for model_name, pipeline in trained_models.items():

    mse, rmse, mae, r2 = evaluate_model(
        pipeline,
        X_test,
        y_test
    )

    test_results.append({
        "Model": model_name,
        "MSE": mse,
        "RMSE": rmse,
        "MAE": mae,
        "R2": r2
    })


test_results_df = pd.DataFrame(
    test_results
)


test_results_df = (
    test_results_df
    .sort_values(
        "RMSE"
    )
    .reset_index(drop=True)
)


test_results_df.to_csv(
    OUTPUT_DIR /
    "final_test_model_comparison.csv",
    index=False
)


print(
    test_results_df.to_string(
        index=False
    )
)


# ============================================================
# 15. SAVE SELECTED MODEL
# ============================================================

model_path = (
    MODEL_DIR /
    "best_inventory_demand_model.joblib"
)

joblib.dump(
    best_model,
    model_path
)


# ============================================================
# 16. FINAL SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("FINAL SUMMARY")
print("=" * 70)

print(
    f"Best validation model : "
    f"{best_model_name}"
)

print(
    f"Saved model           : "
    f"{model_path}"
)

print(
    f"Validation results    : "
    f"{OUTPUT_DIR / 'validation_model_comparison.csv'}"
)

print(
    f"Test results          : "
    f"{OUTPUT_DIR / 'final_test_model_comparison.csv'}"
)

print()
print("✓ ML evaluation completed successfully.")
print("=" * 70)