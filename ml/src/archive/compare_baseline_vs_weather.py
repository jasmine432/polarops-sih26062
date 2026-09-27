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


# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path("data/processed/weather")

OUTPUT_DIR = Path("models/weather")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD SAME WEATHER DATA
# ============================================================

print("=" * 70)
print("FAIR BASELINE vs WEATHER COMPARISON")
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

print(f"Train rows      : {len(train_df)}")
print(f"Validation rows : {len(validation_df)}")
print(f"Test rows       : {len(test_df)}")


TARGET = "future_7day_requirement"


# ============================================================
# BASELINE FEATURES
# ============================================================

baseline_features = [
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


# ============================================================
# WEATHER FEATURES
# ============================================================

weather_features = [
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
# COMBINED FEATURES
# ============================================================

weather_enhanced_features = (
    baseline_features
    + weather_features
)


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

categorical_features = [
    "item_id",
    "item_name",
    "item_category",
    "station"
]


baseline_numerical = [
    feature
    for feature in baseline_features
    if feature not in categorical_features
]


weather_numerical = [
    feature
    for feature in weather_enhanced_features
    if feature not in categorical_features
]


# ============================================================
# PREPROCESSOR FUNCTION
# ============================================================

def create_preprocessor(numerical_features):

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
                SimpleImputer(
                    strategy="most_frequent"
                )
            ),
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore"
                )
            )
        ]
    )

    return ColumnTransformer(
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
# DATA
# ============================================================

y_train = train_df[TARGET]
y_validation = validation_df[TARGET]
y_test = test_df[TARGET]


# ============================================================
# RESULTS
# ============================================================

validation_results = []
test_results = []


# ============================================================
# TRAIN BOTH VERSIONS
# ============================================================

for model_name, model in models.items():

    print("\n")
    print("-" * 70)
    print(f"MODEL: {model_name}")
    print("-" * 70)

    # --------------------------------------------------------
    # BASELINE
    # --------------------------------------------------------

    baseline_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                create_preprocessor(
                    baseline_numerical
                )
            ),
            (
                "model",
                model
            )
        ]
    )

    X_train = train_df[baseline_features]
    X_validation = validation_df[baseline_features]
    X_test = test_df[baseline_features]

    baseline_pipeline.fit(
        X_train,
        y_train
    )

    baseline_validation_pred = (
        baseline_pipeline.predict(
            X_validation
        )
    )

    baseline_test_pred = (
        baseline_pipeline.predict(
            X_test
        )
    )


    # --------------------------------------------------------
    # WEATHER-ENHANCED
    # --------------------------------------------------------

    # Create a fresh model because sklearn estimators
    # should not be reused after fitting.

    if model_name == "Linear Regression":

        weather_model = LinearRegression()

    elif model_name == "Random Forest":

        weather_model = RandomForestRegressor(
            n_estimators=150,
            random_state=42,
            n_jobs=-1
        )

    else:

        weather_model = GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=3,
            random_state=42
        )


    weather_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                create_preprocessor(
                    weather_numerical
                )
            ),
            (
                "model",
                weather_model
            )
        ]
    )

    X_train_weather = train_df[
        weather_enhanced_features
    ]

    X_validation_weather = validation_df[
        weather_enhanced_features
    ]

    X_test_weather = test_df[
        weather_enhanced_features
    ]

    weather_pipeline.fit(
        X_train_weather,
        y_train
    )

    weather_validation_pred = (
        weather_pipeline.predict(
            X_validation_weather
        )
    )

    weather_test_pred = (
        weather_pipeline.predict(
            X_test_weather
        )
    )


    # ========================================================
    # VALIDATION METRICS
    # ========================================================

    baseline_val_mse = mean_squared_error(
        y_validation,
        baseline_validation_pred
    )

    baseline_val_rmse = np.sqrt(
        baseline_val_mse
    )

    baseline_val_mae = mean_absolute_error(
        y_validation,
        baseline_validation_pred
    )

    baseline_val_r2 = r2_score(
        y_validation,
        baseline_validation_pred
    )


    weather_val_mse = mean_squared_error(
        y_validation,
        weather_validation_pred
    )

    weather_val_rmse = np.sqrt(
        weather_val_mse
    )

    weather_val_mae = mean_absolute_error(
        y_validation,
        weather_validation_pred
    )

    weather_val_r2 = r2_score(
        y_validation,
        weather_validation_pred
    )


    validation_results.append({
        "model": model_name,
        "baseline_RMSE": baseline_val_rmse,
        "weather_RMSE": weather_val_rmse,
        "baseline_MAE": baseline_val_mae,
        "weather_MAE": weather_val_mae,
        "baseline_R2": baseline_val_r2,
        "weather_R2": weather_val_r2
    })


    # ========================================================
    # TEST METRICS
    # ========================================================

    baseline_test_mse = mean_squared_error(
        y_test,
        baseline_test_pred
    )

    baseline_test_rmse = np.sqrt(
        baseline_test_mse
    )

    baseline_test_mae = mean_absolute_error(
        y_test,
        baseline_test_pred
    )

    baseline_test_r2 = r2_score(
        y_test,
        baseline_test_pred
    )


    weather_test_mse = mean_squared_error(
        y_test,
        weather_test_pred
    )

    weather_test_rmse = np.sqrt(
        weather_test_mse
    )

    weather_test_mae = mean_absolute_error(
        y_test,
        weather_test_pred
    )

    weather_test_r2 = r2_score(
        y_test,
        weather_test_pred
    )


    test_results.append({
        "model": model_name,
        "baseline_MSE": baseline_test_mse,
        "weather_MSE": weather_test_mse,
        "baseline_RMSE": baseline_test_rmse,
        "weather_RMSE": weather_test_rmse,
        "baseline_MAE": baseline_test_mae,
        "weather_MAE": weather_test_mae,
        "baseline_R2": baseline_test_r2,
        "weather_R2": weather_test_r2
    })


    # ========================================================
    # PRINT
    # ========================================================

    print("\nValidation:")

    print(
        f"Baseline RMSE : {baseline_val_rmse:.4f}"
    )

    print(
        f"Weather RMSE  : {weather_val_rmse:.4f}"
    )

    print(
        f"Baseline MAE  : {baseline_val_mae:.4f}"
    )

    print(
        f"Weather MAE   : {weather_val_mae:.4f}"
    )

    print(
        f"Baseline R²   : {baseline_val_r2:.4f}"
    )

    print(
        f"Weather R²    : {weather_val_r2:.4f}"
    )


    print("\nTest:")

    print(
        f"Baseline RMSE : {baseline_test_rmse:.4f}"
    )

    print(
        f"Weather RMSE  : {weather_test_rmse:.4f}"
    )

    print(
        f"Baseline MAE  : {baseline_test_mae:.4f}"
    )

    print(
        f"Weather MAE   : {weather_test_mae:.4f}"
    )

    print(
        f"Baseline R²   : {baseline_test_r2:.4f}"
    )

    print(
        f"Weather R²    : {weather_test_r2:.4f}"
    )


# ============================================================
# SAVE RESULTS
# ============================================================

validation_df_results = pd.DataFrame(
    validation_results
)

test_df_results = pd.DataFrame(
    test_results
)


validation_output = (
    OUTPUT_DIR /
    "fair_baseline_vs_weather_validation.csv"
)

test_output = (
    OUTPUT_DIR /
    "fair_baseline_vs_weather_test.csv"
)


validation_df_results.to_csv(
    validation_output,
    index=False
)

test_df_results.to_csv(
    test_output,
    index=False
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("FAIR COMPARISON — VALIDATION")
print("=" * 70)

print(
    validation_df_results.to_string(
        index=False
    )
)


print("\n")
print("=" * 70)
print("FAIR COMPARISON — TEST")
print("=" * 70)

print(
    test_df_results.to_string(
        index=False
    )
)


print("\n")
print("=" * 70)
print("FILES SAVED")
print("=" * 70)

print(validation_output)
print(test_output)

print("\n✓ Fair baseline vs weather comparison completed.")
print("=" * 70)