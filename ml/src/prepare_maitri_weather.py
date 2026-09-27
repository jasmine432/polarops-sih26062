import pandas as pd
from pathlib import Path

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/raw/imd_maitri.csv"
)

OUTPUT_DIR = Path(
    "data/processed"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

OUTPUT_FILE = (
    OUTPUT_DIR /
    "maitri_daily_weather.csv"
)

# ============================================================
# 1. LOAD NCPOR MAITRI DATA
# ============================================================

print("=" * 60)
print("LOADING NCPOR MAITRI WEATHER DATA")
print("=" * 60)

df = pd.read_csv(
    INPUT_FILE,
    header=None
)

print(
    f"Raw records: {len(df)}"
)

# ============================================================
# 2. RENAME CONFIRMED COLUMNS
# ============================================================

df = df.iloc[:, :4].copy()

df.columns = [
    "obstime",
    "temperature",
    "pressure",
    "wind_speed"
]

# ============================================================
# 3. CONVERT DATA TYPES
# ============================================================

df["obstime"] = pd.to_datetime(
    df["obstime"],
    errors="coerce"
)

for column in [
    "temperature",
    "pressure",
    "wind_speed"
]:

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )

# ============================================================
# 4. REMOVE INVALID RECORDS
# ============================================================

df = df.dropna(
    subset=[
        "obstime",
        "temperature",
        "pressure",
        "wind_speed"
    ]
).copy()

# ============================================================
# 5. CREATE DATE
# ============================================================

df["date"] = (
    df["obstime"]
    .dt
    .normalize()
)

# ============================================================
# 6. DAILY AGGREGATION
# ============================================================

daily_weather = (
    df.groupby("date")
    .agg(
        temperature_mean=(
            "temperature",
            "mean"
        ),

        temperature_min=(
            "temperature",
            "min"
        ),

        temperature_max=(
            "temperature",
            "max"
        ),

        pressure_mean=(
            "pressure",
            "mean"
        ),

        pressure_min=(
            "pressure",
            "min"
        ),

        pressure_max=(
            "pressure",
            "max"
        ),

        wind_speed_mean=(
            "wind_speed",
            "mean"
        ),

        wind_speed_max=(
            "wind_speed",
            "max"
        ),

        weather_observations=(
            "temperature",
            "count"
        )
    )
    .reset_index()
)

# ============================================================
# 7. ADD STATION
# ============================================================

daily_weather["station"] = "Maitri"

# ============================================================
# 8. ROUND NUMERIC VALUES
# ============================================================

numeric_columns = [
    "temperature_mean",
    "temperature_min",
    "temperature_max",
    "pressure_mean",
    "pressure_min",
    "pressure_max",
    "wind_speed_mean",
    "wind_speed_max"
]

daily_weather[numeric_columns] = (
    daily_weather[numeric_columns]
    .round(3)
)

# ============================================================
# 9. REORDER COLUMNS
# ============================================================

daily_weather = daily_weather[
    [
        "station",
        "date",

        "temperature_mean",
        "temperature_min",
        "temperature_max",

        "pressure_mean",
        "pressure_min",
        "pressure_max",

        "wind_speed_mean",
        "wind_speed_max",

        "weather_observations"
    ]
]

# ============================================================
# 10. SORT
# ============================================================

daily_weather = (
    daily_weather
    .sort_values("date")
    .reset_index(drop=True)
)

# ============================================================
# 11. SAVE
# ============================================================

daily_weather.to_csv(
    OUTPUT_FILE,
    index=False
)

# ============================================================
# 12. DISPLAY RESULTS
# ============================================================

print()
print("=" * 60)
print("MAITRI DAILY WEATHER DATASET CREATED")
print("=" * 60)

print(
    f"Raw records       : {len(df)}"
)

print(
    f"Daily records     : {len(daily_weather)}"
)

print(
    f"Date range        : "
    f"{daily_weather['date'].min().date()} "
    f"→ "
    f"{daily_weather['date'].max().date()}"
)

print(
    f"Missing values    : "
    f"{daily_weather.isnull().sum().sum()}"
)

print(
    f"Station           : Maitri"
)

print(
    f"Output file       : {OUTPUT_FILE}"
)

print()
print("Columns:")

print(
    daily_weather.columns.tolist()
)

print()
print("First 5 records:")

print(
    daily_weather.head().to_string(
        index=False
    )
)

print()
print("=" * 60)
print("DONE")
print("=" * 60)