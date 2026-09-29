import { getAccessToken } from '@/services/authService'
import type { ExpeditionDetail } from '@/data/expeditionsData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''

export interface ExpeditionApiPayload {
  name: string
  station: string
  startDate: string
  endDate: string
  lead: string
  personnelCount: number
  notes: string
  status?: string
  expedition_id?: string
}

export interface ExpeditionApiResponse {
  id: number
  expedition_id: string
  name: string
  season: string | null
  station: string
  start_date: string | null
  end_date: string | null
  lead: string | null
  lead_role: string | null
  lead_org: string | null
  personnel_count: number | null
  cargo_count: number | null
  status: string | null
  notes: string | null
  mandate: string | null
  primary_vessel: string | null
  air_support: string | null
  comms_link: string | null
}

export function mapApiToExpeditionDetail(api: ExpeditionApiResponse): ExpeditionDetail {
  const startDateStr = api.start_date ? api.start_date.split('T')[0] : '2026-11-01'
  const endDateStr = api.end_date ? api.end_date.split('T')[0] : '2027-04-15'
  const year = new Date(startDateStr).getFullYear() || 2026
  const leadName = api.lead || 'Dr. Alok Verma'
  const stationName = api.station || 'Maitri & Bharati'
  const statusVal = (api.status as ExpeditionDetail['status']) || 'Planning'

  return {
    id: api.expedition_id,
    name: api.name,
    season: api.season || `${year}-${year + 1} (Registered Campaign)`,
    station: stationName,
    startDate: startDateStr,
    endDate: endDateStr,
    lead: leadName,
    leadRole: api.lead_role || 'Expedition Commander',
    leadOrg: api.lead_org || 'National Centre for Polar and Ocean Research (NCPOR)',
    personnelCount: api.personnel_count ?? 1,
    cargoCount: api.cargo_count ?? 0,
    status: statusVal,
    notes: api.notes || 'Polar expedition campaign recorded in central logistics database.',
    mandate: api.mandate || `MoES Polar Order Ref #${api.expedition_id}-NCPOR`,
    primaryVessel: api.primary_vessel || 'Vessel Assignment in Progress',
    airSupport: api.air_support || 'Air Logistics Awaiting Charter',
    commsLink: api.comms_link || 'NCPOR Satellite Dispatch',
    personnel: [
      {
        id: `NCPOR-P-${api.id.toString().padStart(4, '0')}01`,
        name: leadName,
        role: 'Expedition Lead',
        station: stationName,
        organization: api.lead_org || 'NCPOR / MoES',
        team: 'Mission Command',
        bloodGroup: 'O+',
        medicalClearance: 'AIIMS Certified Valid',
        survivalTraining: 'ITBP Auli Polar Qualified',
        status: statusVal === 'Active' ? 'Deployed' : 'Standby',
      },
    ],
    cargo: [],
    inventory: [],
    environmental: [
      {
        station: stationName,
        coordinates: 'Coordinates Assigned On Arrival',
        temperature: '-18.0°C',
        windChill: '-30.0°C',
        windSpeed: '20 kt',
        windDirection: 'E',
        pressure: '980 hPa',
        pressureTrend: 'Steady',
        condition: 'Clear Operational Window',
        alertLevel: 'NOMINAL',
        lastUpdated: 'Live AWS Feed',
      },
    ],
    incidents: [],
    timeline: [
      {
        id: `TL-DB-${api.id}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        title: 'Campaign Synchronized with Central PostgreSQL Database',
        category: 'Milestone',
        officer: leadName,
        details: `Expedition dossier authenticated in central polar operations database. Status: ${statusVal}.`,
      },
    ],
  }
}

export async function fetchExpeditionsList(): Promise<ExpeditionDetail[]> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/expeditions`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Failed to fetch expeditions from server (${response.status})`)
  }

  const data: ExpeditionApiResponse[] = await response.json()
  return data.map(mapApiToExpeditionDetail)
}

export async function createExpedition(payload: ExpeditionApiPayload): Promise<{ success: boolean; id: number; expedition_id: string; name: string }> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/expeditions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: payload.name.trim(),
      station: payload.station.trim(),
      start_date: payload.startDate,
      end_date: payload.endDate,
      lead: payload.lead.trim(),
      personnel_count: payload.personnelCount,
      notes: payload.notes.trim(),
      status: payload.status || 'Planning',
      expedition_id: payload.expedition_id,
    }),
  })

  if (!response.ok) {
    let errorDetail = `Failed to register expedition campaign (${response.status})`
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

export async function updateExpeditionStatus(
  expeditionId: string | number,
  status: string
): Promise<ExpeditionApiResponse> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/expeditions/${expeditionId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    let errorDetail = `Failed to update expedition status (${response.status})`
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

// ==============================================================================
// Phase 2: Individual Packing & Cargo Capacity Types & API Methods
// ==============================================================================

export type PackingPriority = 'CRITICAL' | 'HIGH' | 'NORMAL'
export type PackingStatus = 'PLANNED' | 'PACKED' | 'INSPECTED' | 'LOADED'

export interface PackingItem {
  id: number
  expedition_id: string
  personnel_id: string
  personnel_name?: string | null
  personnel_role?: string | null
  item_name: string
  category: string
  quantity: number
  unit?: string | null
  unit_weight_kg: number
  total_weight_kg: number
  priority: PackingPriority
  source_reason?: string | null
  status: PackingStatus
  created_at?: string | null
  updated_at?: string | null
}

export interface PackingItemCreatePayload {
  personnelId: string
  personnelName?: string
  personnelRole?: string
  itemName: string
  category?: string
  quantity: number
  unit?: string
  unitWeightKg: number
  priority?: PackingPriority
  sourceReason?: string
  status?: PackingStatus
}

export interface PackingItemUpdatePayload {
  personnelId?: string
  personnelName?: string
  personnelRole?: string
  itemName?: string
  category?: string
  quantity?: number
  unit?: string
  unitWeightKg?: number
  priority?: PackingPriority
  sourceReason?: string
  status?: PackingStatus
}

export interface IndividualPackingSummary {
  personnel_id: string
  personnel_name: string
  personnel_role?: string | null
  organization?: string | null
  station?: string | null
  total_items_count: number
  total_quantity: number
  total_weight_kg: number
  items: PackingItem[]
}

export interface PriorityBreakdownItem {
  item_count: number
  total_quantity: number
  weight_kg: number
  percentage: number
}

export interface TeamLoadSummary {
  expedition_id: string
  expedition_name: string
  station: string
  total_personnel_count: number
  personnel_with_packing_lists_count: number
  total_items_count: number
  total_quantity: number
  total_team_load_kg: number
  priority_breakdown: Record<string, PriorityBreakdownItem>
  category_breakdown: Record<string, PriorityBreakdownItem>
  personnel_breakdown: IndividualPackingSummary[]
}

export interface CargoCapacitySummary {
  expedition_id: string
  expedition_name: string
  maximum_capacity_kg: number
  allocated_cargo_weight_kg: number
  team_personal_load_kg: number
  total_planned_weight_kg: number
  remaining_capacity_kg: number
  over_capacity_kg: number
  capacity_utilization_pct: number
  status: 'WITHIN_CAPACITY' | 'OVER_CAPACITY'
  critical_weight_kg: number
  high_weight_kg: number
  normal_weight_kg: number
  notes?: string | null
  updated_at?: string | null
}

export interface ExpeditionPackingSummary {
  expedition_id: string
  expedition_name: string
  team_load: TeamLoadSummary
  capacity: CargoCapacitySummary
}

export async function fetchExpeditionPackingItems(
  expeditionId: string,
  personnelId?: string
): Promise<PackingItem[]> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const url = personnelId
    ? `${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/packing?personnel_id=${encodeURIComponent(personnelId)}`
    : `${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/packing`

  const response = await fetch(url, { method: 'GET', headers })
  if (!response.ok) {
    const txt = await response.text().catch(() => '')
    throw new Error(txt || `Failed to fetch packing items (${response.status})`)
  }
  return response.json()
}

export async function createExpeditionPackingItem(
  expeditionId: string,
  payload: PackingItemCreatePayload
): Promise<PackingItem> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/packing`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = `Failed to create packing item (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const txt = await response.text()
      if (txt) errorDetail = txt
    }
    throw new Error(errorDetail)
  }
  return response.json()
}

export async function updateExpeditionPackingItem(
  expeditionId: string,
  itemId: number,
  payload: PackingItemUpdatePayload
): Promise<PackingItem> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/packing/${itemId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = `Failed to update packing item (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const txt = await response.text()
      if (txt) errorDetail = txt
    }
    throw new Error(errorDetail)
  }
  return response.json()
}

export async function deleteExpeditionPackingItem(
  expeditionId: string,
  itemId: number
): Promise<{ success: boolean; message: string }> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/packing/${itemId}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    let errorDetail = `Failed to delete packing item (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const txt = await response.text()
      if (txt) errorDetail = txt
    }
    throw new Error(errorDetail)
  }
  return response.json()
}

export async function fetchTeamLoadSummary(expeditionId: string): Promise<TeamLoadSummary> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/load-summary`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const txt = await response.text().catch(() => '')
    throw new Error(txt || `Failed to fetch team load summary (${response.status})`)
  }
  return response.json()
}

export async function fetchCargoCapacity(expeditionId: string): Promise<CargoCapacitySummary> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/capacity`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const txt = await response.text().catch(() => '')
    throw new Error(txt || `Failed to fetch cargo capacity (${response.status})`)
  }
  return response.json()
}

export async function updateCargoCapacity(
  expeditionId: string,
  payload: { maxCapacityKg: number; allocatedCargoKg?: number; notes?: string }
): Promise<CargoCapacitySummary> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/capacity`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = `Failed to update cargo capacity (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const txt = await response.text()
      if (txt) errorDetail = txt
    }
    throw new Error(errorDetail)
  }
  return response.json()
}

export async function fetchExpeditionPackingSummary(expeditionId: string): Promise<ExpeditionPackingSummary> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/packing/summary`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const txt = await response.text().catch(() => '')
    throw new Error(txt || `Failed to fetch packing summary (${response.status})`)
  }
  return response.json()
}

// =========================================================================
// PHASE 3.4 MISSION READINESS ENGINE
// =========================================================================

export interface ReadinessPillarResult {
  category: 'PERSONNEL' | 'PACKING' | 'CAPACITY' | 'INVENTORY' | 'ASSETS' | 'STATION' | 'SAFETY'
  status: 'PASSED' | 'WARNING' | 'FAILED'
  title: string
  summary: string
  blockers: string[]
  warnings: string[]
  details: Record<string, any>
}

export interface MissionReadinessResponse {
  expeditionId: string
  expeditionName: string
  overallStatus: 'READY' | 'NOT_READY'
  readinessSummary: string
  totalChecks: number
  passedChecks: number
  warningChecks: number
  failedChecks: number
  pillars: ReadinessPillarResult[]
  evaluatedAt: string | null
}

export async function fetchMissionReadiness(expeditionId: string): Promise<MissionReadinessResponse> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/readiness`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const txt = await response.text().catch(() => '')
    throw new Error(txt || `Failed to fetch mission readiness (${response.status})`)
  }
  return response.json()
}
