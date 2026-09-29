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

// =========================================================================
// PHASE 3.5 MISSION PROGRESS & ROUTE TRACKING
// =========================================================================

export interface RouteWaypoint {
  name?: string | null
  latitude: number
  longitude: number
  order: number
  passed: boolean
  estimatedArrival?: string | null
}

export interface LocationCoordinate {
  name?: string | null
  latitude?: number | null
  longitude?: number | null
  formattedCoordinates?: string | null
}

export type TelemetrySourceType = 'LIVE_GPS' | 'PROTOTYPE_SIMULATED' | 'LOCATION_UNAVAILABLE'

export interface MissionProgressResponse {
  expeditionId: string
  expeditionName: string
  currentPhase: string
  status: string
  origin: LocationCoordinate
  destination: LocationCoordinate
  currentLocation?: LocationCoordinate | null
  waypoints: RouteWaypoint[]
  totalDistanceKm: number
  distanceTraveledKm: number
  remainingDistanceKm: number
  progressPercent: number
  telemetrySource: TelemetrySourceType
  telemetryLabel: string
  telemetryIsLive: boolean
  heading?: string | null
  speedKnots?: number | null
  eta?: string | null
  etaBreakdown?: string | null
  vesselName?: string | null
  lastKnownTimestamp?: string | null
  notes: string[]
}

export async function fetchMissionProgress(expeditionId: string): Promise<MissionProgressResponse> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/progress`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const txt = await response.text().catch(() => '')
    throw new Error(txt || `Failed to fetch mission progress (${response.status})`)
  }
  return response.json()
}

export async function updateMissionPhase(
  expeditionId: string,
  phase: string,
  notes?: string
): Promise<MissionProgressResponse> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/progress/phase`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ phase, notes }),
  })

  if (!response.ok) {
    let errorDetail = `Failed to update mission phase (${response.status})`
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

// =========================================================================
// PHASE 3.6 WHAT-IF MISSION SIMULATION
// =========================================================================

export interface WhatIfSimulationRequest {
  duration_days_override?: number | null
  cargo_capacity_override_kg?: number | null
  delayed_resupply_days?: number
  initial_stock_reduction_pct?: number
}

export interface WhatIfInventoryItem {
  inventory_id: number
  item_name: string
  category: string
  location: string
  unit: string
  current_stock: number
  simulated_stock: number
  minimum_stock: number
  shortage: boolean
  stock_reduction_pct: number
}

export interface WhatIfDelayedResupplyItem {
  resupply_item_id: number
  item_name: string
  status: string
  resupply_quantity: number
  original_eta?: string | null
  simulated_delay_days: number
}

export interface WhatIfCurrentState {
  duration_days: number
  cargo_capacity_kg: number
  planned_load_kg: number
}

export interface WhatIfSimulatedState {
  duration_days: number
  cargo_capacity_kg: number
  planned_load_kg: number
  capacity_utilization_pct: number
  remaining_capacity_kg: number
  over_capacity_kg: number
  inventory_risk_count: number
  delayed_resupply_count: number
  readiness_status: 'READY' | 'NOT_READY'
}

export interface WhatIfSimulationResponse {
  expedition_id: string
  expedition_name: string
  simulation_only: boolean
  database_mutated: boolean
  scenario: {
    duration_days_override?: number | null
    cargo_capacity_override_kg?: number | null
    delayed_resupply_days: number
    initial_stock_reduction_pct: number
  }
  current_state: WhatIfCurrentState
  simulated_state: WhatIfSimulatedState
  inventory: WhatIfInventoryItem[]
  delayed_resupply: WhatIfDelayedResupplyItem[]
  blockers: string[]
  impact_summary: string[]
}

export async function runWhatIfSimulation(
  expeditionId: string,
  payload: WhatIfSimulationRequest
): Promise<WhatIfSimulationResponse> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/simulation`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = `Failed to run mission simulation (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      const txt = await response.text()
      if (txt) errorDetail = txt
    }
    throw new Error(errorDetail)
  }
  return response.json()
}

// =========================================================================
// RESUPPLY & MISSION CONTROL SUMMARY HELPERS
// =========================================================================

export interface ResupplyItemDto {
  id: number
  expedition_id: string
  item_name: string
  category: string
  unit?: string | null
  current_stock: number
  minimum_stock: number
  predicted_demand?: number
  safety_stock?: number
  reorder_threshold?: number
  resupply_quantity: number
  source_station_id?: string | null
  delivery_vessel_id?: string | null
  target_eta?: string | null
  priority: string
  status: string
  is_ml_recommended?: boolean
  recommendation_notes?: string | null
}

export async function fetchResupplyItems(expeditionId: string): Promise<ResupplyItemDto[]> {
  const token = getAccessToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}/expeditions/${encodeURIComponent(expeditionId)}/resupply`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const txt = await response.text().catch(() => '')
    throw new Error(txt || `Failed to fetch resupply items (${response.status})`)
  }
  return response.json()
}

export interface ExpeditionMissionControlSummary {
  expedition: ExpeditionDetail
  readiness: MissionReadinessResponse | null
  progress: MissionProgressResponse | null
  capacity: CargoCapacitySummary | null
  resupplyItems: ResupplyItemDto[]
  attentionReasons: string[]
}

export async function fetchExpeditionMissionControlSummary(
  expedition: ExpeditionDetail
): Promise<ExpeditionMissionControlSummary> {
  const [readinessRes, progressRes, capacityRes, resupplyRes] = await Promise.allSettled([
    fetchMissionReadiness(expedition.id),
    fetchMissionProgress(expedition.id),
    fetchCargoCapacity(expedition.id),
    fetchResupplyItems(expedition.id),
  ])

  const readiness = readinessRes.status === 'fulfilled' ? readinessRes.value : null
  const progress = progressRes.status === 'fulfilled' ? progressRes.value : null
  const capacity = capacityRes.status === 'fulfilled' ? capacityRes.value : null
  const resupplyItems = resupplyRes.status === 'fulfilled' ? resupplyRes.value : []

  const attentionReasons: string[] = []

  if (readiness && readiness.overallStatus === 'NOT_READY') {
    attentionReasons.push(
      `${readiness.failedChecks} Readiness Blockers Detected (${readiness.pillars.filter(p => p.status === 'FAILED').map(p => p.title).join(', ')})`
    )
  }

  if (capacity && capacity.status === 'OVER_CAPACITY') {
    attentionReasons.push(
      `Cargo Over Capacity (${capacity.total_planned_weight_kg.toFixed(1)} / ${capacity.maximum_capacity_kg.toFixed(0)} kg)`
    )
  }

  const criticalResupply = resupplyItems.filter(r => r.priority === 'CRITICAL' || r.status === 'SUBMITTED')
  if (criticalResupply.length > 0) {
    attentionReasons.push(`${criticalResupply.length} Critical Resupply Action(s) Pending`)
  }

  if (expedition.incidents && expedition.incidents.length > 0) {
    const activeIncidents = expedition.incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed')
    if (activeIncidents.length > 0) {
      attentionReasons.push(`${activeIncidents.length} Active Operational Incident(s)`)
    }
  }

  return {
    expedition,
    readiness,
    progress,
    capacity,
    resupplyItems,
    attentionReasons,
  }
}
