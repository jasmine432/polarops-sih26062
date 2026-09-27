import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# Reproducible results
np.random.seed(42)

# ---------------------------------------------------------
# 1. BASIC CONFIGURATION
# ---------------------------------------------------------

items = {
    "Rice": {
        "base_daily_consumption": 1.0,
        "minimum_stock": 300,
        "lead_time": 30
    },
    "Wheat": {
        "base_daily_consumption": 0.9,
        "minimum_stock": 200,
        "lead_time": 30
    },
    "Dal": {
        "base_daily_consumption": 0.5,
        "minimum_stock": 100,
        "lead_time": 25
    },
    "Milk Powder": {
        "base_daily_consumption": 0.15,
        "minimum_stock": 80,
        "lead_time": 25
    },
    "Canned Food": {
        "base_daily_consumption": 0.3,
        "minimum_stock": 120,
        "lead_time": 30
    },
    "Medicine": {
        "base_daily_consumption": 0.08,
        "minimum_stock": 40,
        "lead_time": 20
    },
    "Diesel": {
        "base_daily_consumption": 8.0,
        "minimum_stock": 2000,
        "lead_time": 45
    },
    "Lubricant": {
        "base_daily_consumption": 0.8,
        "minimum_stock": 150,
        "lead_time": 40
    },
    "Batteries": {
        "base_daily_consumption": 0.05,
        "minimum_stock": 30,
        "lead_time": 40
    },
    "Spare Parts": {
        "base_daily_consumption": 0.03,
        "minimum_stock": 20,
        "lead_time": 60
    }
}

stations = ["Maitri", "Bharati"]

start_date = datetime(2024, 1, 1)
end_date = datetime(2025, 12, 31)

# ---------------------------------------------------------
# 2. GENERATE TIME-SERIES DATA
# ---------------------------------------------------------

records = []

# Keep separate stock for every item at every station
stock = {}

for station in stations:
    for item, info in items.items():

        initial_stock = info["minimum_stock"] * np.random.uniform(2.0, 4.0)

        stock[(station, item)] = initial_stock


# Generate one record for every item/station/day
current_date = start_date

while current_date <= end_date:

    for station in stations:

        # Number of people at station changes gradually
        personnel_count = np.random.randint(25, 51)

        # Expedition duration
        expedition_duration = np.random.randint(90, 361)

        for item, info in items.items():

            minimum_stock = info["minimum_stock"]
            lead_time = info["lead_time"]
            base_consumption = info["base_daily_consumption"]

            current_stock = stock[(station, item)]

            # -------------------------------------------------
            # Consumption
            # -------------------------------------------------

            # Consumption depends mainly on personnel
            personnel_factor = personnel_count / 35

            # Small seasonal/operational variation
            seasonal_factor = 1 + 0.10 * np.sin(
                2 * np.pi * current_date.timetuple().tm_yday / 365
            )

            # Random variation
            random_factor = np.random.normal(1.0, 0.08)

            consumed_quantity = (
                base_consumption
                * personnel_factor
                * seasonal_factor
                * random_factor
            )

            consumed_quantity = max(0, consumed_quantity)

            # -------------------------------------------------
            # Receiving stock
            # -------------------------------------------------

            received_quantity = 0

            # Receive stock when inventory becomes low
            if current_stock <= minimum_stock * 1.2:

                received_quantity = (
                    minimum_stock
                    * np.random.uniform(1.5, 3.0)
                )

            # Small probability of additional supply
            elif np.random.random() < 0.01:

                received_quantity = (
                    minimum_stock
                    * np.random.uniform(0.5, 1.5)
                )

            # -------------------------------------------------
            # Closing stock
            # -------------------------------------------------

            closing_stock = (
                current_stock
                + received_quantity
                - consumed_quantity
            )

            closing_stock = max(0, closing_stock)

            # -------------------------------------------------
            # Save record
            # -------------------------------------------------

            records.append({
                "item": item,
                "station": station,
                "date": current_date.strftime("%Y-%m-%d"),
                "personnel_count": personnel_count,
                "expedition_duration": expedition_duration,
                "opening_stock": round(current_stock, 2),
                "received_quantity": round(received_quantity, 2),
                "consumed_quantity": round(consumed_quantity, 2),
                "closing_stock": round(closing_stock, 2),
                "minimum_stock": minimum_stock,
                "lead_time": lead_time
            })

            # Update stock for the next day
            stock[(station, item)] = closing_stock

    current_date += timedelta(days=1)


# ---------------------------------------------------------
# 3. CREATE DATAFRAME
# ---------------------------------------------------------

df = pd.DataFrame(records)

# Convert date to proper datetime
df["date"] = pd.to_datetime(df["date"])

# Sort chronologically
df = df.sort_values(
    by=["station", "item", "date"]
).reset_index(drop=True)


# ---------------------------------------------------------
# 4. SAVE DATASET
# ---------------------------------------------------------

output_dir = "../data/synthetic"
os.makedirs(output_dir, exist_ok=True)

output_file = os.path.join(
    output_dir,
    "inventory_operational_data.csv"
)

df.to_csv(output_file, index=False)


# ---------------------------------------------------------
# 5. DISPLAY INFORMATION
# ---------------------------------------------------------

print("Dataset created successfully!")

print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")

print("\nColumns:")
print(list(df.columns))

print("\nDate range:")
print(df["date"].min(), "to", df["date"].max())

print("\nItems:")
print(df["item"].unique())

print("\nStations:")
print(df["station"].unique())

print("\nFirst 10 records:")
print(df.head(10))

print(f"\nSaved to: {output_file}")