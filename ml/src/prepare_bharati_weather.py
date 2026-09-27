import pandas as pd
from pathlib import Path

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/raw/iig_bharati.csv"
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
    "bharati_daily_weather.csv"
)

# ============================================================
# 1. LOAD NCPOR WEATHER DATA
# ============================================================

print("=" * 60)
print("LOADING NCPOR BHARATI WEATHER DATA")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)

# Convert timestamp
df["obstime"] = pd.to_datetime(
    df["obstime"],
    errors="coerce"
)

# Remove invalid timestamps
df = df.dropna(
    subset=["obstime"]
).copy()

# ============================================================
# 2. CREATE DATE COLUMN
# ============================================================

df["date"] = (
    df["obstime"]
    .dt
    .normalize()
)

# ============================================================
# 3. CONVERT WEATHER VALUES TO NUMERIC
# ============================================================

weather_columns = [
    "tempr",
    "ap",
    "ws",
    "wd",
    "rh"
]

for column in weather_columns:

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )

# ============================================================
# 4. CREATE DAILY WEATHER FEATURES
# ============================================================

daily_weather = (
    df.groupby("date")
    .agg(
        temperature_mean=("tempr", "mean"),
        temperature_min=("tempr", "min"),
        temperature_max=("tempr", "max"),

        pressure_mean=("ap", "mean"),

        wind_speed_mean=("ws", "mean"),
        wind_speed_max=("ws", "max"),

        wind_direction_mean=("wd", "mean"),

        humidity_mean=("rh", "mean"),
        humidity_min=("rh", "min"),
        humidity_max=("rh", "max"),

        weather_observations=("tempr", "count")
    )
    .reset_index()
)

# ============================================================
# 5. ROUND VALUES
# ============================================================

numeric_columns = [
    "temperature_mean",
    "temperature_min",
    "temperature_max",
    "pressure_mean",
    "wind_speed_mean",
    "wind_speed_max",
    "wind_direction_mean",
    "humidity_mean",
    "humidity_min",
    "humidity_max"
]

daily_weather[numeric_columns] = (
    daily_weather[numeric_columns]
    .round(3)
)

# ============================================================
# 6. ADD STATION
# ============================================================

daily_weather["station"] = "Bharati"

# ============================================================
# 7. REORDER COLUMNS
# ============================================================

daily_weather = daily_weather[
    [
        "station",
        "date",

        "temperature_mean",
        "temperature_min",
        "temperature_max",

        "pressure_mean",

        "wind_speed_mean",
        "wind_speed_max",

        "wind_direction_mean",

        "humidity_mean",
        "humidity_min",
        "humidity_max",

        "weather_observations"
    ]
]

# ============================================================
# 8. SORT
# ============================================================

daily_weather = (
    daily_weather
    .sort_values("date")
    .reset_index(drop=True)
)

# ============================================================
# 9. SAVE
# ============================================================

daily_weather.to_csv(
    OUTPUT_FILE,
    index=False
)

# ============================================================
# 10. DISPLAY RESULTS
# ============================================================

print("\nDaily weather dataset created successfully.")

print(
    f"Hourly records : {len(df)}"
)

print(
    f"Daily records  : {len(daily_weather)}"
)

print(
    f"Date range     : "
    f"{daily_weather['date'].min().date()} "
    f"→ "
    f"{daily_weather['date'].max().date()}"
)

print(
    f"Missing values : "
    f"{daily_weather.isnull().sum().sum()}"
)

print(
    f"Saved to       : {OUTPUT_FILE}"
)

print("\nFirst 5 records:")

print(
    daily_weather.head()
)

print("\nDone!")
