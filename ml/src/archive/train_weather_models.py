import pandas as pd
import numpy as np
import joblib

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


# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path("data/processed/weather")
MODEL_DIR = Path("models/weather")

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("LOADING WEATHER ML DATASETS")
print("=" * 70)

train_df = pd.read_csv(
    DATA_DIR / "weather_inventory_train.csv"
)

validation_df = pd.read_csv(
    DATA_DIR / "weather_inventory_validation.csv"
)

test_df = pd.read_csv(
    DATA_DIR / "weather_inventory_test.csv"
)

print(f"Training rows   : {len(train_df)}")
print(f"Validation rows : {len(validation_df)}")
print(f"Testing rows    : {len(test_df)}")


# ============================================================
# TARGET
# ============================================================

TARGET = "future_7day_requirement"


# ============================================================
# FEATURES
# ============================================================

features = [
    # Operational features
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
    "inventory_usage_history",

    # Real NCPOR weather features
    "temperature_mean",
    "temperature_min",
    "temperature_max",
    "pressure_mean",
    "pressure_min",
    "pressure_max",
    "wind_speed_mean",
    "wind_speed_max"
]


X_train = train_df[features]
y_train = train_df[TARGET]

X_validation = validation_df[features]
y_validation = validation_df[TARGET]

X_test = test_df[features]
y_test = test_df[TARGET]


# ============================================================
# CATEGORICAL / NUMERICAL FEATURES
# ============================================================

categorical_features = [
    "item_id",
    "item_name",
    "item_category",
    "station"
]

numerical_features = [
    "personnel_count",
    "expedition_duration",
    "opening_stock",
    "received_quantity",
    "consumed_quantity",
    "closing_stock",
    "minimum_stock",
    "lead_time",
    "previous_expedition_consumption",
    "inventory_usage_history",

    "temperature_mean",
    "temperature_min",
    "temperature_max",
    "pressure_mean",
    "pressure_min",
    "pressure_max",
    "wind_speed_mean",
    "wind_speed_max"
]


# ============================================================
# PREPROCESSING
# ============================================================

numeric_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        )
    ]
)


categorical_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            numeric_transformer,
            numerical_features
        ),
        (
            "cat",
            categorical_transformer,
            categorical_features
        )
    ]
)


# ============================================================
# MODELS
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
# TRAIN + VALIDATION
# ============================================================

validation_results = []

trained_models = {}


print("\n")
print("=" * 70)
print("TRAINING WEATHER-ENHANCED MODELS")
print("=" * 70)


for name, model in models.items():

    print(f"\nTraining {name}...")

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

    predictions = pipeline.predict(
        X_validation
    )

    mse = mean_squared_error(
        y_validation,
        predictions
    )

    rmse = np.sqrt(mse)

    mae = mean_absolute_error(
        y_validation,
        predictions
    )

    r2 = r2_score(
        y_validation,
        predictions
    )

    validation_results.append({
        "model": name,
        "MSE": mse,
        "RMSE": rmse,
        "MAE": mae,
        "R2": r2
    })

    trained_models[name] = pipeline

    print(
        f"{name}: "
        f"MSE={mse:.4f}, "
        f"RMSE={rmse:.4f}, "
        f"MAE={mae:.4f}, "
        f"R²={r2:.4f}"
    )


# ============================================================
# VALIDATION RESULTS
# ============================================================

validation_results_df = pd.DataFrame(
    validation_results
)

validation_results_df = (
    validation_results_df
    .sort_values("RMSE")
    .reset_index(drop=True)
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
# SELECT BEST MODEL
# ============================================================

best_model_name = (
    validation_results_df.iloc[0]["model"]
)

best_model = trained_models[
    best_model_name
]


print("\n")
print(
    f"Selected model: {best_model_name}"
)


# ============================================================
# TEST SET EVALUATION
# ============================================================

test_results = []

print("\n")
print("=" * 70)
print("FINAL TEST EVALUATION")
print("=" * 70)


for name, pipeline in trained_models.items():

    predictions = pipeline.predict(
        X_test
    )

    mse = mean_squared_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(mse)

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    r2 = r2_score(
        y_test,
        predictions
    )

    test_results.append({
        "model": name,
        "MSE": mse,
        "RMSE": rmse,
        "MAE": mae,
        "R2": r2
    })

    print(
        f"{name}: "
        f"MSE={mse:.4f}, "
        f"RMSE={rmse:.4f}, "
        f"MAE={mae:.4f}, "
        f"R²={r2:.4f}"
    )


# ============================================================
# SAVE RESULTS
# ============================================================

validation_results_df.to_csv(
    MODEL_DIR / "weather_validation_results.csv",
    index=False
)

test_results_df = pd.DataFrame(
    test_results
)

test_results_df.to_csv(
    MODEL_DIR / "weather_test_results.csv",
    index=False
)


# ============================================================
# SAVE BEST MODEL
# ============================================================

best_model_path = (
    MODEL_DIR /
    "best_weather_inventory_demand_model.joblib"
)

joblib.dump(
    best_model,
    best_model_path
)


# ============================================================
# SAVE ALL MODELS
# ============================================================

for name, pipeline in trained_models.items():

    filename = (
        name.lower()
        .replace(" ", "_")
        .replace("-", "_")
        + "_weather.joblib"
    )

    joblib.dump(
        pipeline,
        MODEL_DIR / filename
    )


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("WEATHER MODEL TRAINING COMPLETE")
print("=" * 70)

print(
    f"Best model: {best_model_name}"
)

print(
    f"Saved best model: {best_model_path}"
)

print(
    f"Validation results: "
    f"{MODEL_DIR / 'weather_validation_results.csv'}"
)

print(
    f"Test results: "
    f"{MODEL_DIR / 'weather_test_results.csv'}"
)

print("\n✓ All weather-enhanced models trained successfully.")
print("=" * 70)