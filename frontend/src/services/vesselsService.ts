import { getAccessToken } from '@/services/authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''

export interface VesselApiResponse {
  id: number
  vessel_id: string
  name: string
  vessel_type: string | null
  expedition_id: string | null
  call_sign: string | null
  imo_number: string | null
  flag: string | null
  captain: string | null
  leader: string | null
  origin: string
  destination: string
  status: string | null
  latitude: number | null
  longitude: number | null
  heading: string | null
  speed_knots: number | null
  ice_class: string | null
  cargo_count: number | null
  eta: string | null
  last_known_timestamp: string | null
  is_live_gps: boolean
  weather_status: string | null
  route_points: string | null
  notes: string | null
}

export interface VesselApiPayload {
  vesselId?: string
  name: string
  vesselType?: string
  expeditionId?: string
  callSign?: string
  imoNumber?: string
  flag?: string
  captain?: string
  leader?: string
  origin: string
  destination: string
  status?: string
  latitude?: number
  longitude?: number
  heading?: string
  speedKnots?: number
  iceClass?: string
  cargoCount?: number
  eta?: string
  lastKnownTimestamp?: string
  isLiveGps?: boolean
  weatherStatus?: string
  routePoints?: string
  notes?: string
}

export async function fetchVesselsList(): Promise<VesselApiResponse[]> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/vessels`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Failed to fetch vessels and tracking from server (${response.status})`)
  }

  const data: VesselApiResponse[] = await response.json()
  return data
}

export async function createVessel(payload: VesselApiPayload): Promise<{
  success: boolean
  message: string
  id: number
  vessel_id: string
  name: string
}> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/vessels`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const detailMsg = errorData?.detail || `Failed to register vessel / movement on server (${response.status})`
    throw new Error(detailMsg)
  }

  return response.json()
}
