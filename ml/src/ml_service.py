from pathlib import Path
import json
import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

# ml/
ML_DIR = Path(__file__).resolve().parents[1]

# ml/models/leakage_safe/
MODEL_DIR = ML_DIR / "models" / "leakage_safe"

MODEL_PATH = MODEL_DIR / "best_leakage_safe_inventory_model.joblib"
BASELINE_PATH = MODEL_DIR / "baseline_metrics.json"


# ============================================================
# MODEL INFORMATION
# ============================================================

MODEL_VERSION = "inventory_demand_gb_v1"


# ============================================================
# MODEL FEATURES
# IMPORTANT:
# These must exactly match the features used during training.
# ============================================================

MODEL_FEATURES = [
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
        f"ML model not found at: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)


# ============================================================
# LOAD BASELINE METRICS
# ============================================================

if not BASELINE_PATH.exists():
    raise FileNotFoundError(
        f"Baseline metrics not found at: {BASELINE_PATH}"
    )

with open(BASELINE_PATH, "r", encoding="utf-8") as f:
    baseline_data = json.load(f)


# ============================================================
# EXTRACT CATEGORY BASELINES
# ============================================================

def load_category_baselines(data):
    """
    Extract category mean values from baseline_metrics.json.

    This function supports the expected structure:
        category_means: {
            "Food": 55.47,
            "Fuel": 125.63,
            ...
        }

    It also handles a few possible nested structures safely.
    """

    # Expected structure
    if isinstance(data, dict):

        if "category_means" in data:
            category_means = data["category_means"]

            if isinstance(category_means, dict):
                return {
                    str(k).strip().lower(): float(v)
                    for k, v in category_means.items()
                }

        # Alternative possible naming
        if "baseline_category_means" in data:
            category_means = data["baseline_category_means"]

            if isinstance(category_means, dict):
                return {
                    str(k).strip().lower(): float(v)
                    for k, v in category_means.items()
                }

        # Search one level deeper
        for value in data.values():

            if isinstance(value, dict):

                if "category_means" in value:
                    category_means = value["category_means"]

                    if isinstance(category_means, dict):
                        return {
                            str(k).strip().lower(): float(v)
                            for k, v in category_means.items()
                        }

    raise ValueError(
        "Could not find category baseline means in baseline_metrics.json"
    )


CATEGORY_BASELINES = load_category_baselines(baseline_data)


# ============================================================
# GLOBAL BASELINE
# ============================================================

def load_global_baseline(data):
    """
    Load global training mean if available.
    """

    possible_keys = [
        "global_training_mean",
        "global_mean",
        "training_mean",
        "baseline_mean",
    ]

    if isinstance(data, dict):

        for key in possible_keys:

            if key in data:

                try:
                    return float(data[key])
                except (TypeError, ValueError):
                    pass

        # Search nested dictionaries
        for value in data.values():

            if isinstance(value, dict):

                for key in possible_keys:

                    if key in value:

                        try:
                            return float(value[key])
                        except (TypeError, ValueError):
                            pass

    # Safe fallback based on the training data used in this project
    return 39.16


GLOBAL_BASELINE = load_global_baseline(baseline_data)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _safe_float(value, default=0.0):
    """
    Convert a value to float safely.
    """

    if value is None:
        return default

    try:
        value = float(value)

        if pd.isna(value):
            return default

        return value

    except (TypeError, ValueError):
        return default


def _normalize_category(category):
    """
    Normalize item category for baseline lookup.
    """

    if category is None:
        return ""

    return str(category).strip().lower()


def _has_usage_history(data):
    """
    Determine whether the item has meaningful historical usage.

    The main indicator is inventory_usage_history.

    If that is unavailable/zero, we also check historical
    consumption features.

    Returns:
        True  -> ML model can be used
        False -> cold-start fallback should be used
    """

    # Primary history indicator
    history_value = _safe_float(
        data.get("inventory_usage_history"),
        default=0.0
    )

    if history_value > 0:
        return True

    # Secondary historical features
    historical_features = [
        "previous_expedition_consumption",
        "consumption_lag_1",
        "consumption_lag_7",
        "consumption_avg_7",
        "consumption_avg_14",
    ]

    historical_values = []

    for feature in historical_features:

        value = _safe_float(
            data.get(feature),
            default=0.0
        )

        historical_values.append(value)

    # If any historical usage information exists,
    # treat the item as having history.
    if any(value > 0 for value in historical_values):
        return True

    return False


def _get_category_baseline(category):
    """
    Return category baseline.

    If the category does not exist, use the global
    training mean.
    """

    normalized_category = _normalize_category(category)

    if normalized_category in CATEGORY_BASELINES:
        return CATEGORY_BASELINES[normalized_category]

    return GLOBAL_BASELINE


# ============================================================
# MAIN PREDICTION FUNCTION
# ============================================================

def predict_inventory(data):
    """
    Predict inventory requirement for the next 7 days.

    Normal case:
        Gradient Boosting model is used.

    Cold-start case:
        Category baseline mean is used when there is
        no historical usage.

    Returns PRD-aligned response.
    """

    # --------------------------------------------------------
    # 1. Validate input
    # --------------------------------------------------------

    if not isinstance(data, dict):
        raise ValueError("Input must be a dictionary.")

    # Required identifiers
    item_id = data.get("item_id")

    if not item_id:
        raise ValueError("item_id is required.")

    item_category = data.get("item_category")

    if not item_category:
        raise ValueError("item_category is required.")

    # --------------------------------------------------------
    # 2. Check for cold-start
    # --------------------------------------------------------

    has_history = _has_usage_history(data)

    # --------------------------------------------------------
    # 3. COLD-START CASE
    # --------------------------------------------------------

    if not has_history:

        predicted_requirement = _get_category_baseline(
            item_category
        )

        prediction_source = "CATEGORY_BASELINE"

        low_confidence = True

    # --------------------------------------------------------
    # 4. NORMAL ML CASE
    # --------------------------------------------------------

    else:

        # Make a copy so we don't modify the original input
        prediction_data = data.copy()

        # Check required model features
        missing_features = [
            feature
            for feature in MODEL_FEATURES
            if feature not in prediction_data
        ]

        if missing_features:
            raise ValueError(
                "Missing model features: "
                + ", ".join(missing_features)
            )

        # Build DataFrame in EXACT training feature order
        input_df = pd.DataFrame(
            [[prediction_data[feature] for feature in MODEL_FEATURES]],
            columns=MODEL_FEATURES
        )

        # Predict
        prediction = model.predict(input_df)[0]

        # Convert to float
        predicted_requirement = float(prediction)

        # Never allow negative requirement
        predicted_requirement = max(
            0.0,
            predicted_requirement
        )

        prediction_source = "ML_MODEL"

        low_confidence = False

    # --------------------------------------------------------
    # 5. CURRENT STOCK
    # --------------------------------------------------------

    current_stock = _safe_float(
        data.get("current_stock", data.get("opening_stock")),
        default=0.0
    )

    # --------------------------------------------------------
    # 6. RECOMMENDED ADDITIONAL QUANTITY
    #
    # PRD:
    # max(0, predicted_requirement - current_stock)
    # --------------------------------------------------------

    recommended_additional_qty = max(
        0.0,
        predicted_requirement - current_stock
    )

    # Round quantities for API readability
    predicted_requirement = round(
        predicted_requirement,
        2
    )

    current_stock = round(
        current_stock,
        2
    )

    recommended_additional_qty = round(
        recommended_additional_qty,
        2
    )

    # --------------------------------------------------------
    # 7. STATUS
    # --------------------------------------------------------

    minimum_stock = _safe_float(
        data.get("minimum_stock"),
        default=0.0
    )

    if current_stock <= 0:
        status = "OUT_OF_STOCK"

    elif current_stock < minimum_stock:
        status = "LOW_STOCK"

    elif current_stock < predicted_requirement:
        status = "REQUIREMENT_GAP"

    else:
        status = "NORMAL"

    # --------------------------------------------------------
    # 8. HUMAN-READABLE RECOMMENDATION
    # --------------------------------------------------------

    if prediction_source == "CATEGORY_BASELINE":

        recommendation = (
            "No usage history is available. "
            "Requirement is estimated using the category baseline. "
            "Review manually before restocking."
        )

    elif recommended_additional_qty > 0:

        recommendation = (
            f"Additional stock of "
            f"{recommended_additional_qty:.2f} units "
            f"is recommended to cover the predicted "
            f"7-day requirement."
        )

    else:

        recommendation = (
            "Current stock covers the predicted "
            "7-day requirement."
        )

    # --------------------------------------------------------
    # 9. FINAL API RESPONSE
    # --------------------------------------------------------

    response = {
        "item_id": item_id,

        "predicted_requirement": predicted_requirement,

        "current_stock": current_stock,

        "recommended_additional_qty":
            recommended_additional_qty,

        "model_version": MODEL_VERSION,

        "station": data.get("station"),

        "item_name": data.get("item_name"),

        "minimum_stock": minimum_stock,

        "lead_time_days": data.get("lead_time"),

        "status": status,

        "recommendation": recommendation,

        # Cold-start / explainability fields
        "prediction_source": prediction_source,

        "low_confidence": low_confidence,
    }

    return response