import { getAccessToken } from '@/services/authService'
import type {
  OperationalAlertItem,
  AlertSeverity,
  AlertCategory,
  AlertStatus,
  AlertSourceType,
} from '@/data/alertsData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''

export interface AlertApiResponse {
  id: number
  alert_id: string
  severity: string
  category: string
  message: string
  detail: string | null
  related_entity: string | null
  related_entity_route: string | null
  source_mechanism: string | null
  status: string
  created_at: string | null
  created_date: string | null
  acknowledged_at: string | null
  acknowledged_by: string | null
}

export interface CreateAlertPayload {
  alert_id?: string
  severity: AlertSeverity
  category: AlertCategory
  message: string
  detail?: string
  related_entity?: string
  related_entity_route?: string
  source_mechanism?: AlertSourceType
  status?: AlertStatus
}

export function mapApiToAlertItem(item: AlertApiResponse): OperationalAlertItem {
  return {
    id: item.alert_id,
    severity: (item.severity as AlertSeverity) || 'Moderate',
    category: (item.category as AlertCategory) || 'Emergency',
    message: item.message,
    detail: item.detail || '',
    relatedEntityName: item.related_entity || 'NCPOR Mission Control',
    relatedEntityRoute: item.related_entity_route || '/dashboard',
    createdAt: item.created_at || 'Just now',
    createdDate: item.created_date || new Date().toISOString().slice(0, 10),
    status: (item.status as AlertStatus) || 'New',
    sourceType: (item.source_mechanism as AlertSourceType) || 'Manual Dispatch',
  }
}

export async function fetchAlertsList(): Promise<OperationalAlertItem[]> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/alerts`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    let errorDetail = `Failed to fetch alerts (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  const data: AlertApiResponse[] = await response.json()
  return data.map(mapApiToAlertItem)
}

export async function fetchAlertById(alertId: string): Promise<OperationalAlertItem> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const cleanId = encodeURIComponent(alertId.trim())
  const response = await fetch(`${API_BASE_URL}/alerts/${cleanId}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    let errorDetail = `Failed to fetch alert ${alertId} (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  const data: AlertApiResponse = await response.json()
  return mapApiToAlertItem(data)
}

export async function createAlert(payload: CreateAlertPayload): Promise<OperationalAlertItem> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/alerts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = `Failed to create alert (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  const data: AlertApiResponse = await response.json()
  return mapApiToAlertItem(data)
}

export async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
  acknowledgedBy?: string
): Promise<OperationalAlertItem> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const cleanId = encodeURIComponent(alertId.trim())
  const body: Record<string, unknown> = { status }
  if (status === 'Acknowledged' && acknowledgedBy) {
    body.acknowledged_by = acknowledgedBy
  }

  const response = await fetch(`${API_BASE_URL}/alerts/${cleanId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let errorDetail = `Failed to update alert (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson.detail) errorDetail = errJson.detail
    } catch {
      const text = await response.text()
      if (text) errorDetail = text
    }
    throw new Error(errorDetail)
  }

  const data: AlertApiResponse = await response.json()
  return mapApiToAlertItem(data)
}
