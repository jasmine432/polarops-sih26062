import pandas as pd
import numpy as np
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.ensemble import GradientBoostingRegressor

from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_squared_error
from sklearn.metrics import r2_score


# ---------------------------------------------------------
# 1. LOAD PREPARED DATA
# ---------------------------------------------------------

X = pd.read_csv("../data/processed/X.csv")
y = pd.read_csv("../data/processed/y.csv").squeeze()


print("Data loaded successfully!")

print("X shape:", X.shape)
print("y shape:", y.shape)


# ---------------------------------------------------------
# 2. TRAIN-TEST SPLIT
# ---------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ---------------------------------------------------------
# 3. DEFINE MODELS
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# 4. CREATE MODEL DIRECTORY
# ---------------------------------------------------------

os.makedirs("../models", exist_ok=True)


results = []


# ---------------------------------------------------------
# 5. TRAIN AND EVALUATE
# ---------------------------------------------------------

for name, model in models.items():

    print("\n--------------------------------")
    print("Training:", name)
    print("--------------------------------")

    # Train
    model.fit(X_train, y_train)

    # Predict
    predictions = model.predict(X_test)

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


# ---------------------------------------------------------
# 6. DISPLAY COMPARISON
# ---------------------------------------------------------

results_df = pd.DataFrame(results)

print("\n================================")
print("MODEL COMPARISON")
print("================================")

print(results_df)


# ---------------------------------------------------------
# 7. SAVE RESULTS
# ---------------------------------------------------------

results_df.to_csv(
    "../models/model_comparison.csv",
    index=False
)


# ---------------------------------------------------------
# 8. SAVE MODELS
# ---------------------------------------------------------

for name, model in models.items():

    filename = name.lower().replace(" ", "_") + ".joblib"

    joblib.dump(
        model,
        "../models/" + filename
    )

    print(
        f"Saved model: ../models/{filename}"
    )


print("\nAll models trained successfully!")