import pandas as pd
import numpy as np
import os
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

from sklearn.pipeline import Pipeline

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.ensemble import GradientBoostingRegressor

from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_squared_error
from sklearn.metrics import r2_score


# =========================================================
# 1. LOAD DATA
# =========================================================

input_file = "../data/processed/inventory_forecasting_dataset.csv"

df = pd.read_csv(input_file)

df["date"] = pd.to_datetime(df["date"])

print("Forecasting dataset loaded successfully!")

print("Rows:", len(df))
print("Columns:", len(df.columns))


# =========================================================
# 2. SORT CHRONOLOGICALLY
# =========================================================

df = df.sort_values("date").reset_index(drop=True)


# =========================================================
# 3. SELECT FEATURES
# =========================================================

features = [
    "item",
    "station",
    "personnel_count",
    "expedition_duration",
    "opening_stock",
    "received_quantity",
    "consumed_quantity",
    "closing_stock",
    "minimum_stock",
    "lead_time",
    "consumption_lag_1",
    "consumption_lag_7",
    "consumption_avg_7",
    "consumption_avg_14"
]

target = "future_7day_requirement"


X = df[features]
y = df[target]


# =========================================================
# 4. TIME-BASED TRAIN / TEST SPLIT
# =========================================================

split_date = pd.Timestamp("2025-10-01")

train_mask = df["date"] < split_date
test_mask = df["date"] >= split_date

X_train = X.loc[train_mask]
X_test = X.loc[test_mask]

y_train = y.loc[train_mask]
y_test = y.loc[test_mask]


print("\nTime-based split:")
print("Training period:",
      df.loc[train_mask, "date"].min(),
      "to",
      df.loc[train_mask, "date"].max())

print("Testing period:",
      df.loc[test_mask, "date"].min(),
      "to",
      df.loc[test_mask, "date"].max())

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# =========================================================
# 5. IDENTIFY COLUMN TYPES
# =========================================================

categorical_features = [
    "item",
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
    "consumption_lag_1",
    "consumption_lag_7",
    "consumption_avg_7",
    "consumption_avg_14"
]


# =========================================================
# 6. PREPROCESSING
# =========================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            ),
            categorical_features
        ),
        (
            "numeric",
            "passthrough",
            numeric_features
        )
    ]
)


# =========================================================
# 7. DEFINE MODELS
# =========================================================

models = {

    "Linear Regression": LinearRegression(),

    "Random Forest": RandomForestRegressor(
        n_estimators=150,
        random_state=42,
        n_jobs=-1
    ),

    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=3,
        random_state=42
    )
}


# =========================================================
# 8. CREATE MODEL DIRECTORY
# =========================================================

os.makedirs("../models", exist_ok=True)


results = []


# =========================================================
# 9. TRAIN AND EVALUATE
# =========================================================

for name, model in models.items():

    print("\n----------------------------------------")
    print("Training:", name)
    print("----------------------------------------")

    pipeline = Pipeline(
        steps=[
            ("preprocessing", preprocessor),
            ("model", model)
        ]
    )

    # Train
    pipeline.fit(
        X_train,
        y_train
    )

    # Predict
    predictions = pipeline.predict(
        X_test
    )

    # Metrics
    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions
        )
    )

    r2 = r2_score(
        y_test,
        predictions
    )

    results.append({
        "Model": name,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    })

    print("MAE :", round(mae, 4))
    print("RMSE:", round(rmse, 4))
    print("R2  :", round(r2, 4))

    # Save pipeline
    filename = (
        name.lower()
        .replace(" ", "_")
        + "_pipeline.joblib"
    )

    joblib.dump(
        pipeline,
        "../models/" + filename
    )

    print(
        "Saved:",
        "../models/" + filename
    )


# =========================================================
# 10. MODEL COMPARISON
# =========================================================

results_df = pd.DataFrame(results)

print("\n========================================")
print("MODEL COMPARISON")
print("========================================")

print(
    results_df.to_string(index=False)
)


# =========================================================
# 11. SAVE RESULTS
# =========================================================

results_df.to_csv(
    "../models/forecasting_model_comparison.csv",
    index=False
)

print(
    "\nResults saved to:"
    "../models/forecasting_model_comparison.csv"
)

print("\nForecasting model training completed!")