import { getAccessToken } from '@/services/authService'
import type {
  IncidentRecord,
  IncidentSeverity,
  IncidentResponseStatus,
  AffectedPerson,
  AffectedCargoItem,
  EmergencyTimelineEvent,
} from '@/data/emergencyData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''

export interface EmergencyIncidentApiResponse {
  id: number
  incident_id: string
  title: string
  description: string | null
  incident_type: string | null
  severity: string
  status: string
  location: string | null
  station_id: string | null
  expedition_id: string | null
  expedition_name: string | null
  reported_by: string | null
  reported_at: string | null
  resolved_at: string | null
  assigned_to: string | null
  assigned_unit: string | null
  lead_officer: string | null
  comms_frequency: string | null
  coordinates: string | null
  personnel_affected_count: number | null
  cargo_affected_count: number | null
  response_action: string | null
  response_actions: string | null
  notes: string | null
  resolution_notes: string | null
  affected_personnel: string | null
  affected_cargo: string | null
  timeline: string | null
}

export function mapApiToIncidentRecord(item: EmergencyIncidentApiResponse): IncidentRecord {
  let parsedPersonnel: AffectedPerson[] = []
  if (item.affected_personnel) {
    try {
      parsedPersonnel = JSON.parse(item.affected_personnel)
    } catch {
      parsedPersonnel = []
    }
  }

  let parsedCargo: AffectedCargoItem[] = []
  if (item.affected_cargo) {
    try {
      parsedCargo = JSON.parse(item.affected_cargo)
    } catch {
      parsedCargo = []
    }
  }

  let parsedResponseActions: Array<{ title: string; unit: string; time: string; status: string; notes: string }> = []
  if (item.response_actions) {
    try {
      parsedResponseActions = JSON.parse(item.response_actions)
    } catch {
      parsedResponseActions = []
    }
  }

  let parsedTimeline: EmergencyTimelineEvent[] = []
  if (item.timeline) {
    try {
      parsedTimeline = JSON.parse(item.timeline)
    } catch {
      parsedTimeline = []
    }
  }

  // Fallbacks if timeline or actions are empty
  if (parsedResponseActions.length === 0 && item.response_action) {
    parsedResponseActions.push({
      title: item.response_action,
      unit: item.assigned_unit || item.assigned_to || 'SAR Command',
      time: item.reported_at || 'Logged',
      status: item.status || 'Active',
      notes: item.notes || item.description || '',
    })
  }

  if (parsedTimeline.length === 0) {
    parsedTimeline.push({
      id: `EVT-${item.id}`,
      timestamp: item.reported_at || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      action: `Incident Logged: ${item.title}`,
      officer: item.lead_officer || item.reported_by || 'Duty Operations Officer',
      details: item.description || 'Emergency incident recorded in operational system.',
    })
  }

  const severityNorm: IncidentSeverity =
    item.severity === 'Critical' || item.severity === 'High' || item.severity === 'Moderate' || item.severity === 'Low'
      ? item.severity
      : 'High'

  const statusNorm: IncidentResponseStatus =
    item.status === 'Resolved' || item.status === 'Responding' || item.status === 'Acknowledged' || item.status === 'Reported'
      ? (item.status as IncidentResponseStatus)
      : item.status === 'Open'
      ? 'Responding'
      : item.status === 'Closed'
      ? 'Resolved'
      : 'Reported'

  return {
    id: item.incident_id,
    time: item.reported_at || `${new Date().toISOString().substring(0, 10)} 00:00 UTC`,
    location: item.location || 'Unknown Location',
    type: item.title,
    severity: severityNorm,
    personnelAffectedCount: item.personnel_affected_count ?? 0,
    cargoAffectedCount: item.cargo_affected_count ?? 0,
    responseStatus: statusNorm,
    description: item.description || '',
    expeditionId: item.expedition_id || 'EXP-2026-014',
    expeditionName: item.expedition_name || '44th Indian Scientific Expedition to Antarctica (ISEA)',
    assignedUnit: item.assigned_unit || item.assigned_to || 'SAR Command',
    leadOfficer: item.lead_officer || item.reported_by || 'Emergency Ops Officer',
    commsFrequency: item.comms_frequency || 'VHF Channel 16 Active',
    coordinates: item.coordinates || 'Station Perimeter',
    affectedPersonnel: parsedPersonnel,
    affectedCargo: parsedCargo,
    responseActions: parsedResponseActions,
    resolutionNotes: item.resolution_notes || item.notes || undefined,
    timeline: parsedTimeline,
  }
}

export async function fetchEmergencyIncidentsList(): Promise<IncidentRecord[]> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/emergency-incidents`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    let errorDetail = `Failed to fetch emergency incidents (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  const data: EmergencyIncidentApiResponse[] = await response.json()
  return data.map(mapApiToIncidentRecord)
}

export async function fetchEmergencyIncidentById(incidentId: string): Promise<IncidentRecord> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const cleanId = encodeURIComponent(incidentId.trim())
  const response = await fetch(`${API_BASE_URL}/emergency-incidents/${cleanId}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    let errorDetail = `Failed to fetch incident ${incidentId} (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  const data: EmergencyIncidentApiResponse = await response.json()
  return mapApiToIncidentRecord(data)
}

export async function createEmergencyIncident(record: IncidentRecord): Promise<IncidentRecord> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const payload = {
    incident_id: record.id.trim(),
    title: record.type.trim(),
    description: record.description.trim() || undefined,
    incident_type: 'Operational Safety / SAR',
    severity: record.severity,
    status: record.responseStatus,
    location: record.location.trim() || undefined,
    station_id: record.location.includes('Maitri') ? 'Maitri' : record.location.includes('Bharati') ? 'Bharati' : 'Himadri',
    expedition_id: record.expeditionId || 'EXP-2026-014',
    expedition_name: record.expeditionName || '44th Indian Scientific Expedition to Antarctica (ISEA)',
    reported_by: record.leadOfficer || 'Operations Duty Officer',
    reported_at: record.time || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    assigned_to: record.assignedUnit || 'Maitri Station SAR Unit',
    assigned_unit: record.assignedUnit || 'Maitri Station SAR Unit',
    lead_officer: record.leadOfficer || 'Station Emergency Desk',
    comms_frequency: record.commsFrequency || 'VHF Channel 16 Active',
    coordinates: record.coordinates || 'Pending Field Fix',
    personnel_affected_count: record.personnelAffectedCount || 0,
    cargo_affected_count: record.cargoAffectedCount || 0,
    response_action: record.responseActions?.[0]?.title || 'Initial Incident Report Logged',
    response_actions: JSON.stringify(record.responseActions || []),
    resolution_notes: record.resolutionNotes || undefined,
    affected_personnel: JSON.stringify(record.affectedPersonnel || []),
    affected_cargo: JSON.stringify(record.affectedCargo || []),
    timeline: JSON.stringify(record.timeline || []),
  }

  const response = await fetch(`${API_BASE_URL}/emergency-incidents`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = `Failed to create emergency incident (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  const data: EmergencyIncidentApiResponse = await response.json()
  return mapApiToIncidentRecord(data)
}

export async function updateEmergencyIncidentStatus(
  incidentId: string,
  update: {
    status?: IncidentResponseStatus | string
    resolution_notes?: string
    response_action?: string
    response_actions?: string
    timeline?: string
  }
): Promise<IncidentRecord> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const cleanId = encodeURIComponent(incidentId.trim())
  const response = await fetch(`${API_BASE_URL}/emergency-incidents/${cleanId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(update),
  })

  if (!response.ok) {
    let errorDetail = `Failed to update emergency incident ${incidentId} (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  const data: EmergencyIncidentApiResponse = await response.json()
  return mapApiToIncidentRecord(data)
}
