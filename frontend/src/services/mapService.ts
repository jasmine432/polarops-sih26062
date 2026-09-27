/**
 * Map and Telemetry Service Layer
 *
 * Prepared for Node.js backend integration (/api/*).
 * Provides typed methods for stations, expeditions, active cargo movements, and local weather telemetry.
 */

import { STATIONS_WEATHER_DATA, type StationWeather } from '@/data/weatherData'

export type WeatherSuitabilityStatus = 'SUITABLE' | 'CAUTION' | 'UNSAFE' | 'DATA_UNAVAILABLE'

export interface WeatherEvaluation {
  status: WeatherSuitabilityStatus
  colorVariant: 'operational' | 'warning' | 'critical' | 'neutral'
  label: string
  reason: string
  recommendation: string
  criteriaNote: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface MapStation {
  id: string
  name: string
  country: string
  type: string
  coordinates: Coordinates
  coordinatesFormatted: string
  elevation: string
  status: 'Operational' | 'Restricted' | 'Standby'
  weather: StationWeather
}

export interface MapExpedition {
  id: string
  name: string
  vessel: string
  vesselType: string
  leader: string
  origin: string
  destination: string
  status: 'In Transit' | 'At Station' | 'Delayed' | 'Weather Hold' | 'Completed'
  currentCoordinates: Coordinates
  lastKnownTimestamp: string
  isLiveGps: boolean
  eta: string
  cargoCount: number
  routePoints: Coordinates[]
  weatherStatus: WeatherSuitabilityStatus
}

export interface MapCargoMovement {
  id: string
  cargoType: string
  description: string
  weight: string
  origin: string
  originCoordinates: Coordinates
  destination: string
  destinationCoordinates: Coordinates
  status: 'In Transit' | 'Delayed' | 'Weather Hold' | 'Arrived' | 'Completed'
  currentCoordinates: Coordinates
  lastKnownTimestamp: string
  isLiveGps: boolean
  eta: string
  carrier: string
  expeditionId: string
  priority: 'Critical' | 'High' | 'Standard'
  weather: {
    temperature: number
    windSpeed: number
    windDirection: string
    pressure: number
    visibility: string
    observedAt: string
    isNearestStationWeather: boolean
    nearestStationName?: string
  }
}

export interface CargoSummaryStats {
  inTransit: number
  delayed: number
  weatherHold: number
  completed: number
  totalToday: number
}

/**
 * Reusable Weather Suitability Evaluation Engine
 * Configurable thresholds based on polar operational safety guidelines.
 */
export function getWeatherSuitability(weather?: {
  temperature?: number
  windSpeed?: number
  visibility?: string
}): WeatherEvaluation {
  if (!weather || weather.temperature === undefined || weather.windSpeed === undefined) {
    return {
      status: 'DATA_UNAVAILABLE',
      colorVariant: 'neutral',
      label: 'DATA UNAVAILABLE',
      reason: 'No current meteorological telemetry available for coordinates.',
      recommendation: 'Request satellite weather downlink before initiating traverse.',
      criteriaNote: 'Based on last available observation telemetry.',
    }
  }

  const { temperature, windSpeed } = weather

  // Unsafe: Wind > 40 knots (Katabatic gale / severe storm) OR Temp < -35°C
  if (windSpeed >= 40 || temperature <= -35) {
    return {
      status: 'UNSAFE',
      colorVariant: 'critical',
      label: 'UNSAFE',
      reason: `Severe conditions detected: Wind ${windSpeed.toFixed(1)} kt (Gale/Whiteout risk), Temp ${temperature.toFixed(1)}°C.`,
      recommendation: 'Suspend outdoor movement & ice-shelf traverse. Lock hatches and standby.',
      criteriaNote: 'Based on current wind speed, temperature and available weather observations.',
    }
  }

  // Caution: Wind 25 - 39 knots OR Temp -25°C to -35°C
  if (windSpeed >= 25 || temperature <= -25) {
    return {
      status: 'CAUTION',
      colorVariant: 'warning',
      label: 'CAUTION',
      reason: `Elevated wind speed (${windSpeed.toFixed(1)} kt) or severe sub-zero cold (${temperature.toFixed(1)}°C).`,
      recommendation: 'Traverse permitted with Dual-HF radio check and survival gear required.',
      criteriaNote: 'Based on current wind speed, temperature and available weather observations.',
    }
  }

  // Suitable: Normal conditions
  return {
    status: 'SUITABLE',
    colorVariant: 'operational',
    label: 'SUITABLE',
    reason: `Acceptable parameters: Wind ${windSpeed.toFixed(1)} kt, Temperature ${temperature.toFixed(1)}°C.`,
    recommendation: 'Movement conditions currently acceptable based on available weather observations.',
    criteriaNote: 'Based on current wind speed, temperature and available weather observations.',
  }
}

// -------------------------------------------------------------
// OPERATIONAL STATIONS DATA (Actual Antarctic Coordinates)
// -------------------------------------------------------------
const INITIAL_STATIONS: MapStation[] = [
  {
    id: 'Maitri',
    name: 'Maitri Research Base',
    country: 'India',
    type: 'Antarctic Permanent Research Station',
    coordinates: { lat: -70.7658, lng: 11.7358 },
    coordinatesFormatted: '70°45′57″ S, 11°44′09″ E',
    elevation: '117m MSL (Schirmacher Oasis)',
    status: 'Operational',
    weather: STATIONS_WEATHER_DATA.Maitri,
  },
  {
    id: 'Bharati',
    name: 'Bharati Research Base',
    country: 'India',
    type: 'Antarctic Permanent Research Station',
    coordinates: { lat: -69.4078, lng: 76.1872 },
    coordinatesFormatted: '69°24′28″ S, 76°11′14″ E',
    elevation: '35m MSL (Larsemann Hills, Prydz Bay)',
    status: 'Operational',
    weather: STATIONS_WEATHER_DATA.Bharati,
  },
]

// -------------------------------------------------------------
// ACTIVE EXPEDITIONS DATA
// -------------------------------------------------------------
const INITIAL_EXPEDITIONS: MapExpedition[] = [
  {
    id: 'EXP-2026-014',
    name: '44th Indian Scientific Expedition to Antarctica (ISEA)',
    vessel: 'MV Vasily Golovnin',
    vesselType: 'Ice-Classed Polar Supply Vessel / Cargo Carrier',
    leader: 'Dr. Rajesh Sharma (NCPOR)',
    origin: 'Cape Town Staging Port',
    destination: 'Prydz Bay / Bharati → Maitri Berth',
    status: 'In Transit',
    currentCoordinates: { lat: -56.45, lng: 42.18 }, // Southern Ocean en route
    lastKnownTimestamp: '2026-09-19 14:00 UTC',
    isLiveGps: false,
    eta: '14 Feb 2027',
    cargoCount: 224,
    weatherStatus: 'SUITABLE',
    routePoints: [
      { lat: -33.9249, lng: 18.4241 }, // Cape Town
      { lat: -44.5, lng: 28.2 },       // Roaring Forties
      { lat: -56.45, lng: 42.18 },     // Current Position (Southern Ocean)
      { lat: -64.2, lng: 60.5 },       // Sea Ice Margin
      { lat: -69.4078, lng: 76.1872 }, // Bharati Station (Larsemann Hills)
      { lat: -70.7658, lng: 11.7358 }, // Maitri Station
    ],
  },
]

// -------------------------------------------------------------
// DAILY ACTIVE CARGO MOVEMENTS
// -------------------------------------------------------------
const INITIAL_CARGO_MOVEMENTS: MapCargoMovement[] = [
  {
    id: 'CRG-2026-001',
    cargoType: 'Provisions & Food Supplies',
    description: 'Fresh & Freeze-Dried Wintering Food Modules (8x 20ft TEU)',
    weight: '24.5 MT',
    origin: 'Cape Town Staging Port',
    originCoordinates: { lat: -33.9249, lng: 18.4241 },
    destination: 'Bharati Station',
    destinationCoordinates: { lat: -69.4078, lng: 76.1872 },
    status: 'In Transit',
    currentCoordinates: { lat: -62.14, lng: 52.31 },
    lastKnownTimestamp: '2026-09-19 16:30 UTC',
    isLiveGps: false,
    eta: '18 Feb 2027',
    carrier: 'MV Vasily Golovnin',
    expeditionId: 'EXP-2026-014',
    priority: 'Critical',
    weather: {
      temperature: -16.4,
      windSpeed: 22.0,
      windDirection: 'SE',
      pressure: 981.0,
      visibility: '8.0 km',
      observedAt: '2026-09-19 16:00 UTC',
      isNearestStationWeather: false,
    },
  },
  {
    id: 'CRG-2026-002',
    cargoType: 'Machinery Spares & Power Gen',
    description: 'Cummins Generator Turbochargers & Arctic Lube Oil',
    weight: '14.2 MT',
    origin: 'Cape Town Staging Port',
    originCoordinates: { lat: -33.9249, lng: 18.4241 },
    destination: 'Maitri Station',
    destinationCoordinates: { lat: -70.7658, lng: 11.7358 },
    status: 'In Transit',
    currentCoordinates: { lat: -62.0, lng: 45.0 },
    lastKnownTimestamp: '2026-09-19 15:45 UTC',
    isLiveGps: false,
    eta: '20 Feb 2027',
    carrier: 'MV Vasily Golovnin',
    expeditionId: 'EXP-2026-014',
    priority: 'Critical',
    weather: {
      temperature: -21.0,
      windSpeed: 36.5,
      windDirection: 'ESE',
      pressure: 974.0,
      visibility: '3.2 km',
      observedAt: '2026-09-19 15:30 UTC',
      isNearestStationWeather: false,
    },
  },
  {
    id: 'CRG-2026-003',
    cargoType: 'Scientific Instrumentation',
    description: 'Deep Ice Core Drilling Rig & Cryospheric Spectrometers',
    weight: '8.6 MT',
    origin: 'Prydz Bay Anchorage',
    originCoordinates: { lat: -68.8, lng: 75.0 },
    destination: 'Bharati Station',
    destinationCoordinates: { lat: -69.4078, lng: 76.1872 },
    status: 'In Transit',
    currentCoordinates: { lat: -68.95, lng: 75.6 },
    lastKnownTimestamp: '2026-09-19 17:15 UTC',
    isLiveGps: false,
    eta: '16 Feb 2027',
    carrier: 'PistenBully 300 Polar Sledge #04',
    expeditionId: 'EXP-2026-014',
    priority: 'High',
    weather: {
      temperature: -13.8,
      windSpeed: 16.0,
      windDirection: 'E',
      pressure: 985.2,
      visibility: '10+ km',
      observedAt: '2026-09-19 17:00 UTC',
      isNearestStationWeather: true,
      nearestStationName: 'Bharati Weather AWS',
    },
  },
  {
    id: 'CRG-2026-004',
    cargoType: 'Structural & Habitat Insulation',
    description: 'Replacement Living Module Composite Panels',
    weight: '11.0 MT',
    origin: 'Cape Town Staging Port',
    originCoordinates: { lat: -33.9249, lng: 18.4241 },
    destination: 'Maitri Station',
    destinationCoordinates: { lat: -70.7658, lng: 11.7358 },
    status: 'Delayed',
    currentCoordinates: { lat: -48.5, lng: 26.3 },
    lastKnownTimestamp: '2026-09-19 12:00 UTC',
    isLiveGps: false,
    eta: '28 Feb 2027',
    carrier: 'Secondary Charter Feeder',
    expeditionId: 'EXP-2026-014',
    priority: 'Standard',
    weather: {
      temperature: -4.2,
      windSpeed: 28.0,
      windDirection: 'SW',
      pressure: 996.0,
      visibility: '6.0 km',
      observedAt: '2026-09-19 11:30 UTC',
      isNearestStationWeather: false,
    },
  },
]

import { fetchStationsList } from '@/services/stationsService'
import { fetchVesselsList } from '@/services/vesselsService'

// -------------------------------------------------------------
// SERVICE METHODS
// -------------------------------------------------------------
export async function getStations(): Promise<MapStation[]> {
  try {
    const apiStations = await fetchStationsList()
    if (apiStations && apiStations.length > 0) {
      return apiStations.map((st) => {
        const fallbackWeather: StationWeather = STATIONS_WEATHER_DATA[st.station_id] || {
          id: st.station_id,
          name: st.name,
          location: st.location,
          coordinates: st.coordinates,
          elevation: st.elevation || '100m MSL',
          temperature: -18.0,
          temperatureUnit: '°C',
          windChill: -30.0,
          pressure: 980.0,
          pressureUnit: 'hPa',
          pressureTrend: 'Steady',
          windSpeed: 20.0,
          windSpeedUnit: 'knots (37 km/h)',
          windDirection: 'East (090°)',
          windBearing: 90,
          relativeHumidity: 60,
          humidityUnit: '%',
          visibility: '10+ km (Unrestricted)',
          condition: 'Clear Polar Weather',
          blizzardStage: 'Stage 0 Normal',
          alertLevel: 'NOMINAL',
          statusVariant: 'operational',
          observationTime: '2026-09-17 18:00 UTC',
          sensorId: st.sensor_id || `NCPOR-AWS-${st.station_id.slice(0, 3).toUpperCase()}-01`,
        }

        return {
          id: st.station_id,
          name: st.name,
          country: st.country || 'India',
          type: st.station_type || 'Antarctic Permanent Research Station',
          coordinates: {
            lat: st.latitude !== null && st.latitude !== undefined ? Number(st.latitude) : -70.7658,
            lng: st.longitude !== null && st.longitude !== undefined ? Number(st.longitude) : 11.7358,
          },
          coordinatesFormatted: st.coordinates,
          elevation: st.elevation || '100m MSL',
          status: (st.status as MapStation['status']) || 'Operational',
          weather: fallbackWeather,
        }
      })
    }
  } catch {
    // Fallback to static initial stations if network/auth fails
  }
  return INITIAL_STATIONS
}

export async function getActiveExpeditions(): Promise<MapExpedition[]> {
  try {
    const apiVessels = await fetchVesselsList()
    if (apiVessels && apiVessels.length > 0) {
      return apiVessels.map((v) => {
        let routePts: Coordinates[] = []
        if (v.route_points) {
          try {
            routePts = JSON.parse(v.route_points)
          } catch {
            routePts = []
          }
        }
        if (routePts.length === 0) {
          routePts = [
            {
              lat: v.latitude !== null && v.latitude !== undefined ? Number(v.latitude) : -56.45,
              lng: v.longitude !== null && v.longitude !== undefined ? Number(v.longitude) : 42.18,
            },
          ]
        }

        return {
          id: v.vessel_id,
          name: v.expedition_id ? `${v.name} (${v.expedition_id})` : v.name,
          vessel: v.name,
          vesselType: v.vessel_type || 'Ice-Classed Polar Supply Vessel / Cargo Carrier',
          leader: v.leader || 'Dr. Rajesh Sharma (NCPOR)',
          origin: v.origin,
          destination: v.destination,
          status: (v.status as MapExpedition['status']) || 'In Transit',
          currentCoordinates: {
            lat: v.latitude !== null && v.latitude !== undefined ? Number(v.latitude) : -56.45,
            lng: v.longitude !== null && v.longitude !== undefined ? Number(v.longitude) : 42.18,
          },
          lastKnownTimestamp: v.last_known_timestamp || 'Operational Telemetry',
          isLiveGps: v.is_live_gps ?? false,
          eta: v.eta || 'TBD',
          cargoCount: v.cargo_count ?? 0,
          routePoints: routePts,
          weatherStatus: (v.weather_status as WeatherSuitabilityStatus) || 'SUITABLE',
        }
      })
    }
  } catch {
    // Fallback to static initial expeditions if network/auth fails
  }
  return INITIAL_EXPEDITIONS
}

export async function getActiveCargoMovements(): Promise<MapCargoMovement[]> {
  // In production: return fetch('/api/cargo/active').then(res => res.json())
  return Promise.resolve(INITIAL_CARGO_MOVEMENTS)
}

export async function getCargoSummary(): Promise<CargoSummaryStats> {
  const all = INITIAL_CARGO_MOVEMENTS
  return Promise.resolve({
    inTransit: all.filter((c) => c.status === 'In Transit').length,
    delayed: all.filter((c) => c.status === 'Delayed').length,
    weatherHold: all.filter((c) => c.status === 'Weather Hold').length,
    completed: 8, // historical completed shipments this season
    totalToday: all.length,
  })
}
