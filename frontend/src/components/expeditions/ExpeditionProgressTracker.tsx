import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from '@/components/ui'
import {
  Navigation,
  Ship,
  MapPin,
  Clock,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Anchor,
  Compass,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react'
import {
  fetchMissionProgress,
  updateMissionPhase,
  MissionProgressResponse,
  RouteWaypoint,
} from '@/services/expeditionService'
import { getStoredSession } from '@/services/authService'

interface ExpeditionProgressTrackerProps {
  expeditionId: string
  expeditionName?: string
  station?: string
}

const PHASE_LABELS: Record<string, string> = {
  PLANNING: 'Planning & Staging',
  PREPARATION: 'Pre-Deployment Prep',
  DEPARTED: 'Port Departure',
  IN_TRANSIT: 'In Transit (Open Sea / Ice)',
  ARRIVED: 'Arrived at Station',
  ACTIVE: 'Active Field Operations',
  RETURNING: 'Return Voyage',
  COMPLETED: 'Mission Concluded',
  ON_HOLD: 'Logistics Hold',
}

const PHASE_OPTIONS = [
  { value: 'PLANNING', label: 'Planning & Staging' },
  { value: 'PREPARATION', label: 'Pre-Deployment Preparation' },
  { value: 'DEPARTED', label: 'Vessel Departed Port' },
  { value: 'IN_TRANSIT', label: 'In Transit (Sea/Ice Traverse)' },
  { value: 'ARRIVED', label: 'Arrived at Research Station' },
  { value: 'ACTIVE', label: 'Active Station Campaign' },
  { value: 'RETURNING', label: 'Return Transit Voyage' },
  { value: 'COMPLETED', label: 'Mission Completed' },
  { value: 'ON_HOLD', label: 'Mission On Hold' },
]

export const ExpeditionProgressTracker: React.FC<ExpeditionProgressTrackerProps> = ({
  expeditionId,
  expeditionName,
  station,
}) => {
  const [progressData, setProgressData] = useState<MissionProgressResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingPhase, setIsUpdatingPhase] = useState<boolean>(false)
  const [phaseModalOpen, setPhaseModalOpen] = useState<boolean>(false)
  const [selectedPhase, setSelectedPhase] = useState<string>('PLANNING')
  const [phaseNotes, setPhaseNotes] = useState<string>('')
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null)

  const session = getStoredSession()
  const userRole = session?.user?.role || 'DOCTOR'
  const canUpdatePhase = userRole === 'ADMIN' || userRole === 'PHC'

  const loadProgress = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchMissionProgress(expeditionId)
      setProgressData(data)
      setSelectedPhase(data.currentPhase || 'PLANNING')
    } catch (err: any) {
      setError(err?.message || 'Failed to load expedition mission progress.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProgress()
  }, [expeditionId])

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingPhase(true)
    setError(null)
    setUpdateSuccessMsg(null)
    try {
      const updated = await updateMissionPhase(expeditionId, selectedPhase, phaseNotes)
      setProgressData(updated)
      setPhaseModalOpen(false)
      setPhaseNotes('')
      setUpdateSuccessMsg(`Mission phase successfully updated to ${PHASE_LABELS[selectedPhase] || selectedPhase}.`)
      setTimeout(() => setUpdateSuccessMsg(null), 6000)
    } catch (err: any) {
      setError(err?.message || 'Failed to advance mission phase.')
    } finally {
      setIsUpdatingPhase(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-[#02457A]" />
          <p className="text-sm font-medium text-slate-700">Calculating Deterministic Polar Route & Mission Telemetry...</p>
          <p className="text-xs text-slate-400 mt-1">Executing Haversine distance computations along active waypoint track.</p>
        </CardContent>
      </Card>
    )
  }

  if (error && !progressData) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900">Failed to Load Route & Progress Data</h3>
          <p className="text-xs text-red-700 mt-1 max-w-lg mx-auto">{error}</p>
          <Button variant="secondary" size="sm" onClick={loadProgress} className="mt-4" iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry Calculation
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!progressData) return null

  // Telemetry badge styling
  const telemetrySource = progressData.telemetrySource
  const isLive = telemetrySource === 'LIVE_GPS'
  const isSimulated = telemetrySource === 'PROTOTYPE_SIMULATED'
  const isUnavailable = telemetrySource === 'LOCATION_UNAVAILABLE'

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & TELEMETRY SOURCE PROVENANCE BANNER */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#001B48] text-white">
                {progressData.expeditionId}
              </span>
              <Badge
                variant={
                  progressData.currentPhase === 'ACTIVE' || progressData.currentPhase === 'ARRIVED'
                    ? 'operational'
                    : progressData.currentPhase === 'IN_TRANSIT' || progressData.currentPhase === 'DEPARTED'
                    ? 'info'
                    : progressData.currentPhase === 'COMPLETED'
                    ? 'neutral'
                    : 'warning'
                }
                size="sm"
                withDot
              >
                {PHASE_LABELS[progressData.currentPhase] || progressData.status}
              </Badge>
              {isLive && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE TELEMETRY
                </span>
              )}
              {isSimulated && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                  <Radio className="w-3 h-3 text-amber-700" />
                  PROTOTYPE / SIMULATED TELEMETRY
                </span>
              )}
              {isUnavailable && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                  <AlertTriangle className="w-3 h-3 text-slate-500" />
                  LOCATION DATA UNAVAILABLE
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Mission Route Progress & Maritime Telemetry
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic Haversine route tracking between {progressData.origin.name} and {progressData.destination.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="xs"
              onClick={loadProgress}
              iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Fix
            </Button>
            {canUpdatePhase && (
              <Button
                variant="primary"
                size="xs"
                onClick={() => setPhaseModalOpen(true)}
                iconLeft={<Navigation className="w-3.5 h-3.5" />}
              >
                Update Mission Phase
              </Button>
            )}
          </div>
        </div>

        {/* Telemetry provenance notice */}
        <div
          className={`mt-3.5 p-2.5 rounded-lg border text-xs flex items-center justify-between ${
            isLive
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : isSimulated
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-slate-500" />
            <span>
              <strong>Telemetry Provenance:</strong> {progressData.telemetryLabel}. Distance calculations are executed via exact Earth-radius Haversine arc-segments (no fabricated coordinates or mock route totals).
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-2">
            {progressData.lastKnownTimestamp ? `Fix: ${progressData.lastKnownTimestamp}` : 'Read-only Engine'}
          </span>
        </div>

        {updateSuccessMsg && (
          <div className="mt-2 p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{updateSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* 2. CORE NUMERICAL PROGRESS METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Route Distance */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Total Route Distance</span>
            <Compass className="w-3.5 h-3.5 text-[#02457A]" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {progressData.totalDistanceKm > 0 ? (
              <>
                {progressData.totalDistanceKm.toLocaleString()} <span className="text-sm font-medium text-slate-500">km</span>
              </>
            ) : (
              <span className="text-sm text-slate-500 font-sans font-medium">Route data unavailable</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {progressData.totalDistanceKm > 0
              ? `${(progressData.totalDistanceKm * 0.539957).toFixed(1)} nautical miles`
              : 'Deterministic Haversine computation'}
          </div>
        </div>

        {/* Metric 2: Distance Traveled */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Distance Traveled</span>
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            {progressData.totalDistanceKm > 0 ? (
              <>
                {progressData.distanceTraveledKm.toLocaleString()} <span className="text-sm font-medium text-slate-500">km</span>
              </>
            ) : (
              <span className="text-sm text-slate-500 font-sans font-medium">0.0 km</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {progressData.totalDistanceKm > 0
              ? `${progressData.progressPercent.toFixed(1)}% route completed`
              : 'Staged at origin base'}
          </div>
        </div>

        {/* Metric 3: Remaining Distance */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Remaining Distance</span>
            <Anchor className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {progressData.totalDistanceKm > 0 ? (
              <>
                {progressData.remainingDistanceKm.toLocaleString()} <span className="text-sm font-medium text-slate-500">km</span>
              </>
            ) : (
              <span className="text-sm text-slate-500 font-sans font-medium">—</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {progressData.totalDistanceKm > 0
              ? `${(progressData.remainingDistanceKm * 0.539957).toFixed(1)} NM to destination`
              : 'Destination pending'}
          </div>
        </div>

        {/* Metric 4: Vessel Speed & ETA */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Speed & ETA</span>
            <Clock className="w-3.5 h-3.5 text-[#018ABE]" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900 truncate">
            {progressData.speedKnots ? `${progressData.speedKnots} kts` : 'Stationary / Port'}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 font-mono truncate" title={progressData.etaBreakdown || progressData.eta || 'N/A'}>
            {progressData.eta ? `ETA: ${progressData.eta}` : 'No active sea transit'}
          </div>
        </div>
      </div>

      {/* 3. PROGRESS BAR STRIP */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-mono">Mission Transit Completion:</span>
              <span className="font-mono text-sm font-bold text-[#02457A]">{progressData.progressPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
              <span>Traveled: {progressData.distanceTraveledKm} km</span>
              <span>•</span>
              <span>Remaining: {progressData.remainingDistanceKm} km</span>
            </div>
          </div>

          {/* Graphical Progress Track */}
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-[#001B48] via-[#02457A] to-[#018ABE] h-full rounded-full transition-all duration-500 relative"
              style={{ width: `${Math.max(2, Math.min(100, progressData.progressPercent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#02457A]" />
              <span className="font-semibold text-slate-800">{progressData.origin.name}</span>
              {progressData.origin.formattedCoordinates && (
                <span className="font-mono text-slate-600">({progressData.origin.formattedCoordinates})</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800">{progressData.destination.name}</span>
              {progressData.destination.formattedCoordinates && (
                <span className="font-mono text-slate-600">({progressData.destination.formattedCoordinates})</span>
              )}
              <Anchor className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. DETAILED ROUTE WAYPOINT TIMELINE & LOCATION FIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Waypoints Visual Sequence */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200 flex flex-row items-center justify-between">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#02457A]" />
                <span>Polar Route Navigation Waypoints ({progressData.waypoints.length} Points)</span>
              </CardTitle>
              <Badge variant="neutral" size="sm" mono>
                {progressData.waypoints.filter((w) => w.passed).length} / {progressData.waypoints.length} Cleared
              </Badge>
            </CardHeader>
            <CardContent className="p-4">
              {progressData.waypoints.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                  <Navigation className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="font-bold font-mono text-slate-700 uppercase">Route Data Unavailable</div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    No route waypoints or transit coordinates are currently registered in the database for campaign {progressData.expeditionId}.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {progressData.waypoints.map((wp, idx) => {
                    const isPassed = wp.passed
                    const isFirst = idx === 0
                    const isLast = idx === progressData.waypoints.length - 1
                    const latCard = wp.latitude >= 0 ? 'N' : 'S'
                    const lonCard = wp.longitude >= 0 ? 'E' : 'W'
                    const coordStr = `${Math.abs(wp.latitude).toFixed(4)}° ${latCard}, ${Math.abs(wp.longitude).toFixed(4)}° ${lonCard}`

                    return (
                      <div key={idx} className="relative flex items-start gap-3 text-xs">
                        {/* Status Icon Indicator */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                            isPassed
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                        </div>

                        <div
                          className={`flex-1 p-3 rounded-lg border transition-all ${
                            isPassed
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">
                                {wp.name || (isFirst ? 'Origin Staging Port' : isLast ? 'Destination Station' : `Waypoint #${idx + 1}`)}
                              </span>
                              {isFirst && (
                                <Badge variant="neutral" size="sm">
                                  ORIGIN
                                </Badge>
                              )}
                              {isLast && (
                                <Badge variant="info" size="sm">
                                  DESTINATION
                                </Badge>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isPassed ? 'PASSED / CLEARED' : 'PENDING TRANSIT'}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-600 font-mono">
                            <div>
                              <span className="text-slate-600 uppercase font-bold text-[10px]">Fix: </span>
                              <strong>{coordStr}</strong>
                            </div>
                            {wp.estimatedArrival && (
                              <div>
                                <span className="text-slate-600 uppercase font-bold text-[10px]">ETA: </span>
                                <span>{wp.estimatedArrival}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Vessel & Navigation Telemetry Dossier */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5 text-[#02457A]" />
                <span>Assigned Carrier & Telemetry</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-mono font-bold block">Vessel Asset</span>
                <strong className="text-slate-900 text-sm">{progressData.vesselName || 'No vessel designated'}</strong>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-mono font-bold block">True Heading</span>
                  <span className="font-mono font-bold text-slate-800">{progressData.heading || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-mono font-bold block">Cruise Speed</span>
                  <span className="font-mono font-bold text-slate-800">
                    {progressData.speedKnots ? `${progressData.speedKnots} kts` : '0.0 kts'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase text-slate-500 font-mono font-bold block">Current Position Fix</span>
                {progressData.currentLocation ? (
                  <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800">
                    <div className="font-bold text-slate-900">{progressData.currentLocation.name}</div>
                    {progressData.currentLocation.formattedCoordinates && (
                      <div className="text-slate-600 mt-0.5">{progressData.currentLocation.formattedCoordinates}</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-slate-400 italic text-[11px]">No active coordinate fix recorded.</div>
                )}
              </div>

              {progressData.etaBreakdown && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase text-slate-500 font-mono font-bold block">Deterministic Transit Projection</span>
                  <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed bg-blue-50/50 p-2 rounded border border-blue-100">
                    {progressData.etaBreakdown}
                  </p>
                </div>
              )}

              {progressData.notes && progressData.notes.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase text-slate-500 font-mono font-bold block mb-1">Operational Tracking Notes</span>
                  <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                    {progressData.notes.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. MISSION PHASE UPDATE MODAL (ADMIN & PHC ONLY) */}
      {phaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">Advance Mission Lifecycle Phase</h3>
                <p className="text-[11px] text-slate-500">Expedition {progressData.expeditionId}</p>
              </div>
              <Badge variant="info" size="sm" mono>
                RBAC: {userRole}
              </Badge>
            </div>

            <form onSubmit={handlePhaseSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 uppercase mb-1.5">
                  Select New Operational Phase
                </label>
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-md p-2 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#02457A]"
                  disabled={isUpdatingPhase}
                >
                  {PHASE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 uppercase mb-1.5">
                  Logbook Notes & Operational Reason
                </label>
                <textarea
                  value={phaseNotes}
                  onChange={(e) => setPhaseNotes(e.target.value)}
                  placeholder="e.g. Convoy cleared Cape Town Outer Port; ice-breaker escorts underway."
                  className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#02457A] min-h-[80px]"
                  disabled={isUpdatingPhase}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPhaseModalOpen(false)}
                  disabled={isUpdatingPhase}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUpdatingPhase}
                  iconLeft={isUpdatingPhase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  {isUpdatingPhase ? 'Saving Phase...' : 'Confirm & Save Phase'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
