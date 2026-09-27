import { getAccessToken } from '@/services/authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''

export interface StationApiPayload {
  stationId?: string
  name: string
  location: string
  coordinates: string
  latitude?: number
  longitude?: number
  elevation?: string
  status?: string
  stationType?: string
  country?: string
  establishedYear?: number
  capacity?: number
  currentOccupancy?: number
  contactEmail?: string
  sensorId?: string
  notes?: string
}

export interface StationApiResponse {
  id: number
  station_id: string
  name: string
  location: string
  coordinates: string
  latitude: number | null
  longitude: number | null
  elevation: string | null
  status: string | null
  station_type: string | null
  country: string | null
  established_year: number | null
  capacity: number | null
  current_occupancy: number | null
  contact_email: string | null
  sensor_id: string | null
  notes: string | null
}

export async function fetchStationsList(): Promise<StationApiResponse[]> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/stations`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Failed to fetch stations from server (${response.status})`)
  }

  return response.json()
}

export async function createStation(payload: StationApiPayload): Promise<{ success: boolean; id: number; station_id: string; name: string }> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/stations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      station_id: payload.stationId?.trim() || undefined,
      name: payload.name.trim(),
      location: payload.location.trim(),
      coordinates: payload.coordinates.trim(),
      latitude: payload.latitude,
      longitude: payload.longitude,
      elevation: payload.elevation?.trim() || undefined,
      status: payload.status || 'Operational',
      station_type: payload.stationType?.trim() || undefined,
      country: payload.country?.trim() || 'India',
      established_year: payload.establishedYear,
      capacity: payload.capacity ?? 25,
      current_occupancy: payload.currentOccupancy ?? 0,
      contact_email: payload.contactEmail?.trim() || undefined,
      sensor_id: payload.sensorId?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
    }),
  })

  if (!response.ok) {
    let errorDetail = `Failed to register station facility (${response.status})`
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
