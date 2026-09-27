# Polar Inventory ML

## Purpose

Predict the inventory requirement for the next 7 days and generate
a stock replenishment recommendation.

## Model

Gradient Boosting Regressor

## Input

The ML service requires:

- expedition_id
- item_id
- item_name
- item_category
- station
- personnel_count
- expedition_duration
- opening_stock
- minimum_stock
- lead_time
- previous_expedition_consumption
- inventory_usage_history
- consumption_lag_1
- consumption_lag_7
- consumption_avg_7
- consumption_avg_14
- temperature_mean
- temperature_min
- temperature_max
- pressure_mean
- pressure_min
- pressure_max
- wind_speed_mean
- wind_speed_max

## Output

The service returns:

- predicted_7day_requirement
- current_stock
- minimum_stock
- target_stock
- reorder_quantity
- status
- recommendation

## Status

NORMAL  → sufficient stock

LOW     → replenishment should be planned

CRITICAL → immediate replenishment required

## Run Prediction

From the project root:

```bash
python src/predict_inventory_requirement.py