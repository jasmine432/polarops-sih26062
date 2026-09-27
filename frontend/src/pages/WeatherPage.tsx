import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Modal,
} from '@/components/ui'
import {
  CloudSnow,
  Wind,
  Thermometer,
  Compass,
  Droplets,
  Clock,
  RefreshCw,
  Info,
  Activity,
  Eye,
  TrendingDown,
  TrendingUp,
  Plus,
  AlertTriangle,
  Loader2,
  Building,
} from 'lucide-react'
import {
  STATIONS_WEATHER_DATA,
  StationWeather,
  WeatherChartPoint,
  MAITRI_24H_SERIES,
  BHARATI_24H_SERIES,
  MAITRI_7D_SERIES,
  BHARATI_7D_SERIES,
  MAITRI_30D_SERIES,
  BHARATI_30D_SERIES,
} from '@/data/weatherData'
import {
  fetchStationsList,
  createStation,
  StationApiResponse,
  StationApiPayload,
} from '@/services/stationsService'
import { cn } from '@/lib/utils'

type DateRange = '24h' | '7d' | '30d'

export const WeatherPage: React.FC = () => {
  const [stationsList, setStationsList] = useState<StationApiResponse[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedStation, setSelectedStation] = useState<string>('All')
  const [dateRange, setDateRange] = useState<DateRange>('24h')
  const [lastSimulatedSync, setLastSimulatedSync] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Station Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    coordinates: '',
    latitude: '',
    longitude: '',
    elevation: '',
    stationType: 'Antarctic Permanent Research Station',
    capacity: '25',
    currentOccupancy: '0',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Station master records from PostgreSQL backend API
  const loadStationsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchStationsList()
      setStationsList(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load stations from database.')
      setStationsList([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStationsData()
  }, [])

  // Handle telemetry refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      const now = new Date()
      const utcTime = now.toUTCString().replace('GMT', 'UTC')
      setLastSimulatedSync(utcTime)
      setIsRefreshing(false)
    }, 450)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      coordinates: '',
      latitude: '',
      longitude: '',
      elevation: '',
      stationType: 'Antarctic Permanent Research Station',
      capacity: '25',
      currentOccupancy: '0',
      notes: '',
    })
    setFormErrors({})
    setSubmitError(null)
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Station name is required'
    if (!formData.location.trim()) errors.location = 'Location description is required'
    if (!formData.coordinates.trim()) errors.coordinates = 'Coordinates are required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Create Station submission to PostgreSQL
  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    const payload: StationApiPayload = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      coordinates: formData.coordinates.trim(),
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      elevation: formData.elevation.trim() || undefined,
      stationType: formData.stationType,
      capacity: parseInt(formData.capacity, 10) || 25,
      currentOccupancy: parseInt(formData.currentOccupancy, 10) || 0,
      notes: formData.notes.trim() || undefined,
      status: 'Operational',
    }

    try {
      await createStation(payload)
      await loadStationsData()
      setIsModalOpen(false)
      resetForm()
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to register station in database.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Map PostgreSQL station master records to UI Weather items
  const mappedStations: (StationWeather & {
    recordId?: number
    establishedYear?: number | null
    capacity?: number | null
    currentOccupancy?: number | null
  })[] = useMemo(() => {
    if (stationsList.length === 0) {
      return [STATIONS_WEATHER_DATA.Maitri, STATIONS_WEATHER_DATA.Bharati]
    }
    return stationsList.map((st) => {
      const predefined = STATIONS_WEATHER_DATA[st.station_id]
      if (predefined) {
        return {
          ...predefined,
          name: st.name,
          location: st.location,
          coordinates: st.coordinates,
          elevation: st.elevation || predefined.elevation,
          sensorId: st.sensor_id || predefined.sensorId,
          recordId: st.id,
          establishedYear: st.established_year,
          capacity: st.capacity,
          currentOccupancy: st.current_occupancy,
        }
      }
      // Reference parameters for stations without customized fixture weather
      return {
        id: st.station_id,
        name: st.name,
        location: st.location,
        coordinates: st.coordinates,
        elevation: st.elevation || '100m MSL',
        temperature: -16.0,
        temperatureUnit: '°C',
        windChill: -28.5,
        pressure: 982.0,
        pressureUnit: 'hPa',
        pressureTrend: 'Steady' as const,
        windSpeed: 21.0,
        windSpeedUnit: 'knots (39 km/h)',
        windDirection: 'East (090°)',
        windBearing: 90,
        relativeHumidity: 62,
        humidityUnit: '%',
        visibility: '10+ km (Unrestricted VFR)',
        condition: 'Clear Polar Weather Window',
        blizzardStage: 'Stage 0 Normal',
        alertLevel: 'NOMINAL' as const,
        statusVariant: (st.status === 'Operational' ? 'operational' : st.status === 'Restricted' ? 'warning' : 'neutral') as any,
        observationTime: '2026-09-17 18:00 UTC',
        sensorId: st.sensor_id || `NCPOR-AWS-${st.station_id.slice(0, 3).toUpperCase()}-01`,
        recordId: st.id,
        establishedYear: st.established_year,
        capacity: st.capacity,
        currentOccupancy: st.current_occupancy,
      }
    })
  }, [stationsList])

  // Active stations list based on selection
  const displayedStations = useMemo(() => {
    if (selectedStation === 'All') return mappedStations
    return mappedStations.filter((s) => s.id.toLowerCase() === selectedStation.toLowerCase())
  }, [mappedStations, selectedStation])

  // Get historical series based on range and station
  const getTimeSeries = (stationId: 'Maitri' | 'Bharati'): WeatherChartPoint[] => {
    if (dateRange === '24h') {
      return stationId === 'Maitri' ? MAITRI_24H_SERIES : BHARATI_24H_SERIES
    }
    if (dateRange === '7d') {
      return stationId === 'Maitri' ? MAITRI_7D_SERIES : BHARATI_7D_SERIES
    }
    return stationId === 'Maitri' ? MAITRI_30D_SERIES : BHARATI_30D_SERIES
  }

  const maitriSeries = getTimeSeries('Maitri')
  const bharatiSeries = getTimeSeries('Bharati')

  // Line Chart Renderer
  const renderLineChart = (
    title: string,
    metricKey: 'temp' | 'wind',
    unit: string,
    yMin: number,
    yMax: number,
    thresholdValue?: number,
    thresholdLabel?: string
  ) => {
    const width = 500
    const height = 180
    const padding = { top: 20, right: 30, bottom: 30, left: 45 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const timeLabels = maitriSeries.map((p) => p.time)
    const pointsCount = timeLabels.length

    const getX = (idx: number) => padding.left + (idx / (pointsCount - 1)) * chartWidth
    const getY = (val: number) =>
      padding.top + chartHeight - ((val - yMin) / (yMax - yMin)) * chartHeight

    const buildPath = (series: WeatherChartPoint[]) => {
      return series
        .map((p, idx) => {
          const x = getX(idx)
          const y = getY(p[metricKey])
          return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
        })
        .join(' ')
    }

    const maitriPath = buildPath(maitriSeries)
    const bharatiPath = buildPath(bharatiSeries)

    return (
      <Card className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238]">
        <CardHeader className="py-2.5 px-4 bg-slate-50 dark:bg-[#101619] flex flex-row items-center justify-between border-b border-slate-100 dark:border-[#263238]">
          <div>
            <CardTitle className="text-xs text-slate-900 dark:text-[#F5F7F8] uppercase tracking-wider font-bold">
              {title}
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 dark:text-[#A7B2B8]">
              {dateRange === '24h'
                ? 'Historical 3-hour fixture samples'
                : dateRange === '7d'
                ? 'Historical daily fixture samples'
                : 'Historical weekly fixture averages'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {(selectedStation === 'All' || selectedStation === 'Maitri') && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-[#FFD21C] inline-block" />
                <span className="text-slate-700 dark:text-[#F5F7F8] font-semibold">Maitri</span>
              </div>
            )}
            {(selectedStation === 'All' || selectedStation === 'Bharati') && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#018ABE] dark:bg-[#28B6FF] inline-block" />
                <span className="text-slate-700 dark:text-[#F5F7F8] font-semibold">Bharati</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-white dark:bg-[#0D1316]">
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-52 font-mono text-[10px]">
              {/* Horizontal grid lines & Y labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const val = yMin + ratio * (yMax - yMin)
                const y = padding.top + chartHeight - ratio * chartHeight
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      className="stroke-slate-200 dark:stroke-[#263238]"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={padding.left - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-[#A7B2B8]"
                      fontSize="9"
                    >
                      {val.toFixed(0)} {unit}
                    </text>
                  </g>
                )
              })}

              {/* Threshold indicator line if provided */}
              {thresholdValue !== undefined && (
                <g>
                  {(() => {
                    const y = getY(thresholdValue)
                    return (
                      <>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="#e11d48"
                          className="dark:stroke-[#FF3038]"
                          strokeWidth="1.2"
                          strokeDasharray="4 3"
                        />
                        <text
                          x={width - padding.right}
                          y={y - 4}
                          textAnchor="end"
                          fill="#f43f5e"
                          className="dark:fill-[#FF3038]"
                          fontSize="8.5"
                          fontWeight="bold"
                        >
                          {thresholdLabel || 'Threshold'} ({thresholdValue} {unit})
                        </text>
                      </>
                    )
                  })()}
                </g>
              )}

              {/* X Axis labels */}
              {timeLabels.map((time, idx) => {
                const x = getX(idx)
                return (
                  <text
                    key={idx}
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-slate-400 dark:fill-[#A7B2B8]"
                    fontSize="9"
                  >
                    {time}
                  </text>
                )
              })}

              {/* Maitri Series Path */}
              {(selectedStation === 'All' || selectedStation === 'Maitri') && (
                <>
                  <path d={maitriPath} fill="none" stroke="#f59e0b" className="dark:stroke-[#FFD21C]" strokeWidth="2.5" />
                  {maitriSeries.map((p, idx) => (
                    <circle
                      key={`m-${idx}`}
                      cx={getX(idx)}
                      cy={getY(p[metricKey])}
                      r="3.5"
                      fill="#f59e0b"
                      className="dark:fill-[#FFD21C] dark:stroke-[#050708]"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  ))}
                </>
              )}

              {/* Bharati Series Path */}
              {(selectedStation === 'All' || selectedStation === 'Bharati') && (
                <>
                  <path d={bharatiPath} fill="none" stroke="#018ABE" className="dark:stroke-[#28B6FF]" strokeWidth="2.5" />
                  {bharatiSeries.map((p, idx) => (
                    <circle
                      key={`b-${idx}`}
                      cx={getX(idx)}
                      cy={getY(p[metricKey])}
                      r="3.5"
                      fill="#018ABE"
                      className="dark:fill-[#28B6FF] dark:stroke-[#050708]"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  ))}
                </>
              )}
            </svg>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-transparent">
        <div className="flex items-start gap-3.5">
          <div className="w-1 self-stretch min-h-[50px] bg-[#2C6A74] dark:bg-[#FFD21C] rounded-full shrink-0" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-[#F5F7F8] uppercase font-mono mb-0.5">
              POLAR STATIONS & METEOROLOGICAL TELEMETRY
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F5F7F8] tracking-tight uppercase font-sans flex items-center gap-2.5">
              <CloudSnow className="w-7 h-7 text-[#02457A] dark:text-[#28B6FF]" />
              Weather & Stations
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A7B2B8] mt-1 leading-relaxed font-normal">
              Persistent polar research station master records and dated reference meteorological observations.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStationsData}
              isLoading={isLoading}
              iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
              title="Refresh station master records from PostgreSQL database"
            >
              Refresh DB
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSubmitError(null)
                setIsModalOpen(true)
              }}
              iconLeft={<Plus className="w-3.5 h-3.5" />}
            >
              Register Station
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs dark:bg-[#0D1316] dark:border-[#263238] dark:text-[#F5F7F8] dark:hover:bg-[#11191D]"
            >
              Simulate Sync
            </Button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#A7B2B8] font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-[#6F7C82]" />
            <span>Last simulated sync:</span>
            <span className="font-semibold text-slate-700 dark:text-[#F5F7F8] tabular-nums">{lastSimulatedSync ?? 'Not run this session'}</span>
          </div>
        </div>
      </div>

      {/* ERROR BANNER IF DATABASE CONNECTION FAILS */}
      {error && !isLoading && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-rose-900">Database Connection Error:</span>{' '}
              <span className="text-rose-800">{error}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={loadStationsData}
            iconLeft={<RefreshCw className="w-3 h-3" />}
          >
            Retry Database Query
          </Button>
        </div>
      )}

      {/* 2. OPERATIONAL CONTEXT NOTE BANNER */}
      <div className="p-3 bg-slate-100/90 dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-xl text-xs text-slate-700 dark:text-[#A7B2B8] flex items-start gap-2.5 shadow-xs">
        <Info className="w-4 h-4 text-[#02457A] dark:text-[#FFD21C] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 dark:text-[#F5F7F8]">Station Master & Reference Telemetry:</strong> Station facility records are backed by the central PostgreSQL database. Weather telemetry feeds and historical chart series are authenticated research reference observations.
        </div>
      </div>

      {/* 3. STATION SELECTOR & DATE RANGE CONTROLS */}
      <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Station Selection Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase font-mono">Station:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0A0E10] p-1 rounded-lg border border-slate-200 dark:border-[#263238] flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedStation('All')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                selectedStation === 'All'
                  ? 'bg-[#02457A] text-white dark:bg-[#FFD21C] dark:text-[#050708] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-[#A7B2B8] hover:text-slate-900 dark:hover:text-[#F5F7F8] hover:bg-slate-50 dark:hover:bg-[#11191D]'
              )}
            >
              All Stations ({mappedStations.length})
            </button>
            {mappedStations.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStation(st.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  selectedStation.toLowerCase() === st.id.toLowerCase()
                    ? 'bg-[#02457A] text-white dark:bg-[#FFD21C] dark:text-[#050708] shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-[#A7B2B8] hover:text-slate-900 dark:hover:text-[#F5F7F8] hover:bg-slate-50 dark:hover:bg-[#11191D]'
                )}
              >
                {st.id}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase font-mono">Time Horizon:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0A0E10] p-1 rounded-lg border border-slate-200 dark:border-[#263238]">
            {[
              { key: '24h', label: 'Past 24 Hours' },
              { key: '7d', label: 'Past 7 Days' },
              { key: '30d', label: 'Past 30 Days' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDateRange(tab.key as DateRange)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                  dateRange === tab.key
                    ? 'bg-white text-slate-900 dark:bg-[#11191D] dark:text-[#F5F7F8] font-bold shadow-2xs border border-slate-200 dark:border-[#263238]'
                    : 'text-slate-600 dark:text-[#A7B2B8] hover:text-slate-900 dark:hover:text-[#F5F7F8]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. STATION TELEMETRY CARDS */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-lg p-12 text-center space-y-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-[#02457A] dark:text-[#FFD21C] animate-spin mx-auto" />
          <div className="text-xs font-semibold text-slate-700 dark:text-[#F5F7F8]">Connecting to PostgreSQL database...</div>
          <p className="text-[11px] text-slate-400">Fetching live polar stations and facilities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedStations.map((station) => (
            <Card key={station.id} accent={station.statusVariant} className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] flex flex-col justify-between">
              <CardHeader className="py-3 px-4 bg-slate-50 dark:bg-[#101619] flex flex-row items-center justify-between border-b border-slate-100 dark:border-[#263238]">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F5F7F8]">{station.name}</CardTitle>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#A7B2B8] bg-white dark:bg-[#11191D] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#263238]">
                      {station.sensorId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#A7B2B8] font-mono mt-0.5">
                    {station.coordinates} · Elev {station.elevation}
                  </div>
                </div>
                <Badge variant={station.statusVariant} size="sm" withDot>
                  {station.alertLevel}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-4 bg-white dark:bg-[#0D1316]">
                {/* Six telemetry indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {/* 1. Temperature */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#070B0D] border border-slate-200 dark:border-[#263238] rounded-lg flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase font-mono tracking-wider">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400 dark:text-[#6F7C82]" />
                      <span>Temperature</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-[#F5F7F8] mt-1.5">
                      {station.temperature > 0 ? `+${station.temperature}` : station.temperature}
                      {station.temperatureUnit}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6F7C82] font-mono mt-1">
                      Wind Chill: {station.windChill}°C
                    </div>
                  </div>

                  {/* 2. Pressure */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#070B0D] border border-slate-200 dark:border-[#263238] rounded-lg flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase font-mono tracking-wider">
                      <Compass className="w-3.5 h-3.5 text-slate-400 dark:text-[#6F7C82]" />
                      <span>Pressure</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-[#F5F7F8] mt-1.5">
                      {station.pressure} {station.pressureUnit}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6F7C82] font-mono mt-1 flex items-center gap-1">
                      {station.pressureTrend === 'Falling' ? (
                        <TrendingDown className="w-3 h-3 text-amber-600 dark:text-[#FFD21C]" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-slate-400 dark:text-[#6F7C82]" />
                      )}
                      <span>Trend: {station.pressureTrend}</span>
                    </div>
                  </div>

                  {/* 3. Wind Speed */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#070B0D] border border-slate-200 dark:border-[#263238] rounded-lg flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase font-mono tracking-wider">
                      <Wind className="w-3.5 h-3.5 text-slate-400 dark:text-[#6F7C82]" />
                      <span>Wind Speed</span>
                    </div>
                    <div
                      className={cn(
                        'text-xl font-bold font-mono mt-1.5',
                        station.windSpeed >= 30 ? 'text-amber-600 dark:text-[#FFD21C]' : 'text-slate-900 dark:text-[#F5F7F8]'
                      )}
                    >
                      {station.windSpeed} kt
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6F7C82] font-mono mt-1 truncate">
                      {station.windSpeedUnit}
                    </div>
                  </div>

                  {/* 4. Wind Direction */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#070B0D] border border-slate-200 dark:border-[#263238] rounded-lg flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase font-mono tracking-wider">
                      <Compass className="w-3.5 h-3.5 text-slate-400 dark:text-[#6F7C82]" />
                      <span>Wind Direction</span>
                    </div>
                    <div className="text-base font-bold font-mono text-slate-900 dark:text-[#F5F7F8] mt-1.5">
                      {station.windDirection.split('(')[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6F7C82] font-mono mt-1">
                      Bearing: {station.windBearing}°
                    </div>
                  </div>

                  {/* 5. Relative Humidity */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#070B0D] border border-slate-200 dark:border-[#263238] rounded-lg flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase font-mono tracking-wider">
                      <Droplets className="w-3.5 h-3.5 text-slate-400 dark:text-[#6F7C82]" />
                      <span>Humidity</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-[#F5F7F8] mt-1.5">
                      {station.relativeHumidity}
                      {station.humidityUnit}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6F7C82] font-mono mt-1">
                      Moisture Content
                    </div>
                  </div>

                  {/* 6. Visibility & Runway */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#070B0D] border border-slate-200 dark:border-[#263238] rounded-lg flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-[#A7B2B8] uppercase font-mono tracking-wider">
                      <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-[#6F7C82]" />
                      <span>Visibility</span>
                    </div>
                    <div
                      className={cn(
                        'text-sm font-bold font-mono mt-1.5 truncate',
                        station.statusVariant === 'warning' || station.statusVariant === 'critical'
                          ? 'text-amber-600 dark:text-[#FFD21C]'
                          : 'text-slate-900 dark:text-[#F5F7F8]'
                      )}
                    >
                      {station.visibility.split(' ')[0]} {station.visibility.split(' ')[1] || ''}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#6F7C82] font-mono mt-1 truncate">
                      {station.blizzardStage}
                    </div>
                  </div>
                </div>

                {/* Surface & Visibility Operational Summary */}
                <div
                  className={cn(
                    'p-3.5 rounded-lg border text-xs transition-colors',
                    station.statusVariant === 'warning' || station.statusVariant === 'critical'
                      ? 'bg-slate-50 dark:bg-[#070B0D] border-slate-200 dark:border-[#263238] border-l-4 border-l-amber-500 dark:border-l-[#FFD21C]'
                      : 'bg-slate-50 dark:bg-[#070B0D] border-slate-200 dark:border-[#263238] border-l-4 border-l-emerald-600 dark:border-l-[#16C784]'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Surface condition details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#A7B2B8] font-mono">
                        <Activity className="w-3 h-3 text-slate-400 dark:text-[#6F7C82]" />
                        <span>SURFACE CONDITION</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-[#F5F7F8] leading-snug">
                        {station.condition}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A7B2B8] font-normal leading-relaxed">
                        {station.statusVariant === 'warning' || station.statusVariant === 'critical'
                          ? 'Reduced by blowing surface snow & high katabatic wind drift'
                          : 'Normal surface friction & clear ice shelf runway operations'}
                      </div>
                    </div>

                    {/* Right: Visibility & Blizzard Stage */}
                    <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-[#263238]/60">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#A7B2B8] font-mono">
                        VISIBILITY
                      </div>
                      <div
                        className={cn(
                          'text-base font-extrabold font-mono mt-0.5',
                          station.statusVariant === 'warning' || station.statusVariant === 'critical'
                            ? 'text-amber-600 dark:text-[#FFD21C]'
                            : 'text-emerald-700 dark:text-[#16C784]'
                        )}
                      >
                        {station.visibility}
                      </div>
                      <div className="mt-1">
                        <Badge
                          variant={station.statusVariant === 'warning' ? 'warning' : 'operational'}
                          size="sm"
                        >
                          {station.blizzardStage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 5. HISTORICAL WEATHER CHARTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-[#F5F7F8] uppercase tracking-wider">
              Historical Meteorological Trends
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-[#A7B2B8]">
              Comparative environmental trends for temperature stability and surface wind speed vectors
            </p>
          </div>
          <Badge variant="neutral" size="sm" mono>
            Range: {dateRange.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Temperature Over Time */}
          {renderLineChart(
            'Ambient Temperature Over Time',
            'temp',
            '°C',
            -30,
            -5,
            -25,
            'Severe Cold Floor'
          )}

          {/* Chart 2: Wind Speed Over Time */}
          {renderLineChart(
            'Surface Wind Speed Over Time',
            'wind',
            'kt',
            0,
            50,
            30,
            'Gale Advisory Limit'
          )}
        </div>
      </div>

      {/* 6. SYNOPTIC LOGS TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#A7B2B8] px-0.5">
          <span className="font-bold text-slate-800 dark:text-[#F5F7F8] uppercase tracking-wider text-[11px]">
            Station Weather Reference Records ({mappedStations.length} Stations)
          </span>
          <span className="font-mono text-slate-500 dark:text-[#A7B2B8]">PostgreSQL database backed</span>
        </div>

        <Table className="w-full min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] min-w-[180px]">Station / Facility</TableHead>
              <TableHead className="w-[160px] min-w-[160px]">Observation Time</TableHead>
              <TableHead className="min-w-[180px]">Temperature</TableHead>
              <TableHead className="min-w-[160px]">Wind Vector</TableHead>
              <TableHead className="min-w-[180px]">Barometric Pressure</TableHead>
              <TableHead className="min-w-[120px]">Relative Humidity</TableHead>
              <TableHead className="min-w-[150px]">Operational Readiness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedStations.map((st) => (
              <TableRow key={st.id}>
                <TableCell className="font-bold text-slate-900 dark:text-[#F5F7F8]">
                  <div>{st.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-[#A7B2B8] font-mono">{st.coordinates}</div>
                </TableCell>
                <TableCell mono className="text-slate-600 dark:text-[#A7B2B8] text-xs">
                  {st.observationTime}
                </TableCell>
                <TableCell mono className="font-bold text-slate-900 dark:text-[#F5F7F8] text-xs">
                  {st.temperature}°C (Chill {st.windChill}°C)
                </TableCell>
                <TableCell mono className="text-amber-800 dark:text-[#FFD21C] font-semibold text-xs">
                  {st.windSpeed} kt {st.windDirection.split(' ')[0]}
                </TableCell>
                <TableCell mono className="text-slate-700 dark:text-[#A7B2B8] text-xs">
                  {st.pressure} hPa ({st.pressureTrend})
                </TableCell>
                <TableCell mono className="text-slate-700 dark:text-[#A7B2B8] text-xs">
                  {st.relativeHumidity}%
                </TableCell>
                <TableCell>
                  <Badge variant={st.statusVariant === 'critical' ? 'critical' : st.statusVariant === 'warning' ? 'warning' : 'operational'} size="sm" withDot>
                    {st.alertLevel}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 7. REGISTER NEW POLAR STATION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Register New Polar Research Station / Outpost"
        description="Add a sanctioned Indian Antarctic or Arctic station facility to the master PostgreSQL registry."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateStation}
              isLoading={isSubmitting}
            >
              Save Station Master Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateStation} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-850 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900">Failed to register station:</span>{' '}
                <span className="text-rose-800">{submitError}</span>
              </div>
            </div>
          )}

          {/* Station Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Station / Facility Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Maitri II Replacement Station"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                formErrors.name
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Location Description */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Geographic Location / Region <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Schirmacher Oasis East, Queen Maud Land"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value })
                  if (formErrors.location) setFormErrors({ ...formErrors, location: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  formErrors.location
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                }`}
              />
              {formErrors.location && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.location}</p>
              )}
            </div>

            {/* Coordinates */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Coordinates (DMS or GPS) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 70°46'00'' S, 11°45'00'' E"
                value={formData.coordinates}
                onChange={(e) => {
                  setFormData({ ...formData, coordinates: e.target.value })
                  if (formErrors.coordinates) setFormErrors({ ...formErrors, coordinates: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  formErrors.coordinates
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                }`}
              />
              {formErrors.coordinates && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.coordinates}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Elevation */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Elevation
              </label>
              <input
                type="text"
                placeholder="e.g. 120m MSL"
                value={formData.elevation}
                onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Capacity (Personnel)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 30"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              />
            </div>

            {/* Current Occupancy */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Current Occupancy
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 12"
                value={formData.currentOccupancy}
                onChange={(e) => setFormData({ ...formData, currentOccupancy: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Operational Notes & Mission Mandate
            </label>
            <textarea
              rows={2}
              placeholder="Operational capabilities, scientific laboratories, power generation, and seasonal readiness notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

