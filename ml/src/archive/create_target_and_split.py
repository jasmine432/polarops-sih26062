import pandas as pd
from pathlib import Path

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/synthetic/inventory_ml_50000.csv"
)

OUTPUT_DIR = Path(
    "data/processed"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

# ============================================================
# 1. LOAD DATASET
# ============================================================

print("Loading dataset...")

df = pd.read_csv(INPUT_FILE)

df["date"] = pd.to_datetime(
    df["date"]
)

# Sort chronologically
df = df.sort_values(
    ["station", "item_id", "date"]
).reset_index(drop=True)

print(
    f"Original rows: {len(df)}"
)

# ============================================================
# 2. CREATE FUTURE 7-DAY DEMAND TARGET
# ============================================================

print("\nCreating future 7-day requirement...")

# For every station + item combination,
# calculate consumption during the NEXT 7 days.

df["future_7day_requirement"] = (
    df.groupby(
        ["station", "item_id"]
    )["consumed_quantity"]
    .transform(
        lambda x:
        x.shift(-1)
         .rolling(7)
         .sum()
         .shift(-6)
    )
)

# Remove rows where 7 future days are unavailable
df = df.dropna(
    subset=["future_7day_requirement"]
).reset_index(drop=True)

# Make sure target cannot be negative
df["future_7day_requirement"] = (
    df["future_7day_requirement"]
    .clip(lower=0)
    .round(2)
)

print(
    "Target created successfully."
)

print(
    "Rows after target creation:",
    len(df)
)

# ============================================================
# 3. SORT CHRONOLOGICALLY
# ============================================================

df = df.sort_values(
    "date"
).reset_index(drop=True)

# ============================================================
# 4. CREATE CHRONOLOGICAL SPLIT
# ============================================================

total_rows = len(df)

train_end = int(
    total_rows * 0.70
)

validation_end = int(
    total_rows * 0.85
)

train_df = df.iloc[
    :train_end
].copy()

validation_df = df.iloc[
    train_end:validation_end
].copy()

test_df = df.iloc[
    validation_end:
].copy()

# ============================================================
# 5. SAVE DATASETS
# ============================================================

train_file = (
    OUTPUT_DIR /
    "inventory_train.csv"
)

validation_file = (
    OUTPUT_DIR /
    "inventory_validation.csv"
)

test_file = (
    OUTPUT_DIR /
    "inventory_test.csv"
)

full_file = (
    OUTPUT_DIR /
    "inventory_ml_with_target.csv"
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
# 6. DISPLAY RESULTS
# ============================================================

print("\n")
print("=" * 65)
print("DATASET SPLIT COMPLETED")
print("=" * 65)

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

print("=" * 65)

# ============================================================
# 7. SPLIT PERCENTAGES
# ============================================================

print("\nSplit percentages:")

print(
    f"Train       : "
    f"{len(train_df) / len(df) * 100:.2f}%"
)

print(
    f"Validation  : "
    f"{len(validation_df) / len(df) * 100:.2f}%"
)

print(
    f"Test        : "
    f"{len(test_df) / len(df) * 100:.2f}%"
)

# ============================================================
# 8. DATE RANGES
# ============================================================

print("\nDate ranges:")

print(
    "Train:"
)

print(
    f"  {train_df['date'].min().date()} "
    f"→ "
    f"{train_df['date'].max().date()}"
)

print(
    "Validation:"
)

print(
    f"  {validation_df['date'].min().date()} "
    f"→ "
    f"{validation_df['date'].max().date()}"
)

print(
    "Test:"
)

print(
    f"  {test_df['date'].min().date()} "
    f"→ "
    f"{test_df['date'].max().date()}"
)

# ============================================================
# 9. TARGET STATISTICS
# ============================================================

print("\nTarget statistics:")

print(
    df["future_7day_requirement"].describe()
)

# ============================================================
# 10. CHECK FOR DATA LEAKAGE
# ============================================================

print("\nChecking chronological order...")

if (
    train_df["date"].max()
    <= validation_df["date"].min()
    and
    validation_df["date"].max()
    <= test_df["date"].min()
):

    print(
        "✓ Chronological split is valid."
    )

else:

    print(
        "⚠ WARNING: Date overlap detected!"
    )

# ============================================================
# 11. CHECK MISSING VALUES
# ============================================================

print("\nMissing values:")

print(
    df.isnull().sum()
)

# ============================================================
# 12. FILE LOCATIONS
# ============================================================

print("\nFiles created:")

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

print("\nDone!")