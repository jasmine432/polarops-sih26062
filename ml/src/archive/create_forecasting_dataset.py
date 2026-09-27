import pandas as pd
import os


# ---------------------------------------------------------
# 1. LOAD OPERATIONAL DATA
# ---------------------------------------------------------

input_file = "../data/synthetic/inventory_operational_data.csv"

df = pd.read_csv(input_file)

df["date"] = pd.to_datetime(df["date"])


# ---------------------------------------------------------
# 2. SORT TIME-SERIES DATA
# ---------------------------------------------------------

df = df.sort_values(
    by=["station", "item", "date"]
).reset_index(drop=True)


# ---------------------------------------------------------
# 3. CREATE HISTORICAL CONSUMPTION FEATURES
# ---------------------------------------------------------

# Yesterday's consumption
df["consumption_lag_1"] = (
    df.groupby(["station", "item"])["consumed_quantity"]
    .shift(1)
)


# Consumption 7 days ago
df["consumption_lag_7"] = (
    df.groupby(["station", "item"])["consumed_quantity"]
    .shift(7)
)


# Previous 7-day average
df["consumption_avg_7"] = (
    df.groupby(["station", "item"])["consumed_quantity"]
    .transform(
        lambda x: x.shift(1).rolling(
            window=7,
            min_periods=7
        ).mean()
    )
)


# Previous 14-day average
df["consumption_avg_14"] = (
    df.groupby(["station", "item"])["consumed_quantity"]
    .transform(
        lambda x: x.shift(1).rolling(
            window=14,
            min_periods=14
        ).mean()
    )
)


# ---------------------------------------------------------
# 4. CREATE FUTURE 7-DAY TARGET
# ---------------------------------------------------------

df["future_7day_requirement"] = (
    df.groupby(["station", "item"])["consumed_quantity"]
    .transform(
        lambda x: x.shift(-1).rolling(
            window=7,
            min_periods=7
        ).sum()
    )
)


# ---------------------------------------------------------
# 5. REMOVE ROWS WITHOUT ENOUGH HISTORY/FUTURE
# ---------------------------------------------------------

required_columns = [
    "consumption_lag_1",
    "consumption_lag_7",
    "consumption_avg_7",
    "consumption_avg_14",
    "future_7day_requirement"
]

df = df.dropna(
    subset=required_columns
).reset_index(drop=True)


# ---------------------------------------------------------
# 6. ROUND VALUES
# ---------------------------------------------------------

numeric_columns = [
    "consumption_lag_1",
    "consumption_lag_7",
    "consumption_avg_7",
    "consumption_avg_14",
    "future_7day_requirement"
]

df[numeric_columns] = df[
    numeric_columns
].round(4)


# ---------------------------------------------------------
# 7. SAVE DATASET
# ---------------------------------------------------------

output_dir = "../data/processed"

os.makedirs(
    output_dir,
    exist_ok=True
)

output_file = (
    "../data/processed/"
    "inventory_forecasting_dataset.csv"
)

df.to_csv(
    output_file,
    index=False
)


# ---------------------------------------------------------
# 8. DISPLAY RESULTS
# ---------------------------------------------------------

print("Forecasting dataset created successfully!")

print("\nRows:", len(df))
print("Columns:", len(df.columns))

print("\nDate range:")

print(
    df["date"].min(),
    "to",
    df["date"].max()
)


print("\nForecasting features:")

print(" - consumption_lag_1")
print(" - consumption_lag_7")
print(" - consumption_avg_7")
print(" - consumption_avg_14")
print(" - future_7day_requirement")


print("\nFirst 10 records:")

print(
    df[
        [
            "item",
            "station",
            "date",
            "consumed_quantity",
            "consumption_lag_1",
            "consumption_lag_7",
            "consumption_avg_7",
            "consumption_avg_14",
            "future_7day_requirement"
        ]
    ].head(10)
)


print(
    f"\nSaved to: {output_file}"
)