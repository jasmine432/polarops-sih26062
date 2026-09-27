import json
from pathlib import Path

import joblib
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = Path(
    "models/leakage_safe/best_leakage_safe_inventory_model.joblib"
)


# ============================================================
# REQUIRED MODEL FEATURES
# ============================================================

FEATURES = [
    "expedition_id",
    "item_id",
    "item_name",
    "item_category",
    "station",
    "personnel_count",
    "expedition_duration",
    "opening_stock",
    "minimum_stock",
    "lead_time",
    "previous_expedition_consumption",
    "inventory_usage_history",
    "consumption_lag_1",
    "consumption_lag_7",
    "consumption_avg_7",
    "consumption_avg_14",
    "temperature_mean",
    "temperature_min",
    "temperature_max",
    "pressure_mean",
    "pressure_min",
    "pressure_max",
    "wind_speed_mean",
    "wind_speed_max",
]


# ============================================================
# LOAD MODEL
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)


# ============================================================
# PREDICTION FUNCTION
# ============================================================

def predict_inventory(input_data: dict) -> dict:

    # --------------------------------------------------------
    # Validate required fields
    # --------------------------------------------------------

    missing = [
        feature
        for feature in FEATURES
        if feature not in input_data
    ]

    if missing:
        raise ValueError(
            "Missing required fields: "
            + ", ".join(missing)
        )

    # --------------------------------------------------------
    # Create DataFrame in correct feature order
    # --------------------------------------------------------

    input_df = pd.DataFrame(
        [input_data],
        columns=FEATURES
    )

    # --------------------------------------------------------
    # Predict
    # --------------------------------------------------------

    prediction = model.predict(input_df)[0]

    predicted_requirement = max(
        0.0,
        float(prediction)
    )

    # --------------------------------------------------------
    # Stock calculation
    # --------------------------------------------------------

    current_stock = float(
        input_data["opening_stock"]
    )

    minimum_stock = float(
        input_data["minimum_stock"]
    )

    target_stock = (
        predicted_requirement
        + minimum_stock
    )

    reorder_quantity = max(
        0.0,
        target_stock - current_stock
    )

    # --------------------------------------------------------
    # Determine status
    # --------------------------------------------------------

    if current_stock <= minimum_stock:
        status = "CRITICAL"

    elif current_stock < target_stock:
        status = "LOW"

    else:
        status = "NORMAL"

    # --------------------------------------------------------
    # Recommendation
    # --------------------------------------------------------

    if status == "CRITICAL":
        recommendation = (
            "Immediate replenishment required."
        )

    elif status == "LOW":
        recommendation = (
            "Plan replenishment before stock "
            "falls below the required level."
        )

    else:
        recommendation = (
            "Stock is sufficient for the forecast period."
        )

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {
        "station": input_data["station"],
        "item_id": input_data["item_id"],
        "item_name": input_data["item_name"],
        "predicted_7day_requirement": round(
            predicted_requirement, 2
        ),
        "current_stock": round(
            current_stock, 2
        ),
        "minimum_stock": round(
            minimum_stock, 2
        ),
        "target_stock": round(
            target_stock, 2
        ),
        "reorder_quantity": round(
            reorder_quantity, 2
        ),
        "status": status,
        "recommendation": recommendation,
    }


# ============================================================
# TEST INPUT
# ============================================================

if __name__ == "__main__":

    test_input = {
        "expedition_id": "EXP_2026_001",
        "item_id": "ITEM_001",
        "item_name": "Rice",
        "item_category": "Food",
        "station": "Maitri",

        "personnel_count": 35,
        "expedition_duration": 180,

        "opening_stock": 500,
        "minimum_stock": 300,
        "lead_time": 30,

        "previous_expedition_consumption": 210,
        "inventory_usage_history": 35.0,

        "consumption_lag_1": 34.0,
        "consumption_lag_7": 36.0,
        "consumption_avg_7": 35.0,
        "consumption_avg_14": 35.0,

        "temperature_mean": -9.5,
        "temperature_min": -15.0,
        "temperature_max": -3.0,

        "pressure_mean": 980.0,
        "pressure_min": 975.0,
        "pressure_max": 985.0,

        "wind_speed_mean": 18.0,
        "wind_speed_max": 30.0,
    }

    try:

        result = predict_inventory(test_input)

        print("\n" + "=" * 60)
        print("POLAR INVENTORY DEMAND PREDICTION")
        print("=" * 60)

        print(json.dumps(
            result,
            indent=4
        ))

        print("\n✓ Prediction completed successfully.")

    except Exception as error:

        print(f"\n✗ Prediction failed: {error}")