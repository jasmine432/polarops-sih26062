import pandas as pd
import numpy as np
from pathlib import Path

np.random.seed(42)

TOTAL_ROWS = 50000

# ============================================================
# INVENTORY ITEMS
# ============================================================

items = [
    ("ITM001", "Rice", "Food", 12.0),
    ("ITM002", "Wheat", "Food", 10.0),
    ("ITM003", "Dal", "Food", 8.0),
    ("ITM004", "Canned Food", "Food", 6.0),
    ("ITM005", "Milk Powder", "Food", 5.0),
    ("ITM006", "Biscuits", "Food", 4.0),
    ("ITM007", "Cooking Oil", "Food", 3.0),

    ("ITM008", "Medicine", "Medical", 2.0),
    ("ITM009", "First Aid Kit", "Medical", 0.5),
    ("ITM010", "Medical Supplies", "Medical", 3.0),
    ("ITM011", "Syringes", "Medical", 1.0),

    ("ITM012", "Diesel", "Fuel", 20.0),
    ("ITM013", "Petrol", "Fuel", 12.0),
    ("ITM014", "Lubricant", "Fuel", 5.0),
    ("ITM015", "Jet Fuel", "Fuel", 25.0),

    ("ITM016", "Batteries", "Electrical", 4.0),
    ("ITM017", "Cables", "Electrical", 2.0),
    ("ITM018", "Electrical Components", "Electrical", 2.5),

    ("ITM019", "Spare Parts", "Maintenance", 3.0),
    ("ITM020", "Tools", "Maintenance", 2.0),
    ("ITM021", "Mechanical Parts", "Maintenance", 2.5),

    ("ITM022", "Lab Supplies", "Scientific", 2.0),
    ("ITM023", "Equipment Parts", "Scientific", 1.0),
    ("ITM024", "Research Materials", "Scientific", 1.5),

    ("ITM025", "Emergency Kit", "Safety", 1.0),
    ("ITM026", "Protective Equipment", "Safety", 2.0),
    ("ITM027", "Safety Supplies", "Safety", 1.5),

    ("ITM028", "Radio Equipment", "Communication", 0.5),
    ("ITM029", "Communication Batteries", "Communication", 2.0),
    ("ITM030", "Communication Cables", "Communication", 1.0),
]

stations = ["Maitri", "Bharati"]

# ============================================================
# DATES — SAME PERIOD AS NCPOR WEATHER
# ============================================================

dates = pd.date_range(
    start="2012-01-01",
    end="2016-12-31",
    freq="D"
)

rows = []

# ============================================================
# GENERATE OPERATIONAL DATA
# ============================================================

for date in dates:

    personnel_count = np.random.randint(25, 61)

    expedition_duration = np.random.randint(
        90, 361
    )

    month = date.month

    # Antarctic seasonal variation
    if month in [6, 7, 8]:
        seasonal_factor = 1.20
    elif month in [12, 1, 2]:
        seasonal_factor = 1.10
    else:
        seasonal_factor = 1.00

    for station in stations:

        expedition_id = (
            f"EXP-{date.year}-"
            f"{station[:2].upper()}"
        )

        for (
            item_id,
            item_name,
            item_category,
            base_consumption
        ) in items:

            personnel_factor = (
                personnel_count / 40
            )

            noise = np.random.normal(
                1.0,
                0.15
            )

            consumed_quantity = (
                base_consumption
                * personnel_factor
                * seasonal_factor
                * noise
            )

            consumed_quantity = round(
                max(0, consumed_quantity),
                2
            )

            previous_expedition_consumption = round(
                consumed_quantity
                * np.random.uniform(0.80, 1.20),
                2
            )

            inventory_usage_history = round(
                consumed_quantity
                * np.random.uniform(7, 30),
                2
            )

            opening_stock = round(
                np.random.uniform(100, 1500),
                2
            )

            minimum_stock = round(
                max(50, base_consumption * 20),
                2
            )

            lead_time = np.random.randint(
                7,
                46
            )

            # Replenishment
            if opening_stock < minimum_stock * 1.5:

                received_quantity = np.random.uniform(
                    minimum_stock,
                    minimum_stock * 5
                )

            elif np.random.random() < 0.10:

                received_quantity = np.random.uniform(
                    minimum_stock,
                    minimum_stock * 3
                )

            else:

                received_quantity = 0

            received_quantity = round(
                received_quantity,
                2
            )

            closing_stock = (
                opening_stock
                + received_quantity
                - consumed_quantity
            )

            closing_stock = round(
                max(0, closing_stock),
                2
            )

            rows.append([
                expedition_id,
                item_id,
                item_name,
                item_category,
                station,
                date,
                personnel_count,
                expedition_duration,
                opening_stock,
                received_quantity,
                consumed_quantity,
                closing_stock,
                minimum_stock,
                lead_time,
                previous_expedition_consumption,
                inventory_usage_history
            ])

# ============================================================
# DATAFRAME
# ============================================================

columns = [
    "expedition_id",
    "item_id",
    "item_name",
    "item_category",
    "station",
    "date",
    "personnel_count",
    "expedition_duration",
    "opening_stock",
    "received_quantity",
    "consumed_quantity",
    "closing_stock",
    "minimum_stock",
    "lead_time",
    "previous_expedition_consumption",
    "inventory_usage_history"
]

df = pd.DataFrame(
    rows,
    columns=columns
)

df = df.sort_values(
    ["date", "station", "item_id"]
).reset_index(drop=True)

# ============================================================
# EXACTLY 50,000 ROWS
# ============================================================

df = df.iloc[:TOTAL_ROWS].copy()

# ============================================================
# SAVE
# ============================================================

output_directory = Path(
    "data/synthetic"
)

output_directory.mkdir(
    parents=True,
    exist_ok=True
)

output_file = (
    output_directory /
    "inventory_ml_50000_weather.csv"
)

df.to_csv(
    output_file,
    index=False
)

# ============================================================
# REPORT
# ============================================================

print()
print("=" * 65)
print("50,000-ROW WEATHER-READY DATASET CREATED")
print("=" * 65)

print(f"Rows              : {len(df)}")
print(f"Columns            : {len(df.columns)}")

print(
    f"Date range        : "
    f"{df['date'].min().date()} "
    f"→ "
    f"{df['date'].max().date()}"
)

print(
    f"Items             : "
    f"{df['item_id'].nunique()}"
)

print(
    f"Categories        : "
    f"{df['item_category'].nunique()}"
)

print(
    f"Stations          : "
    f"{df['station'].nunique()}"
)

print(
    f"Missing values    : "
    f"{df.isnull().sum().sum()}"
)

print(
    f"Saved to          : {output_file}"
)

print()
print("Categories:")
print(
    df["item_category"].value_counts()
)

print()
print("Stations:")
print(
    df["station"].value_counts()
)

print()
print("Done!")
print("=" * 65)
