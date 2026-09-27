import pandas as pd
import joblib

# Load trained model
model = joblib.load(
    "../models/linear_regression_pipeline.joblib"
)

# Example current inventory situation
new_data = pd.DataFrame([{
    "item": "Rice",
    "station": "Maitri",
    "personnel_count": 35,
    "expedition_duration": 180,
    "opening_stock": 500,
    "received_quantity": 0,
    "consumed_quantity": 35,
    "closing_stock": 465,
    "minimum_stock": 300,
    "lead_time": 30,
    "consumption_lag_1": 34,
    "consumption_lag_7": 36,
    "consumption_avg_7": 35,
    "consumption_avg_14": 35
}])

# Predict
prediction = model.predict(new_data)[0]

# Calculate additional requirement
current_stock = new_data["closing_stock"].iloc[0]

additional_requirement = max(
    0,
    prediction - current_stock
)

print("================================")
print("INVENTORY DEMAND PREDICTION")
print("================================")

print("Item:", new_data["item"].iloc[0])
print("Station:", new_data["station"].iloc[0])

print(
    "Predicted 7-day requirement:",
    round(prediction, 2)
)

print(
    "Current stock:",
    round(current_stock, 2)
)

print(
    "Additional requirement:",
    round(additional_requirement, 2)
)

if current_stock < new_data["minimum_stock"].iloc[0]:
    print("Stock Status: LOW STOCK")
else:
    print("Stock Status: NORMAL")