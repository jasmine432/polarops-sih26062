import pandas as pd
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/processed/weather_enhanced_inventory_50000.csv"
)

OUTPUT_DIR = Path(
    "data/processed/weather"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# 1. LOAD DATA
# ============================================================

print("=" * 70)
print("LOADING WEATHER-ENHANCED DATASET")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

df["date"] = pd.to_datetime(df["date"])

print(f"Original rows: {len(df)}")


# ============================================================
# 2. CORE NCPOR WEATHER FEATURES
# ============================================================
#
# We use only weather variables that are confirmed/available
# for the merged records.
#
# Humidity is NOT used because Maitri does not provide confirmed
# humidity in the selected source.
#
# Wind direction is also excluded from the first model because
# it is not consistently available.
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
# 3. CHECK WEATHER COVERAGE
# ============================================================

print("\nWeather feature coverage:")

print(
    df[weather_features]
    .notna()
    .sum()
)


# ============================================================
# 4. REMOVE RECORDS WITHOUT CORE WEATHER
# ============================================================

before = len(df)

df = df.dropna(
    subset=weather_features
).copy()

after = len(df)

print("\nWeather filtering:")

print(
    f"Records before weather filtering : {before}"
)

print(
    f"Records with complete core weather: {after}"
)

print(
    f"Records removed                  : {before - after}"
)

print(
    f"Weather coverage                 : "
    f"{after / before * 100:.2f}%"
)


# ============================================================
# SAFETY CHECK
# ============================================================

if len(df) == 0:
    raise ValueError(
        "No rows remain after weather filtering. "
        "Check the weather merge."
    )


# ============================================================
# 5. SORT BY STATION, ITEM AND DATE
# ============================================================

df = df.sort_values(
    ["station", "item_id", "date"]
).reset_index(drop=True)


# ============================================================
# 6. CREATE FUTURE 7-DAY DEMAND TARGET
# ============================================================

print("\nCreating future 7-day demand target...")

df["future_7day_requirement"] = (
    df.groupby(
        ["station", "item_id"]
    )["consumed_quantity"]
    .transform(
        lambda x:
            x.shift(-1)
             .rolling(
                 window=7,
                 min_periods=7
             )
             .sum()
             .shift(-6)
    )
)


# ============================================================
# 7. REMOVE ROWS WITHOUT FUTURE TARGET
# ============================================================

before_target = len(df)

df = df.dropna(
    subset=[
        "future_7day_requirement"
    ]
).copy()

after_target = len(df)

print(
    f"Rows after target creation: {after_target}"
)

print(
    f"Rows removed because future "
    f"7 days unavailable: "
    f"{before_target - after_target}"
)


# ============================================================
# 8. CLEAN TARGET
# ============================================================

df["future_7day_requirement"] = (
    df["future_7day_requirement"]
    .clip(lower=0)
    .round(2)
)


# ============================================================
# 9. SORT CHRONOLOGICALLY
# ============================================================

df = df.sort_values(
    "date"
).reset_index(drop=True)


# ============================================================
# 10. DATE-BASED 70/15/15 SPLIT
# ============================================================

unique_dates = sorted(
    df["date"].unique()
)

number_of_dates = len(
    unique_dates
)

train_index = int(
    number_of_dates * 0.70
)

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
# 11. SAVE DATASETS
# ============================================================

full_file = (
    OUTPUT_DIR /
    "weather_inventory_with_target.csv"
)

train_file = (
    OUTPUT_DIR /
    "weather_inventory_train.csv"
)

validation_file = (
    OUTPUT_DIR /
    "weather_inventory_validation.csv"
)

test_file = (
    OUTPUT_DIR /
    "weather_inventory_test.csv"
)


df.to_csv(
    full_file,
    index=False
)

train_df.to_csv(
    train_file,
    index=False
)

validation_df.to_csv(
    validation_file,
    index=False
)

test_df.to_csv(
    test_file,
    index=False
)


# ============================================================
# 12. DISPLAY SPLIT INFORMATION
# ============================================================

print("\n")
print("=" * 70)
print("WEATHER ML DATASET SPLIT")
print("=" * 70)

print(
    f"Total rows       : {len(df)}"
)

print(
    f"Training rows    : {len(train_df)}"
)

print(
    f"Validation rows  : {len(validation_df)}"
)

print(
    f"Testing rows     : {len(test_df)}"
)


# ============================================================
# 13. DATE RANGES
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
# 14. VERIFY DATE OVERLAP
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

print(
    "Train/Validation:",
    "PASS"
    if train_dates.isdisjoint(validation_dates)
    else "FAIL"
)

print(
    "Validation/Test:",
    "PASS"
    if validation_dates.isdisjoint(test_dates)
    else "FAIL"
)

print(
    "Train/Test:",
    "PASS"
    if train_dates.isdisjoint(test_dates)
    else "FAIL"
)


# ============================================================
# 15. WEATHER STATISTICS
# ============================================================

print("\nWeather statistics:")

print(
    df[weather_features].describe()
)


# ============================================================
# 16. TARGET STATISTICS
# ============================================================

print("\nTarget statistics:")

print(
    df["future_7day_requirement"].describe()
)


# ============================================================
# 17. FINAL MISSING-VALUE CHECK
# ============================================================

print("\nMissing values in model weather features:")

print(
    df[
        weather_features
        + ["future_7day_requirement"]
    ]
    .isnull()
    .sum()
)


# ============================================================
# 18. FINAL OUTPUT
# ============================================================

print("\n")
print("=" * 70)
print("FILES CREATED")
print("=" * 70)

print(
    f"Full dataset      : {full_file}"
)

print(
    f"Training dataset  : {train_file}"
)

print(
    f"Validation dataset: {validation_file}"
)

print(
    f"Testing dataset   : {test_file}"
)

print("\n✓ Weather-enhanced target and split completed.")
print("=" * 70)