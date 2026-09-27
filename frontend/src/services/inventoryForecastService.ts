import type { InventoryItem, PrototypeForecastInputs } from '@/data/inventoryData'
import { getAccessToken } from '@/services/authService'

export interface InventoryForecastRequest {
  expedition_id: string
  item_id: string
  item_name: string
  item_category: string
  station: string
  personnel_count: number
  expedition_duration: number
  opening_stock: number
  minimum_stock: number
  lead_time: number
  previous_expedition_consumption: number
  inventory_usage_history: number
  consumption_lag_1: number
  consumption_lag_7: number
  consumption_avg_7: number
  consumption_avg_14: number
  temperature_mean: number
  temperature_min: number
  temperature_max: number
  pressure_mean: number
  pressure_min: number
  pressure_max: number
  wind_speed_mean: number
  wind_speed_max: number
}

export interface InventoryForecastData {
  item_id: string
  predicted_requirement: number
  current_stock: number
  recommended_additional_qty: number
  model_version: string
  station: string | null
  item_name: string | null
  minimum_stock: number
  lead_time_days: number | null
  status: string
  recommendation: string
  prediction_source: string
  low_confidence: boolean
}

export interface InventoryForecastResult {
  data: InventoryForecastData
  inputProvenance: PrototypeForecastInputs['provenance']
  scenario?: PrototypeForecastInputs['scenario']
  categoryInModelVocabulary: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''
const FORECAST_URL = `${API_BASE_URL}/api/inventory/forecast`
const SERVICE_ERROR = 'Forecast service unavailable. Please try again.'
const MODEL_ITEM_CATEGORIES = new Set([
  'Communication',
  'Electrical',
  'Food',
  'Fuel',
  'Maintenance',
  'Medical',
  'Safety',
  'Scientific',
])

const numericFields = [
  'personnel_count',
  'expedition_duration',
  'opening_stock',
  'minimum_stock',
  'lead_time',
  'previous_expedition_consumption',
  'inventory_usage_history',
  'consumption_lag_1',
  'consumption_lag_7',
  'consumption_avg_7',
  'consumption_avg_14',
  'temperature_mean',
  'temperature_min',
  'temperature_max',
  'pressure_mean',
  'pressure_min',
  'pressure_max',
  'wind_speed_mean',
  'wind_speed_max',
] as const

const nonNegativeFields = [
  'opening_stock',
  'minimum_stock',
  'lead_time',
  'previous_expedition_consumption',
  'inventory_usage_history',
  'consumption_lag_1',
  'consumption_lag_7',
  'consumption_avg_7',
  'consumption_avg_14',
  'wind_speed_mean',
  'wind_speed_max',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isForecastData(value: unknown): value is InventoryForecastData {
  return (
    isRecord(value) &&
    typeof value.item_id === 'string' &&
    typeof value.predicted_requirement === 'number' &&
    Number.isFinite(value.predicted_requirement) &&
    typeof value.current_stock === 'number' &&
    Number.isFinite(value.current_stock) &&
    typeof value.recommended_additional_qty === 'number' &&
    Number.isFinite(value.recommended_additional_qty) &&
    typeof value.model_version === 'string' &&
    (typeof value.station === 'string' || value.station === null) &&
    (typeof value.item_name === 'string' || value.item_name === null) &&
    typeof value.minimum_stock === 'number' &&
    Number.isFinite(value.minimum_stock) &&
    (typeof value.lead_time_days === 'number' || value.lead_time_days === null) &&
    typeof value.status === 'string' &&
    typeof value.recommendation === 'string' &&
    typeof value.prediction_source === 'string' &&
    typeof value.low_confidence === 'boolean'
  )
}

function buildForecastRequest(item: InventoryItem): InventoryForecastRequest {
  const profile = item.prototypeForecastInputs
  const request: InventoryForecastRequest = {
    expedition_id: profile.expedition_id,
    item_id: item.id,
    item_name: item.name,
    item_category: item.category,
    station: item.station,
    personnel_count: profile.personnel_count,
    expedition_duration: profile.expedition_duration,
    opening_stock: item.currentStock,
    minimum_stock: item.minimumStock,
    lead_time: profile.lead_time,
    previous_expedition_consumption: profile.previous_expedition_consumption,
    inventory_usage_history: profile.inventory_usage_history,
    consumption_lag_1: profile.consumption_lag_1,
    consumption_lag_7: profile.consumption_lag_7,
    consumption_avg_7: profile.consumption_avg_7,
    consumption_avg_14: profile.consumption_avg_14,
    temperature_mean: profile.temperature_mean,
    temperature_min: profile.temperature_min,
    temperature_max: profile.temperature_max,
    pressure_mean: profile.pressure_mean,
    pressure_min: profile.pressure_min,
    pressure_max: profile.pressure_max,
    wind_speed_mean: profile.wind_speed_mean,
    wind_speed_max: profile.wind_speed_max,
  }

  if (
    !request.expedition_id.trim() ||
    !request.item_id.trim() ||
    !request.item_name.trim() ||
    !request.item_category.trim() ||
    !request.station.trim()
  ) {
    throw new Error('Forecast inputs are incomplete.')
  }

  for (const field of numericFields) {
    if (!Number.isFinite(request[field])) {
      throw new Error('Forecast inputs are incomplete.')
    }
  }

  if (
    !Number.isInteger(request.personnel_count) ||
    !Number.isInteger(request.expedition_duration) ||
    !Number.isInteger(request.lead_time) ||
    request.personnel_count < 1 ||
    request.expedition_duration < 1
  ) {
    throw new Error('Forecast inputs are incomplete.')
  }

  if (nonNegativeFields.some((field) => request[field] < 0)) {
    throw new Error('Forecast inputs are incomplete.')
  }

  return request
}

export async function requestInventoryForecast(item: InventoryItem): Promise<InventoryForecastResult> {
  const request = buildForecastRequest(item)
  let response: Response

  try {
    const token = getAccessToken()
    if (!token) throw new Error('Authentication required.')
    response = await fetch(FORECAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    })
  } catch {
    throw new Error(SERVICE_ERROR)
  }

  if (!response.ok) {
    throw new Error(SERVICE_ERROR)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(SERVICE_ERROR)
  }

  if (!isRecord(payload) || payload.success !== true || !isForecastData(payload.data)) {
    throw new Error(SERVICE_ERROR)
  }

  return {
    data: payload.data,
    inputProvenance: item.prototypeForecastInputs.provenance,
    scenario: item.prototypeForecastInputs.scenario,
    categoryInModelVocabulary: MODEL_ITEM_CATEGORIES.has(item.category),
  }
}
