import pandas as pd
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

# Project root:
# C:\sih 62\ml
ML_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    ML_ROOT
    / "data"
    / "processed"
    / "weather"
    / "weather_inventory_with_target.csv"
)

OUTPUT_DIR = (
    ML_ROOT
    / "data"
    / "processed"
    / "leakage_safe"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# 1. LOAD DATA
# ============================================================

print("=" * 70)
print("CREATING LEAKAGE-SAFE FORECASTING DATASET")
print("=" * 70)

print(f"Input file: {INPUT_FILE}")

if not INPUT_FILE.exists():
    raise FileNotFoundError(
        f"\nInput file not found:\n{INPUT_FILE}\n\n"
        "Make sure the weather target dataset has already been created."
    )

df = pd.read_csv(INPUT_FILE)

df["date"] = pd.to_datetime(df["date"])

print(f"Input rows: {len(df)}")


# ============================================================
# 2. CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "station",
    "item_id",
    "date",
    "consumed_quantity",
    "future_7day_requirement",

    # Operational information
    "item_name",
    "item_category",
    "personnel_count",
    "expedition_duration",
    "opening_stock",
    "minimum_stock",
    "lead_time",
    "previous_expedition_consumption",
    "inventory_usage_history",

    # Weather
    "temperature_mean",
    "temperature_min",
    "temperature_max",
    "pressure_mean",
    "pressure_min",
    "pressure_max",
    "wind_speed_mean",
    "wind_speed_max"
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        "The following required columns are missing:\n"
        + "\n".join(missing_columns)
    )

print("✓ Required columns verified")


# ============================================================
# 3. SORT DATA
# ============================================================

df = df.sort_values(
    ["station", "item_id", "date"]
).reset_index(drop=True)


# ============================================================
# 4. CREATE HISTORICAL DEMAND FEATURES
# ============================================================

print("\nCreating historical demand features...")


# ------------------------------------------------------------
# Previous day consumption
# ------------------------------------------------------------

df["consumption_lag_1"] = (
    df.groupby(
        ["station", "item_id"]
    )["consumed_quantity"]
    .shift(1)
)


# ------------------------------------------------------------
# Consumption 7 days ago
# ------------------------------------------------------------

df["consumption_lag_7"] = (
    df.groupby(
        ["station", "item_id"]
    )["consumed_quantity"]
    .shift(7)
)


# ------------------------------------------------------------
# Previous 7-day average
# ------------------------------------------------------------

df["consumption_avg_7"] = (
    df.groupby(
        ["station", "item_id"]
    )["consumed_quantity"]
    .transform(
        lambda x:
            x.shift(1)
             .rolling(
                 window=7,
                 min_periods=7
             )
             .mean()
    )
)


# ------------------------------------------------------------
# Previous 14-day average
# ------------------------------------------------------------

df["consumption_avg_14"] = (
    df.groupby(
        ["station", "item_id"]
    )["consumed_quantity"]
    .transform(
        lambda x:
            x.shift(1)
             .rolling(
                 window=14,
                 min_periods=14
             )
             .mean()
    )
)


print("✓ consumption_lag_1 created")
print("✓ consumption_lag_7 created")
print("✓ consumption_avg_7 created")
print("✓ consumption_avg_14 created")


# ============================================================
# 5. REMOVE ROWS WITHOUT SUFFICIENT HISTORY
# ============================================================

before_history = len(df)

df = df.dropna(
    subset=[
        "consumption_lag_1",
        "consumption_lag_7",
        "consumption_avg_7",
        "consumption_avg_14"
    ]
).copy()

after_history = len(df)

print("\nHistory filtering:")

print(
    f"Rows before history filtering : {before_history}"
)

print(
    f"Rows after history filtering  : {after_history}"
)

print(
    f"Rows removed                  : "
    f"{before_history - after_history}"
)


# ============================================================
# 6. DEFINE LEAKAGE-SAFE FEATURES
# ============================================================

print("\nDefining leakage-safe features...")


# ------------------------------------------------------------
# Operational features available at prediction time
# ------------------------------------------------------------

operational_features = [

    # Item information
    "item_id",
    "item_name",
    "item_category",

    # Station
    "station",

    # Expedition information
    "personnel_count",
    "expedition_duration",

    # Current inventory information
    "opening_stock",
    "minimum_stock",
    "lead_time",

    # Historical operational information
    "previous_expedition_consumption",
    "inventory_usage_history",

    # Historical demand
    "consumption_lag_1",
    "consumption_lag_7",
    "consumption_avg_7",
    "consumption_avg_14"
]


# ------------------------------------------------------------
# Real NCPOR weather features
# ------------------------------------------------------------

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


# ------------------------------------------------------------
# Final feature list
# ------------------------------------------------------------

features = (
    operational_features
    + weather_features
)


# ============================================================
# 7. EXPLICITLY EXCLUDE LEAKAGE / IDENTIFIER COLUMNS
# ============================================================

leakage_prone_columns = [
    "consumed_quantity",
    "closing_stock",
    "expedition_id"
]

print("\nExcluded leakage / identifier columns:")

for column in leakage_prone_columns:
    print(f"✗ {column}")


# ============================================================
# 8. CREATE FINAL DATAFRAME
# ============================================================

final_columns = (
    ["date"]
    + features
    + ["future_7day_requirement"]
)

df = df[
    final_columns
].copy()


# ============================================================
# 9. CHECK MISSING VALUES
# ============================================================

print("\nChecking missing values...")

missing_values = df.isnull().sum()

missing_values = missing_values[
    missing_values > 0
]

if len(missing_values) == 0:

    print("✓ No missing values in final dataset")

else:

    print("Missing values found:")
    print(missing_values)


# ============================================================
# 10. CHECK TARGET
# ============================================================

print("\nChecking target...")

print(
    "Target: future_7day_requirement"
)

print(
    f"Target rows: "
    f"{df['future_7day_requirement'].notna().sum()}"
)

print(
    f"Target minimum: "
    f"{df['future_7day_requirement'].min():.2f}"
)

print(
    f"Target maximum: "
    f"{df['future_7day_requirement'].max():.2f}"
)

print(
    f"Target mean: "
    f"{df['future_7day_requirement'].mean():.2f}"
)


# ============================================================
# 11. SORT CHRONOLOGICALLY
# ============================================================

df = df.sort_values(
    "date"
).reset_index(drop=True)


# ============================================================
# 12. DATE-BASED TRAIN / VALIDATION / TEST SPLIT
# ============================================================

print("\nCreating chronological split...")

unique_dates = sorted(
    df["date"].unique()
)

number_of_dates = len(
    unique_dates
)

if number_of_dates < 20:
    raise ValueError(
        "Not enough unique dates to create "
        "train/validation/test split."
    )


# ------------------------------------------------------------
# 70% TRAIN
# ------------------------------------------------------------

train_index = int(
    number_of_dates * 0.70
)


# ------------------------------------------------------------
# 85% cumulative = 15% VALIDATION
# ------------------------------------------------------------

validation_index = int(
    number_of_dates * 0.85
)


train_end_date = unique_dates[
    train_index - 1
]

validation_end_date = unique_dates[
    validation_index - 1
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


# ============================================================
# 13. CHECK SPLIT
# ============================================================

print("\n")
print("=" * 70)
print("LEAKAGE-SAFE DATASET SPLIT")
print("=" * 70)

print(
    f"Total rows      : {len(df)}"
)

print(
    f"Training rows   : {len(train_df)}"
)

print(
    f"Validation rows : {len(validation_df)}"
)

print(
    f"Testing rows    : {len(test_df)}"
)


# ============================================================
# 14. DATE RANGES
# ============================================================

print("\nDate ranges:")

print(
    f"Train      : "
    f"{train_df['date'].min().date()} "
    f"→ "
    f"{train_df['date'].max().date()}"
)

print(
    f"Validation : "
    f"{validation_df['date'].min().date()} "
    f"→ "
    f"{validation_df['date'].max().date()}"
)

print(
    f"Test       : "
    f"{test_df['date'].min().date()} "
    f"→ "
    f"{test_df['date'].max().date()}"
)


# ============================================================
# 15. VERIFY DATE OVERLAP
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


train_validation_overlap = (
    train_dates.intersection(
        validation_dates
    )
)

validation_test_overlap = (
    validation_dates.intersection(
        test_dates
    )
)

train_test_overlap = (
    train_dates.intersection(
        test_dates
    )
)


print("\nDate overlap checks:")

print(
    "Train / Validation:",
    "PASS"
    if len(train_validation_overlap) == 0
    else "FAIL"
)

print(
    "Validation / Test:",
    "PASS"
    if len(validation_test_overlap) == 0
    else "FAIL"
)

print(
    "Train / Test:",
    "PASS"
    if len(train_test_overlap) == 0
    else "FAIL"
)


# ============================================================
# 16. VERIFY LEAKAGE / IDENTIFIER COLUMNS
# ============================================================

print("\n")
print("=" * 70)
print("LEAKAGE / IDENTIFIER CHECK")
print("=" * 70)

for column in leakage_prone_columns:

    if column in df.columns:

        print(
            f"WARNING: {column} is still present"
        )

    else:

        print(
            f"✓ {column} excluded from model dataset"
        )


# ============================================================
# 17. DISPLAY FEATURES
# ============================================================

print("\n")
print("=" * 70)
print("FINAL MODEL FEATURES")
print("=" * 70)

for index, feature in enumerate(
    features,
    start=1
):

    print(
        f"{index:02d}. {feature}"
    )


# ============================================================
# 18. SAVE FILES
# ============================================================

full_path = (
    OUTPUT_DIR
    / "leakage_safe_weather_inventory.csv"
)

train_path = (
    OUTPUT_DIR
    / "train.csv"
)

validation_path = (
    OUTPUT_DIR
    / "validation.csv"
)

test_path = (
    OUTPUT_DIR
    / "test.csv"
)


df.to_csv(
    full_path,
    index=False
)

train_df.to_csv(
    train_path,
    index=False
)

validation_df.to_csv(
    validation_path,
    index=False
)

test_df.to_csv(
    test_path,
    index=False
)


# ============================================================
# 19. FINAL SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("FILES CREATED")
print("=" * 70)

print(
    f"Full dataset      : {full_path}"
)

print(
    f"Training dataset  : {train_path}"
)

print(
    f"Validation dataset: {validation_path}"
)

print(
    f"Testing dataset   : {test_path}"
)


print("\n")
print("=" * 70)
print("✓ LEAKAGE-SAFE DATASET CREATED SUCCESSFULLY")
print("=" * 70)