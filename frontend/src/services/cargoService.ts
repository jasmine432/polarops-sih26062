import { getAccessToken } from '@/services/authService'
import type {
  CargoRecord,
  CargoStatus,
  CargoPriority,
  TransportMode,
} from '@/data/cargoData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''

export interface CargoApiPayload {
  cargo_id: string
  expedition_id?: string | null
  description: string
  category: string
  weight: number | null
  weight_unit: string
  origin: string
  destination: string
  transport_mode: string
  priority: string
  arrival_date: string | null
  status: string
}

export interface CargoApiResponse {
  id: number
  cargo_id: string
  expedition_id: string | null
  description: string | null
  category: string | null
  weight: number | null
  weight_unit: string | null
  origin: string | null
  destination: string | null
  transport_mode: string | null
  priority: string | null
  arrival_date: string | null
  status: string | null
}

export function mapApiToCargoRecord(api: CargoApiResponse): CargoRecord {
  const weightStr = api.weight != null ? `${api.weight} ${api.weight_unit || 'MT'}` : 'N/A'
  const transportMode = (api.transport_mode as TransportMode) || 'Polar Vessel'
  const priority = (api.priority as CargoPriority) || 'Standard'
  const status = (api.status as CargoStatus) || 'Planned'
  const arrivalDate = api.arrival_date ? `${api.arrival_date} 12:00 UTC` : 'TBD'
  const expId = api.expedition_id || ''

  return {
    id: api.cargo_id,
    description: api.description || 'General Antarctic Freight Consignment',
    category: (api.category as CargoRecord['category']) || 'Machinery Spares',
    weight: weightStr,
    origin: api.origin || 'Cape Town Staging Port',
    destination: api.destination || 'Maitri Ice Shelf Berth',
    transportMode,
    carrier: transportMode === 'Polar Vessel' ? 'MV Vasily Golovnin' : 'Basler BT-67 Polar Transport',
    priority,
    expectedArrival: arrivalDate,
    actualArrival: status === 'Received' || status === 'Arrived' ? arrivalDate : null,
    status,
    expeditionId: expId,
    expeditionName: expId ? (expId === 'EXP-2026-014' ? '44th Indian Scientific Expedition to Antarctica (ISEA)' : expId) : 'Unassigned',
    hazmat: api.category === 'Fuel & Hydrocarbons' ? 'IMO Class 3 (Flammable)' : 'Non-Hazardous',
    riskScorePlaceholder: priority === 'Critical' ? 'Critical (0.82) · Elevated Watch' : 'Nominal (0.14) · Future Risk Engine Slot',
    notes: `Database consignment record for ${api.cargo_id}. Certified for polar transit.`,
    timeline: [
      {
        timestamp: arrivalDate,
        action: `Status Recorded: ${status}`,
        officer: 'NCPOR Logistics Wing',
        details: `Consignment state verified in central logistics database.`,
      },
    ],
  }
}

export async function fetchCargoList(expeditionId?: string): Promise<CargoRecord[]> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = expeditionId
    ? `${API_BASE_URL}/cargo?expedition_id=${encodeURIComponent(expeditionId)}`
    : `${API_BASE_URL}/cargo`

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Failed to fetch cargo list from server (${response.status})`)
  }

  const data: CargoApiResponse[] = await response.json()
  return data.map(mapApiToCargoRecord)
}

export async function createCargo(payload: CargoApiPayload): Promise<{ success: boolean; id: number; cargo_id: string; expedition_id?: string | null }> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/cargo`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = `Failed to create cargo consignment (${response.status})`
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

export async function fetchCargoById(cargoId: string): Promise<CargoRecord> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const cleanId = encodeURIComponent(cargoId.trim())
  const response = await fetch(`${API_BASE_URL}/cargo/${cleanId}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    let errorDetail = `Failed to fetch cargo ${cargoId} (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const txt = await response.text()
      if (txt) errorDetail = txt
    }
    throw new Error(errorDetail)
  }

  const data: CargoApiResponse = await response.json()
  return mapApiToCargoRecord(data)
}

export async function updateCargoStatus(cargoId: string, status: CargoStatus): Promise<CargoRecord> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const cleanId = encodeURIComponent(cargoId.trim())
  const response = await fetch(`${API_BASE_URL}/cargo/${cleanId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    let errorDetail = `Failed to update cargo status (${response.status})`
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

  const data: CargoApiResponse = await response.json()
  return mapApiToCargoRecord(data)
}

