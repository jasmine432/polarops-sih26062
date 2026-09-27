import pandas as pd
import numpy as np
import joblib

from pathlib import Path

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor
)

from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score
)


# ============================================================
# PROJECT PATHS
# ============================================================

# Project root:
# C:\sih 62\ml
ML_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = ML_ROOT / "data" / "processed" / "leakage_safe"

MODEL_DIR = ML_ROOT / "models" / "leakage_safe"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# CONFIGURATION
# ============================================================

TARGET = "future_7day_requirement"


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("LEAKAGE-SAFE MODEL TRAINING")
print("=" * 70)

print(f"\nML project root : {ML_ROOT}")
print(f"Data directory  : {DATA_DIR}")
print(f"Model directory : {MODEL_DIR}")

print("\nLoading datasets...")

train_file = DATA_DIR / "train.csv"
validation_file = DATA_DIR / "validation.csv"
test_file = DATA_DIR / "test.csv"

# Check files before loading
for file_path in [train_file, validation_file, test_file]:

    if not file_path.exists():

        raise FileNotFoundError(
            f"\nDataset file not found:\n{file_path}\n"
            f"Please run create_leakage_safe_dataset.py first."
        )


train_df = pd.read_csv(train_file)

validation_df = pd.read_csv(validation_file)

test_df = pd.read_csv(test_file)


print("\nDatasets loaded successfully.")

print(f"\nTraining rows   : {len(train_df)}")
print(f"Validation rows : {len(validation_df)}")
print(f"Testing rows    : {len(test_df)}")


# ============================================================
# TARGET CHECK
# ============================================================

print("\n" + "=" * 70)
print("TARGET CHECK")
print("=" * 70)

if TARGET not in train_df.columns:

    raise ValueError(
        f"Target column '{TARGET}' not found in training dataset."
    )

if TARGET not in validation_df.columns:

    raise ValueError(
        f"Target column '{TARGET}' not found in validation dataset."
    )

if TARGET not in test_df.columns:

    raise ValueError(
        f"Target column '{TARGET}' not found in testing dataset."
    )

print(f"Target: {TARGET}")

print(
    f"Target minimum: "
    f"{train_df[TARGET].min():.2f}"
)

print(
    f"Target maximum: "
    f"{train_df[TARGET].max():.2f}"
)

print(
    f"Target mean: "
    f"{train_df[TARGET].mean():.2f}"
)


# ============================================================
# FINAL MODEL FEATURES
# ============================================================

features = [

    # --------------------------------------------------------
    # Identification
    # --------------------------------------------------------

    "item_id",
    "item_name",
    "item_category",
    "station",

    # --------------------------------------------------------
    # Known operational information
    # --------------------------------------------------------

    "personnel_count",
    "expedition_duration",
    "opening_stock",
    "minimum_stock",
    "lead_time",

    # --------------------------------------------------------
    # Historical demand
    # --------------------------------------------------------

    "previous_expedition_consumption",
    "inventory_usage_history",
    "consumption_lag_1",
    "consumption_lag_7",
    "consumption_avg_7",
    "consumption_avg_14",

    # --------------------------------------------------------
    # NCPOR weather
    # --------------------------------------------------------

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
# FEATURE VERIFICATION
# ============================================================

print("\n" + "=" * 70)
print("FEATURE VERIFICATION")
print("=" * 70)

print("\nFinal model features:")

for index, feature in enumerate(features, start=1):

    print(f"{index:02d}. {feature}")


# Check that every feature exists
for feature in features:

    if feature not in train_df.columns:

        raise ValueError(
            f"Feature '{feature}' is missing from training dataset."
        )

    if feature not in validation_df.columns:

        raise ValueError(
            f"Feature '{feature}' is missing from validation dataset."
        )

    if feature not in test_df.columns:

        raise ValueError(
            f"Feature '{feature}' is missing from testing dataset."
        )


print("\n✓ All model features verified.")


# ============================================================
# LEAKAGE / IDENTIFIER SAFETY CHECK
# ============================================================

print("\n" + "=" * 70)
print("LEAKAGE / IDENTIFIER CHECK")
print("=" * 70)

forbidden_features = [

    # Current/future information that should not be
    # available when making the forecast
    "consumed_quantity",
    "closing_stock",

    # Arbitrary expedition identifier
    "expedition_id"
]


for column in forbidden_features:

    if column in features:

        raise ValueError(
            f"LEAKAGE / IDENTIFIER DETECTED: {column}"
        )

    print(f"✓ {column} excluded")


print("\n✓ Leakage and identifier check passed.")


# ============================================================
# PREPARE X / y
# ============================================================

X_train = train_df[features]

y_train = train_df[TARGET]

X_validation = validation_df[features]

y_validation = validation_df[TARGET]

X_test = test_df[features]

y_test = test_df[TARGET]


print("\n" + "=" * 70)
print("DATA SHAPES")
print("=" * 70)

print(f"\nX_train      : {X_train.shape}")

print(f"y_train      : {y_train.shape}")

print(f"X_validation : {X_validation.shape}")

print(f"y_validation : {y_validation.shape}")

print(f"X_test       : {X_test.shape}")

print(f"y_test       : {y_test.shape}")


# ============================================================
# FEATURE TYPES
# ============================================================

categorical_features = [

    "item_id",
    "item_name",
    "item_category",
    "station"
]


numerical_features = [

    feature

    for feature in features

    if feature not in categorical_features
]


print("\n" + "=" * 70)
print("FEATURE TYPES")
print("=" * 70)

print("\nCategorical features:")

for feature in categorical_features:

    print(f" - {feature}")


print("\nNumerical features:")

for feature in numerical_features:

    print(f" - {feature}")


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
# TRAINING
# ============================================================

validation_results = []

test_results = []

trained_models = {}


print("\n")

print("=" * 70)

print("TRAINING MODELS")

print("=" * 70)


for model_name, model in models.items():

    print(
        f"\nTraining {model_name}..."
    )


    # --------------------------------------------------------
    # Numerical preprocessing
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # Categorical preprocessing
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # Combined preprocessor
    # --------------------------------------------------------

    current_preprocessor = ColumnTransformer(

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


    # --------------------------------------------------------
    # Pipeline
    # --------------------------------------------------------

    pipeline = Pipeline(

        steps=[

            (
                "preprocessor",

                current_preprocessor
            ),

            (
                "model",

                model
            )

        ]
    )


    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    pipeline.fit(

        X_train,

        y_train
    )


    # ========================================================
    # VALIDATION
    # ========================================================

    validation_pred = pipeline.predict(

        X_validation
    )


    validation_mse = mean_squared_error(

        y_validation,

        validation_pred
    )


    validation_rmse = np.sqrt(

        validation_mse
    )


    validation_mae = mean_absolute_error(

        y_validation,

        validation_pred
    )


    validation_r2 = r2_score(

        y_validation,

        validation_pred
    )


    validation_results.append(

        {

            "model": model_name,

            "MSE": validation_mse,

            "RMSE": validation_rmse,

            "MAE": validation_mae,

            "R2": validation_r2

        }

    )


    # ========================================================
    # TEST
    # ========================================================

    test_pred = pipeline.predict(

        X_test
    )


    test_mse = mean_squared_error(

        y_test,

        test_pred
    )


    test_rmse = np.sqrt(

        test_mse
    )


    test_mae = mean_absolute_error(

        y_test,

        test_pred
    )


    test_r2 = r2_score(

        y_test,

        test_pred
    )


    test_results.append(

        {

            "model": model_name,

            "MSE": test_mse,

            "RMSE": test_rmse,

            "MAE": test_mae,

            "R2": test_r2

        }

    )


    # Store trained model

    trained_models[model_name] = pipeline


    # ========================================================
    # DISPLAY RESULTS
    # ========================================================

    print(

        f"Validation → "

        f"RMSE: {validation_rmse:.4f}, "

        f"MAE: {validation_mae:.4f}, "

        f"R²: {validation_r2:.4f}"

    )


    print(

        f"Test       → "

        f"RMSE: {test_rmse:.4f}, "

        f"MAE: {test_mae:.4f}, "

        f"R²: {test_r2:.4f}"

    )


# ============================================================
# RESULTS DATAFRAMES
# ============================================================

validation_results_df = pd.DataFrame(

    validation_results
)


test_results_df = pd.DataFrame(

    test_results
)


# ============================================================
# SELECT BEST MODEL
# ============================================================

# IMPORTANT:
# The test set is NOT used for model selection.
# Model selection is based only on validation RMSE.

validation_results_sorted = (

    validation_results_df

    .sort_values(
        "RMSE"
    )

    .reset_index(
        drop=True
    )
)


best_model_name = (

    validation_results_sorted

    .iloc[0]["model"]
)


best_model = (

    trained_models[

        best_model_name

    ]

)


# ============================================================
# DISPLAY VALIDATION RESULTS
# ============================================================

print("\n")

print("=" * 70)

print("VALIDATION RESULTS")

print("=" * 70)

print(

    validation_results_sorted.to_string(

        index=False

    )

)


# ============================================================
# DISPLAY TEST RESULTS
# ============================================================

print("\n")

print("=" * 70)

print("FINAL TEST RESULTS")

print("=" * 70)

print(

    test_results_df.to_string(

        index=False

    )

)


# ============================================================
# BEST MODEL
# ============================================================

print("\n")

print("=" * 70)

print("MODEL SELECTION")

print("=" * 70)

print(

    f"\nBest model selected using validation RMSE: "

    f"{best_model_name}"

)


# ============================================================
# SAVE RESULTS
# ============================================================

validation_results_path = (

    MODEL_DIR /

    "validation_results.csv"
)


test_results_path = (

    MODEL_DIR /

    "test_results.csv"
)


validation_results_df.to_csv(

    validation_results_path,

    index=False
)


test_results_df.to_csv(

    test_results_path,

    index=False
)


# ============================================================
# SAVE BEST MODEL
# ============================================================

best_model_path = (

    MODEL_DIR /

    "best_leakage_safe_inventory_model.joblib"
)


joblib.dump(

    best_model,

    best_model_path
)


# ============================================================
# SAVE ALL MODELS
# ============================================================

for model_name, pipeline in trained_models.items():

    filename = (

        model_name

        .lower()

        .replace(" ", "_")

        + ".joblib"
    )


    joblib.dump(

        pipeline,

        MODEL_DIR / filename
    )


# ============================================================
# SAVE FEATURE INFORMATION
# ============================================================

feature_file = (

    MODEL_DIR /

    "model_features.txt"
)


with open(

    feature_file,

    "w",

    encoding="utf-8"

) as f:

    f.write(

        "LEAKAGE-SAFE INVENTORY DEMAND MODEL\n"
    )

    f.write(

        "=" * 60 + "\n\n"
    )


    f.write(

        "Target:\n"
    )

    f.write(

        f"{TARGET}\n\n"
    )


    f.write(

        "Model features:\n"
    )

    f.write(

        "-" * 40 + "\n"
    )


    for index, feature in enumerate(

        features,

        start=1

    ):

        f.write(

            f"{index:02d}. {feature}\n"
        )


    f.write(

        "\nExcluded leakage-prone / identifier fields:\n"
    )

    f.write(

        "-" * 40 + "\n"
    )


    f.write(

        "consumed_quantity\n"
    )

    f.write(

        "closing_stock\n"
    )

    f.write(

        "expedition_id\n"
    )


# ============================================================
# SAVE MODEL METADATA
# ============================================================

metadata_file = (

    MODEL_DIR /

    "model_metadata.txt"
)


with open(

    metadata_file,

    "w",

    encoding="utf-8"

) as f:

    f.write(

        "POLAR EXPEDITION INVENTORY ML MODEL\n"
    )

    f.write(

        "=" * 60 + "\n\n"
    )


    f.write(

        f"Best model: {best_model_name}\n"
    )

    f.write(

        f"Target: {TARGET}\n"
    )

    f.write(

        "Model selection metric: Validation RMSE\n"
    )

    f.write(

        "Training data type: Synthetic operational prototype data\n"
    )

    f.write(

        "Weather data source: NCPOR weather datasets\n"
    )

    f.write(

        "Forecast horizon: 7 days\n"
    )

    f.write(

        "expedition_id used as feature: NO\n"
    )

    f.write(

        "consumed_quantity used as feature: NO\n"
    )

    f.write(

        "closing_stock used as feature: NO\n"
    )


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n")

print("=" * 70)

print("LEAKAGE-SAFE MODEL TRAINING COMPLETE")

print("=" * 70)


print(

    f"\nBest model: "

    f"{best_model_name}"
)


print(

    f"\nBest model saved at:\n"

    f"{best_model_path}"
)


print(

    f"\nValidation results saved at:\n"

    f"{validation_results_path}"
)


print(

    f"\nTest results saved at:\n"

    f"{test_results_path}"
)


print(

    f"\nFeature list saved at:\n"

    f"{feature_file}"
)


print(

    f"\nMetadata saved at:\n"

    f"{metadata_file}"
)


print("\n✓ Training completed successfully.")

print("=" * 70)