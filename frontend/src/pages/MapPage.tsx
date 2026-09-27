import React, { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Navigation,
  Compass,
  Package,
  Thermometer,
  Wind,
  RefreshCw,
  Layers,
  Maximize2,
  Minimize2,
  Radio,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowRight,
  Ship,
  Plus,
  Database,
  AlertCircle,
  X,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@/components/ui'
import { useOperational } from '@/context/OperationalContext'
import {
  getStations,
  getActiveExpeditions,
  getActiveCargoMovements,
  getCargoSummary,
  getWeatherSuitability,
  type MapStation,
  type MapExpedition,
  type MapCargoMovement,
  type CargoSummaryStats,
} from '@/services/mapService'
import { createVessel, type VesselApiPayload } from '@/services/vesselsService'
import { cn } from '@/lib/utils'

// Initial Antarctica map bounds & center
const ANTARCTIC_CENTER: [number, number] = [-68.5, 45.0]
const DEFAULT_ZOOM = 3

// Clean, reliable OpenStreetMap basemap providers (Free & open, zero API keys required, zero watermarks)
const TILE_LAYERS = {
  osmDark: {
    name: 'Polar Dark GIS',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    isDark: true,
  },
  osmStandard: {
    name: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    isDark: false,
  },
}

export const MapPage: React.FC = () => {
  const { theme, currentRole } = useOperational()
  const isAdmin = currentRole === 'ADMIN'

  // Map Container Ref & Instance
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  // Data States
  const [stations, setStations] = useState<MapStation[]>([])
  const [expeditions, setExpeditions] = useState<MapExpedition[]>([])
  const [cargoMovements, setCargoMovements] = useState<MapCargoMovement[]>([])
  const [cargoSummary, setCargoSummary] = useState<CargoSummaryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Register Vessel / Movement Modal States
  const [isAddVesselOpen, setIsAddVesselOpen] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<VesselApiPayload>({
    name: '',
    vesselType: 'Ice-Classed Polar Supply Vessel / Cargo Carrier',
    expeditionId: 'EXP-2026-014',
    callSign: '',
    imoNumber: '',
    flag: 'Cyprus (Chartered India)',
    captain: '',
    leader: 'Dr. Rajesh Sharma (NCPOR)',
    origin: 'Cape Town Staging Port',
    destination: 'Prydz Bay / Bharati → Maitri Berth',
    status: 'In Transit',
    latitude: -56.45,
    longitude: 42.18,
    heading: '145° SE',
    speedKnots: 14.2,
    iceClass: 'Arc7 Polar Icebreaker / DNV ICE-1A Super',
    cargoCount: 224,
    eta: '14 Feb 2027',
    lastKnownTimestamp: 'Operational Telemetry',
    isLiveGps: false,
    weatherStatus: 'SUITABLE',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Selection & UI States
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [selectedExpeditionId, setSelectedExpeditionId] = useState<string | null>(null)
  const [selectedCargoId, setSelectedCargoId] = useState<string | null>('CRG-2026-001')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTileLayer, setActiveTileLayer] = useState<keyof typeof TILE_LAYERS>(
    theme === 'dark' ? 'osmDark' : 'osmStandard'
  )
  const [showRoutes, setShowRoutes] = useState(true)

  // Sync activeTileLayer with theme
  useEffect(() => {
    setActiveTileLayer(theme === 'dark' ? 'osmDark' : 'osmStandard')
  }, [theme])

  // Filters
  const [stationFilter, setStationFilter] = useState<string>('ALL')
  const [expeditionFilter, setExpeditionFilter] = useState<string>('ALL')
  const [cargoStatusFilter, setCargoStatusFilter] = useState<string>('ALL')
  const [weatherSuitabilityFilter, setWeatherSuitabilityFilter] = useState<string>('ALL')

  // Load Data
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [stData, expData, crgData, summary] = await Promise.all([
        getStations(),
        getActiveExpeditions(),
        getActiveCargoMovements(),
        getCargoSummary(),
      ])
      setStations(stData)
      setExpeditions(expData)
      setCargoMovements(crgData)
      setCargoSummary(summary)
    } catch (err) {
      console.error('Error loading polar map data', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateVesselSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Vessel / carrier name is required'
    if (!formData.origin.trim()) errors.origin = 'Origin port/staging base is required'
    if (!formData.destination.trim()) errors.destination = 'Destination station/berth is required'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormSubmitting(true)
    try {
      const res = await createVessel(formData)
      setFormSuccess(`Vessel '${res.name}' successfully registered in database!`)
      await loadData()
      setTimeout(() => {
        setIsAddVesselOpen(false)
        setFormSuccess(null)
        setFormData({
          name: '',
          vesselType: 'Ice-Classed Polar Supply Vessel / Cargo Carrier',
          expeditionId: 'EXP-2026-014',
          callSign: '',
          imoNumber: '',
          flag: 'Cyprus (Chartered India)',
          captain: '',
          leader: 'Dr. Rajesh Sharma (NCPOR)',
          origin: 'Cape Town Staging Port',
          destination: 'Prydz Bay / Bharati → Maitri Berth',
          status: 'In Transit',
          latitude: -56.45,
          longitude: 42.18,
          heading: '145° SE',
          speedKnots: 14.2,
          iceClass: 'Arc7 Polar Icebreaker / DNV ICE-1A Super',
          cargoCount: 224,
          eta: '14 Feb 2027',
          lastKnownTimestamp: 'Operational Telemetry',
          isLiveGps: false,
          weatherStatus: 'SUITABLE',
          notes: '',
        })
      }, 1200)
    } catch (err: any) {
      setFormError(err.message || 'Failed to save vessel to PostgreSQL database.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Filtered Lists
  const filteredStations = useMemo(() => {
    if (stationFilter === 'ALL') return stations
    return stations.filter((s) => s.id === stationFilter)
  }, [stations, stationFilter])

  const filteredExpeditions = useMemo(() => {
    if (expeditionFilter === 'ALL') return expeditions
    return expeditions.filter((e) => e.id === expeditionFilter)
  }, [expeditions, expeditionFilter])

  const filteredCargo = useMemo(() => {
    return cargoMovements.filter((c) => {
      if (cargoStatusFilter !== 'ALL' && c.status !== cargoStatusFilter) return false
      if (weatherSuitabilityFilter !== 'ALL') {
        const suit = getWeatherSuitability(c.weather)
        if (suit.status !== weatherSuitabilityFilter) return false
      }
      return true
    })
  }, [cargoMovements, cargoStatusFilter, weatherSuitabilityFilter])

  // Currently Selected Objects
  const selectedCargo = useMemo(() => {
    return cargoMovements.find((c) => c.id === selectedCargoId) || null
  }, [cargoMovements, selectedCargoId])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: ANTARCTIC_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 2,
        maxZoom: 10,
        worldCopyJump: false,
        attributionControl: false,
      })

      // Add default clean tile layer
      L.tileLayer(TILE_LAYERS[activeTileLayer].url, {
        maxZoom: 18,
        attribution: TILE_LAYERS[activeTileLayer].attribution,
      }).addTo(map)

      // LayerGroup for dynamic markers & routes
      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Switch Tile Layers when activeTileLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer)
      }
    })
    L.tileLayer(TILE_LAYERS[activeTileLayer].url, {
      maxZoom: 18,
      attribution: TILE_LAYERS[activeTileLayer].attribution,
    }).addTo(mapInstanceRef.current)
  }, [activeTileLayer])

  // Render Markers, Routes, and Overlays onto the Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()

    // -------------------------------------------------------------
    // 1. RENDER EXPEDITION ROUTES & SHIPS
    // -------------------------------------------------------------
    if (showRoutes) {
      filteredExpeditions.forEach((exp) => {
        const latLngs: [number, number][] = exp.routePoints.map((p) => [p.lat, p.lng])

        // Main Route Polyline
        const polyline = L.polyline(latLngs, {
          color: '#28B6FF', // Sky Blue
          weight: 3,
          opacity: 0.9,
          dashArray: '6, 6',
        }).addTo(layerGroup)

        polyline.bindTooltip(
          `<strong>${exp.vessel}</strong><br/>Route: ${exp.origin} → ${exp.destination}`,
          { className: 'tabular-code text-xs' }
        )

        // Vessel / Ship Marker
        const shipIcon = L.divIcon({
          className: 'custom-ship-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full bg-[#169FE5]/40 animate-ping"></span>
              <div class="w-8 h-8 rounded-full bg-[#0E7490] border-2 border-white shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const shipMarker = L.marker([exp.currentCoordinates.lat, exp.currentCoordinates.lng], {
          icon: shipIcon,
        }).addTo(layerGroup)

        shipMarker.bindPopup(`
          <div class="p-1.5 min-w-[230px] font-sans text-xs space-y-1.5">
            <div class="font-bold flex items-center justify-between border-b pb-1">
              <span>🚢 ${exp.vessel}</span>
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold bg-sky-100 text-sky-800">${exp.status}</span>
            </div>
            <div class="text-[11px] space-y-0.5">
              <div><strong>Expedition:</strong> ${exp.id}</div>
              <div><strong>Route:</strong> ${exp.origin} → ${exp.destination}</div>
              <div><strong>ETA:</strong> ${exp.eta}</div>
              <div><strong>Cargo Stowed:</strong> ${exp.cargoCount} TEUs</div>
            </div>
            <div class="pt-1 text-[10px] font-mono opacity-70">
              Position: ${exp.currentCoordinates.lat.toFixed(2)}° S, ${exp.currentCoordinates.lng.toFixed(2)}° E
            </div>
          </div>
        `)

        shipMarker.on('click', () => {
          setSelectedExpeditionId(exp.id)
          setSelectedCargoId(null)
          setSelectedStationId(null)
        })
      })
    }

    // -------------------------------------------------------------
    // 2. RENDER STATIONS (Maitri & Bharati)
    // -------------------------------------------------------------
    filteredStations.forEach((station) => {
      const stationIcon = L.divIcon({
        className: 'custom-station-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer group">
            <div class="w-9 h-9 rounded-md bg-[#0C4E61] border-2 border-cyan-300 shadow-xl flex items-center justify-center text-cyan-200 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            </div>
            <div class="mt-1 px-1.5 py-0.5 bg-[#070B0D] text-[#F5F7F8] rounded text-[10px] font-mono whitespace-nowrap shadow-md border border-[#263238]">
              📍 ${station.name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 25],
      })

      const stMarker = L.marker([station.coordinates.lat, station.coordinates.lng], {
        icon: stationIcon,
      }).addTo(layerGroup)

      const w = station.weather
      stMarker.bindPopup(`
        <div class="p-1.5 min-w-[240px] font-sans text-xs space-y-2">
          <div class="border-b pb-1.5 flex items-center justify-between">
            <div>
              <div class="font-bold">${station.name}</div>
              <div class="text-[10px] opacity-80">${station.country} · ${station.elevation}</div>
            </div>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
              w.alertLevel === 'NOMINAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }">
              ${w.alertLevel}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] font-mono p-2 rounded border border-current/10">
            <div>
              <span class="opacity-70 block text-[9px] uppercase">Temperature</span>
              <strong>${w.temperature}°C</strong>
              <span class="text-[10px] opacity-75"> (WC: ${w.windChill}°C)</span>
            </div>
            <div>
              <span class="opacity-70 block text-[9px] uppercase">Wind (reference)</span>
              <strong>${w.windSpeed} kt</strong>
              <span class="text-[10px] opacity-75"> ${w.windDirection}</span>
            </div>
            <div>
              <span class="opacity-70 block text-[9px] uppercase">Barometer</span>
              <strong>${w.pressure} hPa</strong>
            </div>
            <div>
              <span class="opacity-70 block text-[9px] uppercase">Visibility</span>
              <strong class="truncate">${w.visibility.split(' ')[0]}</strong>
            </div>
          </div>

          <div class="text-[10px] opacity-70 flex items-center justify-between font-mono">
              <span>Fixture observation: ${w.observationTime.split(' ')[1] || 'Time unavailable'}</span>
            <span>Sensor: ${w.sensorId}</span>
          </div>
        </div>
      `)

      stMarker.on('click', () => {
        setSelectedStationId(station.id)
        setSelectedCargoId(null)
        setSelectedExpeditionId(null)
      })
    })

    // -------------------------------------------------------------
    // 3. RENDER ACTIVE CARGO SHIPMENTS & THEIR PATHWAYS
    // -------------------------------------------------------------
    filteredCargo.forEach((cargo) => {
      const isSelected = selectedCargoId === cargo.id
      const suitability = getWeatherSuitability(cargo.weather)

      const statusColors = {
        SUITABLE: '#16C784',        // Success Green
        CAUTION: '#FFD21C',         // Caution Yellow
        UNSAFE: '#FF3038',          // Critical Red
        DATA_UNAVAILABLE: '#6F7C82', // Slate
      }
      const markerColor = statusColors[suitability.status]

      // Highlight route if cargo is selected
      if (isSelected && showRoutes) {
        const cargoPath = [
          [cargo.originCoordinates.lat, cargo.originCoordinates.lng],
          [cargo.currentCoordinates.lat, cargo.currentCoordinates.lng],
          [cargo.destinationCoordinates.lat, cargo.destinationCoordinates.lng],
        ] as [number, number][]

        L.polyline(cargoPath, {
          color: markerColor,
          weight: 3.5,
          opacity: 0.9,
          dashArray: '4, 4',
        }).addTo(layerGroup)
      }

      // Cargo Marker
      const cargoIcon = L.divIcon({
        className: 'custom-cargo-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'} transition-transform">
            ${isSelected ? `<span class="absolute w-7 h-7 rounded-full animate-ping" style="background-color: ${markerColor}44"></span>` : ''}
            <div class="w-7 h-7 rounded bg-[#11191D] border-2 shadow-md flex items-center justify-center" style="border-color: ${markerColor}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${markerColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z"/><path d="M21 12 7.5 4.2"/><path d="M21 12v7.5a1.5 1.5 0 0 1-1.5 1.5H12"/></svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const cargoMarker = L.marker([cargo.currentCoordinates.lat, cargo.currentCoordinates.lng], {
        icon: cargoIcon,
      }).addTo(layerGroup)

      cargoMarker.bindPopup(`
        <div class="p-1.5 min-w-[250px] font-sans text-xs space-y-1.5">
          <div class="flex items-center justify-between border-b pb-1">
            <span class="font-bold">📦 ${cargo.id}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase" style="background-color: ${markerColor}22; color: ${markerColor}">
              ${suitability.label}
            </span>
          </div>
          <div class="text-[11px] space-y-0.5">
            <div><strong>Type:</strong> ${cargo.cargoType}</div>
            <div><strong>Origin:</strong> ${cargo.origin}</div>
            <div><strong>Destination:</strong> ${cargo.destination}</div>
            <div><strong>ETA:</strong> ${cargo.eta}</div>
          </div>
          <div class="p-1.5 rounded text-[10px] font-mono border border-current/10">
            <div>Temp: ${cargo.weather.temperature}°C · Wind: ${cargo.weather.windSpeed} kt ${cargo.weather.windDirection}</div>
            <div class="opacity-70 mt-0.5">Barometer: ${cargo.weather.pressure} hPa</div>
          </div>
          <div class="text-[9px] opacity-70 font-mono flex items-center justify-between pt-1">
            <span>Last known location</span>
            <span>${cargo.lastKnownTimestamp.split(' ')[1]}</span>
          </div>
        </div>
      `)

      cargoMarker.on('click', () => {
        setSelectedCargoId(cargo.id)
        setSelectedExpeditionId(null)
        setSelectedStationId(null)
      })
    })
  }, [
    filteredStations,
    filteredExpeditions,
    filteredCargo,
    selectedCargoId,
    selectedExpeditionId,
    selectedStationId,
    showRoutes,
  ])

  // Center on Selected Cargo
  const centerOnCargo = (cargo: MapCargoMovement) => {
    setSelectedCargoId(cargo.id)
    setSelectedExpeditionId(null)
    setSelectedStationId(null)
    mapInstanceRef.current?.setView([cargo.currentCoordinates.lat, cargo.currentCoordinates.lng], 5, {
      animate: true,
    })
  }

  // Center on Active Expedition
  const centerOnExpedition = (exp: MapExpedition) => {
    setSelectedExpeditionId(exp.id)
    setSelectedCargoId(null)
    setSelectedStationId(null)
    mapInstanceRef.current?.setView([exp.currentCoordinates.lat, exp.currentCoordinates.lng], 4.5, {
      animate: true,
    })
  }

  // Center on Station
  const centerOnStation = (station: MapStation) => {
    setSelectedStationId(station.id)
    setSelectedCargoId(null)
    setSelectedExpeditionId(null)
    mapInstanceRef.current?.setView([station.coordinates.lat, station.coordinates.lng], 6, {
      animate: true,
    })
  }

  // Reset Map View
  const resetMapView = () => {
    mapInstanceRef.current?.setView(ANTARCTIC_CENTER, DEFAULT_ZOOM, {
      animate: true,
    })
  }

  const isDarkLayer = TILE_LAYERS[activeTileLayer]?.isDark || theme === 'dark'

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-[#263238]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-slate-900 dark:text-[#F5F7F8] tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#02457A] dark:text-[#FFD21C]" />
              Geospatial Map & Vessel Tracking
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Database className="w-3 h-3" />
              PostgreSQL Connected · {expeditions.length} Vessels · {stations.length} Bases
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A7B2B8] mt-0.5 font-normal">
            Persistent vessel registries & research stations in PostgreSQL. Positions represent operational voyage telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <Button
              variant="primary"
              size="xs"
              onClick={() => setIsAddVesselOpen(true)}
              iconLeft={<Plus className="w-3.5 h-3.5" />}
            >
              Register Vessel / Carrier
            </Button>
          )}

          <Button
            variant="outline"
            size="xs"
            onClick={resetMapView}
            iconLeft={<Compass className="w-3.5 h-3.5" />}
          >
            Reset Polar View
          </Button>

          <Button
            variant="secondary"
            size="xs"
            onClick={loadData}
            isLoading={isLoading}
            iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reload Reference Data
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: DAILY ACTIVE CARGO MOVEMENTS KPI SUMMARY         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Stat 1: Active Cargo In Transit */}
        <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] border-l-4 border-l-[#02457A] dark:border-l-[#169FE5] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase tracking-wider font-mono">
            <span>Cargo In Transit</span>
            <Package className="w-3.5 h-3.5 text-[#02457A] dark:text-[#169FE5]" />
          </div>
          <div className="text-2xl font-bold mt-1 font-mono text-slate-900 dark:text-[#F5F7F8]">
            {cargoSummary?.inTransit ?? 3}
          </div>
          <div className="text-[11px] text-[#02457A] dark:text-[#169FE5] font-semibold mt-0.5">
            Tracked on Polar Route
          </div>
        </div>

        {/* Stat 2: Delayed / Ice Hold */}
        <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] border-l-4 border-l-amber-500 dark:border-l-[#FFD21C] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase tracking-wider font-mono">
            <span>Delayed / Ice Hold</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-[#FFD21C]" />
          </div>
          <div className="text-2xl font-bold text-amber-900 dark:text-[#FFD21C] mt-1 font-mono">
            {cargoSummary?.delayed ?? 1}
          </div>
          <div className="text-[11px] text-amber-800 dark:text-[#FFD21C]/90 font-semibold mt-0.5">
            Pack Ice Margin Hold
          </div>
        </div>

        {/* Stat 3: Weather Restraints */}
        <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase tracking-wider font-mono">
            <span>Weather Restraints</span>
            <Wind className="w-3.5 h-3.5 text-slate-400 dark:text-[#6F7C82]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-[#F5F7F8] mt-1 font-mono">
            {cargoSummary?.weatherHold ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#6F7C82] font-mono mt-0.5">
            Gale Holds: Nil
          </div>
        </div>

        {/* Stat 4: Completed Consignments */}
        <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase tracking-wider font-mono">
            <span>Completed Consignments</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#16C784]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-[#F5F7F8] mt-1 font-mono">
            {cargoSummary?.completed ?? 8}
          </div>
          <div className="text-[11px] text-emerald-800 dark:text-[#16C784] font-mono mt-0.5">
            Season 2026–27 Total
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: OPERATIONAL FILTERS BAR                          */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-slate-700 dark:text-[#F5F7F8] flex items-center gap-1 font-mono text-[11px] uppercase">
            <Filter className="w-3.5 h-3.5 text-[#02457A] dark:text-[#FFD21C]" />
            Filters:
          </span>

          {/* Station Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="station-filter" className="text-slate-500 dark:text-[#A7B2B8] font-mono text-[11px]">
              Station:
            </label>
            <select
              id="station-filter"
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-800 dark:text-[#F5F7F8] font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 dark:focus:ring-[#FFD21C]/30 focus:border-[#02457A] dark:focus:border-[#FFD21C]"
            >
              <option value="ALL">All Stations</option>
              <option value="Maitri">Maitri Base (70°45′S)</option>
              <option value="Bharati">Bharati Base (69°24′S)</option>
            </select>
          </div>

          {/* Expedition Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="expedition-filter" className="text-slate-500 dark:text-[#A7B2B8] font-mono text-[11px]">
              Expedition:
            </label>
            <select
              id="expedition-filter"
              value={expeditionFilter}
              onChange={(e) => setExpeditionFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-800 dark:text-[#F5F7F8] font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 dark:focus:ring-[#FFD21C]/30 focus:border-[#02457A] dark:focus:border-[#FFD21C]"
            >
              <option value="ALL">All Expeditions</option>
              <option value="EXP-2026-014">44th ISEA (MV Vasily Golovnin)</option>
            </select>
          </div>

          {/* Cargo Status Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="cargo-filter" className="text-slate-500 dark:text-[#A7B2B8] font-mono text-[11px]">
              Cargo:
            </label>
            <select
              id="cargo-filter"
              value={cargoStatusFilter}
              onChange={(e) => setCargoStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-800 dark:text-[#F5F7F8] font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 dark:focus:ring-[#FFD21C]/30 focus:border-[#02457A] dark:focus:border-[#FFD21C]"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Delayed">Delayed</option>
              <option value="Weather Hold">Weather Hold</option>
            </select>
          </div>

          {/* Weather Suitability Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="suitability-filter" className="text-slate-500 dark:text-[#A7B2B8] font-mono text-[11px]">
              Suitability:
            </label>
            <select
              id="suitability-filter"
              value={weatherSuitabilityFilter}
              onChange={(e) => setWeatherSuitabilityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-800 dark:text-[#F5F7F8] font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 dark:focus:ring-[#FFD21C]/30 focus:border-[#02457A] dark:focus:border-[#FFD21C]"
            >
              <option value="ALL">All Conditions</option>
              <option value="SUITABLE">🟢 Suitable</option>
              <option value="CAUTION">🟡 Caution</option>
              <option value="UNSAFE">🔴 Unsafe</option>
            </select>
          </div>
        </div>

        {/* Layer Toggles & Map Style */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRoutes(!showRoutes)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer',
              showRoutes
                ? 'bg-sky-50 dark:bg-[#0B253D] text-sky-800 dark:text-[#28B6FF] border-sky-300 dark:border-[rgba(40,182,255,0.3)]'
                : 'bg-white dark:bg-[#0A0E10] text-slate-600 dark:text-[#A7B2B8] border-slate-300 dark:border-[#263238] hover:bg-slate-50 dark:hover:bg-[#11191D]'
            )}
          >
            <Navigation className="w-3 h-3" />
            <span>Routes</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTileLayer(activeTileLayer === 'osmDark' ? 'osmStandard' : 'osmDark')
            }
            className="px-2.5 py-1 rounded text-xs font-medium bg-white dark:bg-[#0A0E10] text-slate-700 dark:text-[#F5F7F8] border border-slate-300 dark:border-[#263238] hover:bg-slate-50 dark:hover:bg-[#11191D] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3 h-3 text-slate-500 dark:text-[#FFD21C]" />
            <span>{activeTileLayer === 'osmDark' ? 'Polar Dark Map' : 'OSM Standard'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-600 dark:text-[#A7B2B8] hover:text-slate-900 dark:hover:text-[#F5F7F8] border border-slate-300 dark:border-[#263238] rounded hover:bg-slate-50 dark:hover:bg-[#11191D] cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN MAP CONTAINER + INTERACTIVE OVERLAYS                 */}
      {/* ========================================================= */}
      <div
        className={cn(
          'relative bg-[#070B0D] rounded-lg overflow-hidden border border-slate-300 dark:border-[#263238] shadow-sm transition-all',
          isFullscreen ? 'fixed inset-4 z-50 rounded-xl' : 'h-[540px] w-full',
          isDarkLayer && 'polar-dark-map'
        )}
      >
        {/* Leaflet DOM Anchor */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Map Legend Overlay */}
        <div className="absolute top-3 right-3 z-10 bg-slate-950/90 dark:bg-[#070B0D]/95 backdrop-blur-xs border border-slate-700 dark:border-[#263238] rounded-md p-3 text-[11px] font-sans text-slate-200 dark:text-[#F5F7F8] space-y-2.5 shadow-2xl max-w-[215px] pointer-events-auto">
          <div>
            <div className="font-bold text-white dark:text-[#F5F7F8] text-[10px] uppercase tracking-wider font-mono border-b border-slate-700 dark:border-[#263238] pb-1 flex items-center justify-between">
              <span>Weather Suitability</span>
              <Radio className="w-3 h-3 text-[#169FE5]" />
            </div>
            <div className="space-y-1 mt-1.5 font-mono text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16C784]" />
                <span className="text-slate-200 dark:text-[#F5F7F8]">Suitable (Gale &lt; 25 kt)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FFD21C]" />
                <span className="text-slate-200 dark:text-[#F5F7F8]">Caution (25–39 kt)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF3038]" />
                <span className="text-slate-200 dark:text-[#F5F7F8]">Unsafe (Wind ≥ 40 kt)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-[#6F7C82]">
                <span className="w-2 h-2 rounded-full bg-[#6F7C82]" />
                <span>Data Unavailable</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 dark:border-[#263238] pt-1.5">
            <div className="font-bold text-white dark:text-[#F5F7F8] text-[10px] uppercase tracking-wider font-mono pb-1">
              Markers & Routes
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#0C4E61] border border-cyan-300" />
                <span className="text-slate-200 dark:text-[#F5F7F8]">Research Station</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0E7490] border border-white" />
                <span className="text-slate-200 dark:text-[#F5F7F8]">Expedition Vessel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#11191D] border border-slate-400" />
                <span className="text-slate-200 dark:text-[#F5F7F8]">Active Cargo Unit</span>
              </div>
              <div className="flex items-center gap-1.5 text-sky-300">
                <span className="w-4 h-0.5 bg-[#28B6FF] border-dashed" />
                <span>Planned Maritime Route</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Map Floating Controls */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2">
          {expeditions[0] && (
            <button
              type="button"
              onClick={() => centerOnExpedition(expeditions[0])}
              className="px-3 py-1.5 rounded bg-slate-900/90 dark:bg-[#0D1316]/95 hover:bg-slate-950 dark:hover:bg-[#11191D] text-white dark:text-[#F5F7F8] text-xs font-medium border border-slate-700 dark:border-[#263238] shadow-md backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Ship className="w-3.5 h-3.5 text-sky-400 dark:text-[#28B6FF]" />
              <span>Center on Vessel ({expeditions[0].vessel})</span>
            </button>
          )}

          {stations.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => centerOnStation(st)}
              className="px-2.5 py-1.5 rounded bg-slate-900/80 dark:bg-[#0D1316]/90 hover:bg-slate-950 dark:hover:bg-[#11191D] text-slate-200 dark:text-[#F5F7F8] text-xs font-mono border border-slate-700 dark:border-[#263238] shadow-md backdrop-blur-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{st.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* LOWER SPLIT: ACTIVE CARGO TRACKING + SELECTED DETAILS     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Active Cargo Movement Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#F5F7F8] flex items-center gap-2 font-sans">
              <Package className="w-4 h-4 text-[#02457A] dark:text-[#169FE5]" />
              Active Daily Cargo Movements ({filteredCargo.length})
            </h2>
            <span className="text-xs text-slate-500 dark:text-[#A7B2B8] font-mono">
              Click consignment to inspect its simulated position and reference weather
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCargo.map((cargo) => {
              const isSelected = selectedCargoId === cargo.id
              const suitability = getWeatherSuitability(cargo.weather)

              return (
                <div
                  key={cargo.id}
                  onClick={() => centerOnCargo(cargo)}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between space-y-3 group',
                    isSelected
                      ? 'bg-slate-50/50 dark:bg-[#11191D] border-[#02457A] dark:border-[#169FE5] ring-2 ring-[#02457A]/15 dark:ring-[#169FE5]/25 shadow-sm'
                      : 'bg-white dark:bg-[#0D1316] border-slate-200 dark:border-[#263238] hover:border-slate-300 dark:hover:border-[#37474F] shadow-xs'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-[#F5F7F8] font-mono">
                          {cargo.id}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase',
                            cargo.priority === 'Critical' &&
                              'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-[#381115] dark:text-[#FF3038] dark:border-[#FF3038]/40',
                            cargo.priority === 'High' &&
                              'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-[#332608] dark:text-[#FFD21C] dark:border-[#FFD21C]/40',
                            cargo.priority === 'Standard' &&
                              'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#11191D] dark:text-[#A7B2B8] dark:border-[#263238]'
                          )}
                        >
                          {cargo.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-[#A7B2B8] font-medium mt-1 leading-snug">
                        {cargo.description}
                      </p>
                    </div>

                    {/* Weather Suitability Badge */}
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase shrink-0 flex items-center gap-1',
                        suitability.status === 'SUITABLE' &&
                          'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-[#0E3827] dark:text-[#16C784] dark:border-[#16C784]/40',
                        suitability.status === 'CAUTION' &&
                          'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-[#332608] dark:text-[#FFD21C] dark:border-[#FFD21C]/40',
                        suitability.status === 'UNSAFE' &&
                          'bg-rose-50 text-rose-800 border border-rose-300 dark:bg-[#381115] dark:text-[#FF3038] dark:border-[#FF3038]/40',
                        suitability.status === 'DATA_UNAVAILABLE' &&
                          'bg-slate-100 text-slate-700 dark:bg-[#11191D] dark:text-[#6F7C82]'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          suitability.status === 'SUITABLE' && 'bg-[#16C784]',
                          suitability.status === 'CAUTION' && 'bg-[#FFD21C]',
                          suitability.status === 'UNSAFE' && 'bg-[#FF3038]',
                          suitability.status === 'DATA_UNAVAILABLE' && 'bg-[#6F7C82]'
                        )}
                      />
                      {suitability.label}
                    </span>
                  </div>

                  {/* Route & Transport info */}
                  <div className="text-[11px] text-slate-600 dark:text-[#A7B2B8] space-y-1 pt-1 border-t border-slate-100 dark:border-[#263238]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-[#6F7C82]">Route:</span>
                      <span className="font-medium text-slate-800 dark:text-[#F5F7F8]">
                        {cargo.origin.split(' ')[0]} → {cargo.destination}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-[#6F7C82]">Carrier:</span>
                      <span className="font-mono text-slate-700 dark:text-[#A7B2B8]">{cargo.carrier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-[#6F7C82]">ETA:</span>
                      <span className="font-mono text-slate-800 dark:text-[#F5F7F8] font-semibold">{cargo.eta}</span>
                    </div>
                  </div>

                  {/* Location Weather Snippet */}
                  <div className="p-2 bg-slate-50 dark:bg-[#080C0E] border border-slate-200 dark:border-[#263238] rounded-md text-[11px] font-mono flex items-center justify-between text-slate-700 dark:text-[#A7B2B8]">
                    <div className="flex items-center gap-1 text-[#02457A] dark:text-[#169FE5] font-semibold">
                      <Thermometer className="w-3 h-3 text-[#02457A] dark:text-[#169FE5]" />
                      <span>{cargo.weather.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 dark:text-[#A7B2B8]">
                      <Wind className="w-3 h-3 text-[#02457A] dark:text-[#169FE5]" />
                      <span>{cargo.weather.windSpeed} kt {cargo.weather.windDirection}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-[#6F7C82]">
                      {cargo.weather.isNearestStationWeather ? 'Station Weather Reference' : 'En Route Fixture'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 dark:text-[#6F7C82] font-mono">
                      Pos: {cargo.currentCoordinates.lat.toFixed(1)}°S, {cargo.currentCoordinates.lng.toFixed(1)}°E
                    </span>
                    <button
                      type="button"
                      className="text-xs text-[#02457A] dark:text-[#169FE5] hover:text-[#001B48] dark:hover:text-[#28B6FF] font-semibold flex items-center gap-1 group-hover:underline cursor-pointer"
                    >
                      <span>Track on Map</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Item Deep Telemetry & Weather Suitability Card */}
        <div className="space-y-4">
          {selectedCargo ? (
            <Card accent="info">
              <CardHeader className="pb-3 border-b border-slate-200 dark:border-[#263238] bg-slate-50/80 dark:bg-[#11191D] py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#02457A] dark:text-[#169FE5]">
                    Selected Consignment Reference Data
                  </span>
                  <Badge
                    variant={
                      getWeatherSuitability(selectedCargo.weather).colorVariant as
                        | 'operational'
                        | 'warning'
                        | 'critical'
                        | 'neutral'
                    }
                    size="sm"
                  >
                    {selectedCargo.status}
                  </Badge>
                </div>
                <CardTitle className="text-base text-slate-900 dark:text-[#F5F7F8] mt-1 font-bold">
                  {selectedCargo.id}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-[#A7B2B8]">
                  {selectedCargo.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs font-sans">
                {/* Weather Suitability Hero Box */}
                {(() => {
                  const evalResult = getWeatherSuitability(selectedCargo.weather)
                  return (
                    <div
                      className={cn(
                        'p-3.5 rounded-lg border space-y-1.5',
                        evalResult.status === 'SUITABLE' &&
                          'bg-slate-50 dark:bg-[#0E3827]/40 border-slate-300 dark:border-[#16C784]/40 text-slate-800 dark:text-[#F5F7F8]',
                        evalResult.status === 'CAUTION' &&
                          'bg-amber-50/70 dark:bg-[#332608]/60 border-amber-300 dark:border-[#FFD21C]/40 text-amber-950 dark:text-[#FFD21C]',
                        evalResult.status === 'UNSAFE' &&
                          'bg-rose-50/70 dark:bg-[#381115]/60 border-rose-300 dark:border-[#FF3038]/40 text-rose-950 dark:text-[#FF3038]',
                        evalResult.status === 'DATA_UNAVAILABLE' &&
                          'bg-slate-50 dark:bg-[#11191D] border-slate-300 dark:border-[#263238] text-slate-900 dark:text-[#F5F7F8]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-mono">
                          {evalResult.status === 'SUITABLE' && <CheckCircle2 className="w-4 h-4 text-[#16C784]" />}
                          {evalResult.status === 'CAUTION' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-[#FFD21C]" />}
                          {evalResult.status === 'UNSAFE' && <XCircle className="w-4 h-4 text-rose-600 dark:text-[#FF3038]" />}
                          WEATHER SUITABILITY: {evalResult.label}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed font-normal">
                        {evalResult.reason}
                      </p>
                      <div className="text-[11px] font-medium pt-1 border-t border-slate-200/60 dark:border-[#263238]">
                        <strong>Recommendation:</strong> {evalResult.recommendation}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-[#A7B2B8] font-normal italic pt-0.5">
                        {evalResult.criteriaNote}
                      </div>
                    </div>
                  )
                })()}

                {/* Weather Data Table at Location */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-[#6F7C82] flex items-center justify-between">
                    <span>Weather At Current Location</span>
                    <span>{selectedCargo.weather.observedAt.split(' ')[1]}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-[#080C0E] p-2.5 rounded-lg border border-slate-200 dark:border-[#263238] font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-[#6F7C82] block uppercase font-bold">Temperature</span>
                      <strong className="text-slate-900 dark:text-[#F5F7F8] text-sm">
                        {selectedCargo.weather.temperature}°C
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-[#6F7C82] block uppercase font-bold">Wind Speed</span>
                      <strong className="text-slate-900 dark:text-[#F5F7F8] text-sm">
                        {selectedCargo.weather.windSpeed} kt {selectedCargo.weather.windDirection}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-[#6F7C82] block uppercase font-bold">Barometer</span>
                      <strong className="text-slate-800 dark:text-[#F5F7F8]">
                        {selectedCargo.weather.pressure} hPa
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-[#6F7C82] block uppercase font-bold">Visibility</span>
                      <strong className="text-slate-800 dark:text-[#F5F7F8]">
                        {selectedCargo.weather.visibility}
                      </strong>
                    </div>
                  </div>

                  {selectedCargo.weather.isNearestStationWeather && (
                    <div className="text-[10px] text-slate-500 dark:text-[#A7B2B8] flex items-center gap-1 font-mono italic">
                      <span>* Weather from nearest available station: {selectedCargo.weather.nearestStationName}</span>
                    </div>
                  )}
                </div>

                {/* Logistics Profile */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-[#6F7C82]">
                    Logistics Specifications
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-[#263238] text-xs">
                    <div className="py-1.5 flex justify-between">
                      <span className="text-slate-500 dark:text-[#A7B2B8]">Origin Port:</span>
                      <span className="font-semibold text-slate-800 dark:text-[#F5F7F8]">{selectedCargo.origin}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-slate-500 dark:text-[#A7B2B8]">Destination:</span>
                      <span className="font-semibold text-slate-800 dark:text-[#F5F7F8]">{selectedCargo.destination}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-slate-500 dark:text-[#A7B2B8]">Consignment Weight:</span>
                      <span className="font-mono text-slate-800 dark:text-[#F5F7F8]">{selectedCargo.weight}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-slate-500 dark:text-[#A7B2B8]">Assigned Carrier:</span>
                      <span className="font-mono text-slate-800 dark:text-[#F5F7F8]">{selectedCargo.carrier}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-slate-500 dark:text-[#A7B2B8]">Estimated Arrival:</span>
                      <span className="font-mono text-slate-900 dark:text-[#F5F7F8] font-bold">{selectedCargo.eta}</span>
                    </div>
                  </div>
                </div>

                {/* Location Tracking Timestamp */}
                <div className="p-2.5 bg-slate-50 dark:bg-[#080C0E] rounded-lg border border-slate-200 dark:border-[#263238] text-[10px] text-slate-500 dark:text-[#A7B2B8] font-mono space-y-1">
                  <div className="flex items-center justify-between text-slate-700 dark:text-[#F5F7F8]">
                    <span>Coordinates:</span>
                    <strong>
                      {selectedCargo.currentCoordinates.lat.toFixed(4)}° S, {selectedCargo.currentCoordinates.lng.toFixed(4)}° E
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Position Status:</span>
                    <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-[#11191D] text-slate-800 dark:text-[#A7B2B8] rounded font-semibold text-[9px]">
                      Last known location · {selectedCargo.lastKnownTimestamp}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => centerOnCargo(selectedCargo)}
                  >
                    Center on Cargo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-slate-400 dark:text-[#6F7C82] text-xs">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-[#263238]" />
                Select a station, cargo consignment, or vessel marker to inspect fixed coordinates, simulated positions, and reference weather suitability.
              </CardContent>
            </Card>
          )}

          {/* Research Station Telemetry Card */}
          <Card>
            <CardHeader className="py-2.5 px-4 bg-slate-50/80 dark:bg-[#11191D] border-b border-slate-200 dark:border-[#263238]">
              <CardTitle className="text-xs uppercase font-mono tracking-wider text-slate-700 dark:text-[#F5F7F8] font-bold">
                Permanent Antarctic Bases
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 text-xs">
              {stations.map((st) => (
                <div
                  key={st.id}
                  onClick={() => centerOnStation(st)}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-[#263238] bg-white dark:bg-[#0D1316] hover:border-[#02457A] dark:hover:border-[#169FE5] hover:bg-slate-50 dark:hover:bg-[#11191D] cursor-pointer transition-colors flex items-center justify-between font-mono"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-[#F5F7F8] flex items-center gap-1.5 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-[#02457A] dark:text-[#169FE5]" />
                      <span>{st.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#6F7C82] mt-0.5">
                      {st.coordinatesFormatted}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-[#F5F7F8]">{st.weather.temperature}°C</div>
                    <div className="text-[10px] text-slate-500 dark:text-[#A7B2B8]">{st.weather.windSpeed} kt</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: REGISTER POLAR VESSEL / CARRIER MOVEMENT           */}
      {/* ========================================================= */}
      {isAddVesselOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#263238] sticky top-0 bg-white dark:bg-[#0D1316] z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#02457A]/10 dark:bg-[#FFD21C]/10 flex items-center justify-center text-[#02457A] dark:text-[#FFD21C]">
                  <Ship className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-[#F5F7F8]">
                    Register Polar Vessel / Movement
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#A7B2B8]">
                    Persist transport carriers, icebreakers, ski-planes, or sledge convoys to PostgreSQL.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddVesselOpen(false)
                  setFormError(null)
                  setFormSuccess(null)
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-[#F5F7F8] hover:bg-slate-100 dark:hover:bg-[#11191D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVesselSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Vessel / Carrier Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MV Vasily Golovnin"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 ${
                      formErrors.name
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-300 dark:border-[#263238] focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.name}</p>
                  )}
                </div>

                {/* Vessel Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Carrier / Vessel Type
                  </label>
                  <select
                    value={formData.vesselType}
                    onChange={(e) => setFormData({ ...formData, vesselType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                  >
                    <option value="Ice-Classed Polar Supply Vessel / Cargo Carrier">Ice-Classed Polar Supply Vessel</option>
                    <option value="Polar Research & Supply Vessel">Polar Research & Supply Vessel</option>
                    <option value="Heavy Polar Icebreaker (Arc7)">Heavy Polar Icebreaker (Arc7)</option>
                    <option value="DROMLAN Polar Ski-Aircraft">DROMLAN Polar Ski-Aircraft</option>
                    <option value="Over-Ice Heavy Traverse Sledge Convoy">Over-Ice Heavy Traverse Sledge Convoy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Origin */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Origin Staging Port <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cape Town Staging Port"
                    value={formData.origin}
                    onChange={(e) => {
                      setFormData({ ...formData, origin: e.target.value })
                      if (formErrors.origin) setFormErrors({ ...formErrors, origin: '' })
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 ${
                      formErrors.origin
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-300 dark:border-[#263238] focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                    }`}
                  />
                  {formErrors.origin && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.origin}</p>
                  )}
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Destination Station / Berth <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prydz Bay / Bharati → Maitri Berth"
                    value={formData.destination}
                    onChange={(e) => {
                      setFormData({ ...formData, destination: e.target.value })
                      if (formErrors.destination) setFormErrors({ ...formErrors, destination: '' })
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 ${
                      formErrors.destination
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-300 dark:border-[#263238] focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                    }`}
                  />
                  {formErrors.destination && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.destination}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Latitude */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Latitude (° N/S)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. -56.4500"
                    value={formData.latitude ?? -56.45}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                  />
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Longitude (° E/W)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 42.1800"
                    value={formData.longitude ?? 42.18}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Voyage Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                  >
                    <option value="In Transit">In Transit</option>
                    <option value="At Station">At Station</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Weather Hold">Weather Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Speed */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Speed (knots)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 14.2"
                    value={formData.speedKnots ?? 14.2}
                    onChange={(e) => setFormData({ ...formData, speedKnots: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                  />
                </div>

                {/* Heading */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Heading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 145° SE"
                    value={formData.heading ?? '145° SE'}
                    onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                  />
                </div>

                {/* Cargo Capacity TEU */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                    Cargo Loaded (TEU)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 224"
                    value={formData.cargoCount ?? 224}
                    onChange={(e) => setFormData({ ...formData, cargoCount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#A7B2B8] uppercase tracking-wider mb-1 font-mono">
                  Operational Mission Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Carrying heavy wintering fuel tanks, scientific containers, and auxiliary cargo..."
                  value={formData.notes ?? ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#263238]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddVesselOpen(false)
                    setFormError(null)
                    setFormSuccess(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={formSubmitting}
                  iconLeft={<CheckCircle2 className="w-4 h-4" />}
                >
                  Persist to PostgreSQL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

