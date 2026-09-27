import pandas as pd
import os

# ---------------------------------------------------------
# 1. LOAD ML DATASET
# ---------------------------------------------------------

input_file = "../data/synthetic/inventory_ml_dataset.csv"

df = pd.read_csv(input_file)

# ---------------------------------------------------------
# 2. CONVERT DATE
# ---------------------------------------------------------

df["date"] = pd.to_datetime(df["date"])

# ---------------------------------------------------------
# 3. ENCODE ITEM
# ---------------------------------------------------------

item_mapping = {
    "Rice": 0,
    "Wheat": 1,
    "Dal": 2,
    "Milk Powder": 3,
    "Canned Food": 4,
    "Medicine": 5,
    "Diesel": 6,
    "Lubricant": 7,
    "Batteries": 8,
    "Spare Parts": 9
}

df["item_code"] = df["item"].map(item_mapping)

# ---------------------------------------------------------
# 4. ENCODE STATION
# ---------------------------------------------------------

station_mapping = {
    "Maitri": 0,
    "Bharati": 1
}

df["station_code"] = df["station"].map(station_mapping)

# ---------------------------------------------------------
# 5. SELECT FEATURES
# ---------------------------------------------------------

features = [
    "item_code",
    "station_code",
    "personnel_count",
    "expedition_duration",
    "opening_stock",
    "received_quantity",
    "consumed_quantity",
    "closing_stock",
    "minimum_stock",
    "lead_time"
]

target = "future_7day_requirement"

X = df[features]
y = df[target]

# ---------------------------------------------------------
# 6. SAVE PREPARED DATA
# ---------------------------------------------------------

output_dir = "../data/processed"

os.makedirs(output_dir, exist_ok=True)

X.to_csv(
    "../data/processed/X.csv",
    index=False
)

y.to_csv(
    "../data/processed/y.csv",
    index=False
)

# Save complete prepared dataset too
prepared_df = X.copy()
prepared_df[target] = y

prepared_df.to_csv(
    "../data/processed/inventory_training_data.csv",
    index=False
)

# ---------------------------------------------------------
# 7. DISPLAY INFORMATION
# ---------------------------------------------------------

print("ML data preparation completed!")

print("\nFeature columns:")
print(features)

print("\nTarget:")
print(target)

print("\nFeature shape:")
print(X.shape)

print("\nTarget shape:")
print(y.shape)

print("\nFirst 5 feature rows:")
print(X.head())

print("\nFirst 5 target values:")
print(y.head())

print("\nSaved files:")
print("../data/processed/X.csv")
print("../data/processed/y.csv")
print("../data/processed/inventory_training_data.csv")