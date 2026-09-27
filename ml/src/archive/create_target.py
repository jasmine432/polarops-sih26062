import pandas as pd
import os

# ---------------------------------------------------------
# 1. LOAD DATASET
# ---------------------------------------------------------

input_file = "../data/synthetic/inventory_operational_data.csv"

df = pd.read_csv(input_file)

# Convert date column to datetime
df["date"] = pd.to_datetime(df["date"])

# Sort data properly
df = df.sort_values(
    by=["station", "item", "date"]
).reset_index(drop=True)


# ---------------------------------------------------------
# 2. CREATE FUTURE 7-DAY REQUIREMENT
# ---------------------------------------------------------

df["future_7day_requirement"] = (
    df.groupby(["station", "item"])["consumed_quantity"]
    .transform(
        lambda x: x.shift(-1)
        .rolling(window=7, min_periods=7)
        .sum()
    )
)


# ---------------------------------------------------------
# 3. REMOVE ROWS WITHOUT 7-DAY FUTURE DATA
# ---------------------------------------------------------

df = df.dropna(
    subset=["future_7day_requirement"]
).reset_index(drop=True)


# ---------------------------------------------------------
# 4. ROUND VALUES
# ---------------------------------------------------------

df["future_7day_requirement"] = df[
    "future_7day_requirement"
].round(2)


# ---------------------------------------------------------
# 5. SAVE TARGET DATASET
# ---------------------------------------------------------

output_file = "../data/synthetic/inventory_ml_dataset.csv"

df.to_csv(
    output_file,
    index=False
)


# ---------------------------------------------------------
# 6. DISPLAY RESULTS
# ---------------------------------------------------------

print("ML dataset created successfully!")

print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")

print("\nColumns:")
print(list(df.columns))

print("\nTarget column:")
print("future_7day_requirement")

print("\nFirst 10 records:")
print(df.head(10))

print(f"\nSaved to: {output_file}")