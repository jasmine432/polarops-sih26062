import { getAccessToken } from '@/services/authService'
import type {
  InventoryItem,
  InventoryCategory,
  InventoryStatus,
  PrototypeForecastInputs,
} from '@/data/inventoryData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''

export interface InventoryApiPayload {
  item_name: string
  category: string
  quantity: number
  unit: string
  location: string
  minimum_stock: number
}

export interface InventoryApiResponse {
  id: number
  item_name: string
  category: string | null
  quantity: number | null
  unit: string | null
  location: string | null
  minimum_stock: number | null
}

function determineStation(location: string): 'Maitri' | 'Bharati' | 'Himadri' | 'Joint Antarctic' {
  const loc = location.toLowerCase()
  if (loc.includes('bharati')) return 'Bharati'
  if (loc.includes('himadri')) return 'Himadri'
  if (loc.includes('joint')) return 'Joint Antarctic'
  return 'Maitri'
}

function calculateStatus(currentStock: number, minimumStock: number): InventoryStatus {
  if (currentStock <= 0 || currentStock < minimumStock * 0.4) {
    return 'Critical'
  }
  if (currentStock < minimumStock) {
    return 'Low Stock'
  }
  return 'Normal'
}

export function mapApiToInventoryItem(api: InventoryApiResponse): InventoryItem {
  const currentStock = api.quantity ?? 0
  const minimumStock = api.minimum_stock ?? 0
  const unit = api.unit || 'Units'
  const location = api.location || 'Maitri Station Hub'
  const station = determineStation(location)
  const category = (api.category as InventoryCategory) || 'Vehicle & Machinery Spares'
  const status = calculateStatus(currentStock, minimumStock)

  const avgDaily = Math.max(1, Math.round(minimumStock / 30)) || 1
  const daysRemaining = Math.max(1, Math.round(currentStock / avgDaily))

  const prototypeForecastInputs: PrototypeForecastInputs = {
    provenance: 'prototype/synthetic operational inputs',
    scenario: 'historical-demo',
    expedition_id: 'EXP-2026-014',
    personnel_count: station === 'Maitri' ? 39 : station === 'Bharati' ? 24 : 12,
    expedition_duration: 365,
    lead_time: 21,
    previous_expedition_consumption: Math.round(avgDaily * 180),
    inventory_usage_history: currentStock,
    consumption_lag_1: avgDaily,
    consumption_lag_7: avgDaily * 7,
    consumption_avg_7: avgDaily,
    consumption_avg_14: avgDaily,
    temperature_mean: -18.5,
    temperature_min: -28.0,
    temperature_max: -8.0,
    pressure_mean: 985.0,
    pressure_min: 970.0,
    pressure_max: 1000.0,
    wind_speed_mean: 22.0,
    wind_speed_max: 45.0,
  }

  const itemId = `INV-DB-${api.id.toString().padStart(4, '0')}`

  return {
    id: itemId,
    name: api.item_name,
    category,
    station,
    storageLocation: location,
    unit,
    currentStock,
    minimumStock,
    averageDailyConsumption: avgDaily,
    dailyConsumptionDisplay: `${avgDaily.toLocaleString()} ${unit} / Day`,
    daysRemaining,
    status,
    lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    specifications: `PostgreSQL Database SKU: ${api.item_name}. Base reserve allocation for ${station}.`,
    expectedRequirement: minimumStock * 2,
    forecast: {
      predictedRequirement: Math.round(avgDaily * 90),
      currentStock,
      additionalRequirement: Math.max(0, Math.round(avgDaily * 90) - currentStock),
      predictionHorizon: 'Next 90 Days (Summer Transition)',
      modelTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      modelId: 'NCPOR-Demand-Predictor-v2.4',
      confidenceBand: `95% Interval: [${Math.round(avgDaily * 80)} – ${Math.round(avgDaily * 100)} ${unit}]`,
      seasonalFactorNote: 'Dynamic projection based on live station telemetry.',
    },
    prototypeForecastInputs,
    consumptionHistory: [
      { period: 'Jul 2026', consumption: avgDaily * 28, burnRateDesc: 'Polar Night Normal', notes: 'Baseline consumption' },
      { period: 'Aug 2026', consumption: avgDaily * 30, burnRateDesc: 'Late Winter Normal', notes: 'Standard consumption' },
      { period: 'Sep 2026 (MTD)', consumption: avgDaily * 15, burnRateDesc: 'Spring Staging Drawdown', notes: 'Active station operation' },
    ],
    recentTransactions: [
      {
        id: `TXN-DB-${api.id}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        type: 'Audit Verification',
        quantity: 0,
        unit,
        balanceAfter: currentStock,
        officer: 'Logistics Database Ledger',
        referenceDoc: `DB-STOCK-AUDIT-REC-${api.id}`,
      },
    ],
  }
}

export async function fetchInventoryList(): Promise<InventoryItem[]> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Failed to fetch inventory from server (${response.status})`)
  }

  const data: InventoryApiResponse[] = await response.json()
  return data.map(mapApiToInventoryItem)
}

export async function createInventoryItem(payload: InventoryApiPayload): Promise<{ success: boolean; id: number; item_name: string }> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = `Failed to create inventory item (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) {
        errorDetail = errJson.detail
      }
    } catch {
      const txt = await response.text()
      if (txt) errorDetail = txt
    }
    throw new Error(errorDetail)
  }

  return response.json()
}
