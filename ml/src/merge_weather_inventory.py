import pandas as pd
from pathlib import Path

# ============================================================
# FILE PATHS
# ============================================================

INVENTORY_FILE = Path(
    "data/synthetic/inventory_ml_50000_weather.csv"
)

BHARATI_FILE = Path(
    "data/processed/bharati_daily_weather.csv"
)

MAITRI_FILE = Path(
    "data/processed/maitri_daily_weather.csv"
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
    "weather_enhanced_inventory_50000.csv"
)

# ============================================================
# 1. LOAD INVENTORY DATA
# ============================================================

print("=" * 70)
print("LOADING OPERATIONAL INVENTORY DATA")
print("=" * 70)

inventory = pd.read_csv(
    INVENTORY_FILE
)

inventory["date"] = pd.to_datetime(
    inventory["date"]
)

print(
    f"Inventory rows: {len(inventory)}"
)

print(
    f"Inventory date range: "
    f"{inventory['date'].min().date()} "
    f"→ "
    f"{inventory['date'].max().date()}"
)

# ============================================================
# 2. LOAD BHARATI WEATHER
# ============================================================

print("\n" + "=" * 70)
print("LOADING BHARATI NCPOR WEATHER")
print("=" * 70)

bharati = pd.read_csv(
    BHARATI_FILE
)

bharati["date"] = pd.to_datetime(
    bharati["date"]
)

print(
    f"Bharati weather rows: {len(bharati)}"
)

print(
    f"Bharati date range: "
    f"{bharati['date'].min().date()} "
    f"→ "
    f"{bharati['date'].max().date()}"
)

# ============================================================
# 3. LOAD MAITRI WEATHER
# ============================================================

print("\n" + "=" * 70)
print("LOADING MAITRI NCPOR WEATHER")
print("=" * 70)

maitri = pd.read_csv(
    MAITRI_FILE
)

maitri["date"] = pd.to_datetime(
    maitri["date"]
)

print(
    f"Maitri weather rows: {len(maitri)}"
)

print(
    f"Maitri date range: "
    f"{maitri['date'].min().date()} "
    f"→ "
    f"{maitri['date'].max().date()}"
)

# ============================================================
# 4. MAKE WEATHER COLUMN NAMES CONSISTENT
# ============================================================

# Bharati has humidity.
# Maitri does not have confirmed humidity values,
# so missing humidity will remain NaN for Maitri.

# ============================================================
# 5. COMBINE BHARATI + MAITRI
# ============================================================

weather = pd.concat(
    [
        bharati,
        maitri
    ],
    ignore_index=True
)

weather = weather.sort_values(
    ["station", "date"]
).reset_index(drop=True)

# ============================================================
# 6. CHECK DUPLICATE STATION + DATE
# ============================================================

duplicates = weather.duplicated(
    subset=["station", "date"]
).sum()

print("\nDuplicate station/date records:", duplicates)

if duplicates > 0:

    print(
        "Removing duplicate station/date records..."
    )

    weather = weather.drop_duplicates(
        subset=["station", "date"],
        keep="first"
    )

# ============================================================
# 7. MERGE WITH INVENTORY
# ============================================================

print("\n" + "=" * 70)
print("MERGING INVENTORY + NCPOR WEATHER")
print("=" * 70)

merged = inventory.merge(
    weather,
    on=["station", "date"],
    how="left",
    indicator=True
)

# ============================================================
# 8. MATCH STATISTICS
# ============================================================

matched = (
    merged["_merge"] == "both"
).sum()

unmatched = (
    merged["_merge"] == "left_only"
).sum()

print(
    f"Total inventory records : {len(merged)}"
)

print(
    f"Weather matched         : {matched}"
)

print(
    f"Weather unmatched       : {unmatched}"
)

print(
    f"Match percentage        : "
    f"{matched / len(merged) * 100:.2f}%"
)

# ============================================================
# 9. MATCHING BY STATION
# ============================================================

print("\nMatching by station:")

for station in [
    "Bharati",
    "Maitri"
]:

    station_data = merged[
        merged["station"] == station
    ]

    station_matched = (
        station_data["_merge"] == "both"
    ).sum()

    station_total = len(
        station_data
    )

    percentage = (
        station_matched /
        station_total *
        100
        if station_total > 0
        else 0
    )

    print(
        f"{station}: "
        f"{station_matched}/{station_total} "
        f"({percentage:.2f}%)"
    )

# ============================================================
# 10. REMOVE MERGE INDICATOR
# ============================================================

merged = merged.drop(
    columns=["_merge"]
)

# ============================================================
# 11. WEATHER MISSING VALUE REPORT
# ============================================================

weather_columns = [
    "temperature_mean",
    "temperature_min",
    "temperature_max",
    "pressure_mean",
    "wind_speed_mean",
    "wind_speed_max"
]

# Add humidity only if present
if "humidity_mean" in merged.columns:

    weather_columns.extend([
        "humidity_mean",
        "humidity_min",
        "humidity_max"
    ])

print("\n" + "=" * 70)
print("WEATHER MISSING VALUES")
print("=" * 70)

for column in weather_columns:

    if column in merged.columns:

        missing = (
            merged[column]
            .isna()
            .sum()
        )

        print(
            f"{column:25s}: {missing}"
        )

# ============================================================
# 12. SAVE
# ============================================================

merged.to_csv(
    OUTPUT_FILE,
    index=False
)

# ============================================================
# 13. FINAL INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("WEATHER-ENHANCED DATASET CREATED")
print("=" * 70)

print(
    f"Rows    : {len(merged)}"
)

print(
    f"Columns : {len(merged.columns)}"
)

print(
    f"Output  : {OUTPUT_FILE}"
)

print("\nColumns:")

print(
    merged.columns.tolist()
)

print("\nFirst 5 rows:")

print(
    merged.head().to_string(
        index=False
    )
)

print("\nDone!")
print("=" * 70)