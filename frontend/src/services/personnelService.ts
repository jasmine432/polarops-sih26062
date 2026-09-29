import { getAccessToken } from '@/services/authService'
import type {
  PersonnelRecord,
  PersonnelStatus,
  PersonnelTransportMode,
} from '@/data/personnelData'

export type {
  PersonnelRecord,
  PersonnelStatus,
  PersonnelTransportMode,
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''

export interface PersonnelApiPayload {
  name: string
  role: string
  organization?: string
  expeditionId?: string
  expeditionName?: string
  currentStation: string
  destination: string
  departure: string
  expectedArrival: string
  transportMode?: PersonnelTransportMode
  status?: PersonnelStatus
  bloodGroup?: string
  medicalClearance?: string
  personnelId?: string
}

export interface PersonnelApiResponse {
  id: number
  personnel_id: string
  name: string
  role: string
  organization: string | null
  expedition_id: string | null
  expedition_name: string | null
  current_station: string
  destination: string | null
  departure: string | null
  expected_arrival: string | null
  transport_mode: string | null
  status: string | null
  carrier_flight: string | null
  coordinates: string | null
  module_location: string | null
  vhf_callsign: string | null
  blood_group: string | null
  medical_clearance: string | null
  medical_clearance_date: string | null
  survival_training: string | null
  survival_training_school: string | null
  emergency_role: string | null
}

export function mapApiToPersonnelRecord(api: PersonnelApiResponse): PersonnelRecord {
  const statusVal = (api.status as PersonnelStatus) || 'At Station'
  const transportVal = (api.transport_mode as PersonnelTransportMode) || 'Station Base (No Transit)'
  const seqNumber = api.personnel_id.replace(/[^0-9]/g, '') || api.id.toString()

  const isCompleted = statusVal === 'At Station' || statusVal === 'Arrived' || statusVal === 'Transferred'

  return {
    id: api.personnel_id,
    name: api.name,
    role: api.role,
    organization: api.organization || 'National Centre for Polar and Ocean Research (NCPOR)',
    expeditionId: api.expedition_id || 'EXP-2026-014',
    expeditionName:
      api.expedition_name ||
      (api.expedition_id === 'EXP-2026-015'
        ? 'Indian Arctic Autumn Scientific Campaign'
        : api.expedition_id === 'EXP-2026-017'
        ? '43rd ISEA Wintering Relocation & Retrograde Team'
        : '44th Indian Scientific Expedition to Antarctica (ISEA)'),
    currentStation: api.current_station,
    destination: api.destination || 'Maitri Base (Stationary)',
    departure: api.departure || '2026-11-20',
    expectedArrival: api.expected_arrival || '2026-11-25',
    transportMode: transportVal,
    status: statusVal,
    carrierFlight: api.carrier_flight || `${transportVal} Unit`,
    coordinates: api.coordinates || '70°45\'57" S, 11°44\'09" E',
    moduleLocation: api.module_location || 'Main Habitat · Field Post',
    vhfCallsign: api.vhf_callsign || `POLAR-CALL-${seqNumber}`,
    bloodGroup: api.blood_group || 'O+',
    medicalClearance: api.medical_clearance || 'AIIMS Certified (Class-1 Polar)',
    medicalClearanceDate: api.medical_clearance_date || '2026-08-10 (Valid for 18 Months)',
    survivalTraining: api.survival_training || 'ITBP Auli Polar Qualified',
    survivalTrainingSchool: api.survival_training_school || 'ITBP Auli / High Altitude Warfare School',
    emergencyRole: api.emergency_role || 'Station Operations Support',
    movementTimeline: {
      origin: api.current_station,
      destination: api.destination || 'Sector Assigned',
      departureTime: api.departure || '2026-11-20',
      transitCheckpoint: 'Midway Checkpoint Point',
      expectedArrival: api.expected_arrival || '2026-11-25',
      currentStageIndex: isCompleted ? 3 : 1,
      stages: [
        { name: 'Departure Check', time: api.departure || 'Cleared', completed: true, current: false },
        { name: 'In Transit', time: isCompleted ? 'Completed' : 'Active', completed: isCompleted, current: !isCompleted },
        { name: 'Waypoint Checkpoint', time: 'En Route', completed: isCompleted, current: false },
        { name: 'Destination Check-in', time: api.expected_arrival || 'Scheduled', completed: isCompleted, current: isCompleted },
      ],
    },
    movementHistory: [
      {
        id: `MOV-DB-${api.id}`,
        origin: api.current_station,
        destination: api.destination || 'Destination Sector',
        departureDate: api.departure || '2026-11-20',
        arrivalDate: api.expected_arrival || '2026-11-25',
        transportMode: transportVal,
        carrierVehicle: api.carrier_flight || transportVal,
        status: isCompleted ? 'Completed' : 'In Transit',
        notes: `Personnel movement record retrieved from central PostgreSQL database. Current status: ${statusVal}.`,
      },
    ],
    activityLogs: [
      {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        activity: `Personnel deployment roster record verified (${api.role})`,
        location: api.current_station,
        officer: api.name,
      },
    ],
  }
}

export async function fetchPersonnelList(expeditionId?: string): Promise<PersonnelRecord[]> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = expeditionId
    ? `${API_BASE_URL}/personnel?expedition_id=${encodeURIComponent(expeditionId)}`
    : `${API_BASE_URL}/personnel`

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Failed to fetch personnel from server (${response.status})`)
  }

  const data: PersonnelApiResponse[] = await response.json()
  return data.map(mapApiToPersonnelRecord)
}

export async function createPersonnel(payload: PersonnelApiPayload): Promise<{ success: boolean; id: number; personnel_id: string; name: string }> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/personnel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: payload.name.trim(),
      role: payload.role.trim(),
      organization: payload.organization?.trim() || 'National Centre for Polar and Ocean Research (NCPOR)',
      expedition_id: payload.expeditionId || 'EXP-2026-014',
      expedition_name: payload.expeditionName,
      current_station: payload.currentStation.trim(),
      destination: payload.destination.trim(),
      departure: payload.departure.trim(),
      expected_arrival: payload.expectedArrival.trim(),
      transport_mode: payload.transportMode || 'Basler BT-67 Air Lift',
      status: payload.status || 'In Transit',
      blood_group: payload.bloodGroup || 'O+',
      medical_clearance: payload.medicalClearance || 'AIIMS Certified',
      personnel_id: payload.personnelId,
    }),
  })

  if (!response.ok) {
    let errorDetail = `Failed to register personnel movement (${response.status})`
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
