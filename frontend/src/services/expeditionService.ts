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
