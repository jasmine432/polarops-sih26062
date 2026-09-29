import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  EmptyState,
} from '@/components/ui'
import {
  Users,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  Plane,
  Ship,
  Truck,
  Shield,
  HeartPulse,
  Award,
  Radio,
  MapPin,
  Clock,
  ExternalLink,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  PersonnelRecord,
  PersonnelStatus,
  PersonnelTransportMode,
} from '@/data/personnelData'
import {
  fetchPersonnelList,
  createPersonnel,
  PersonnelApiPayload,
} from '@/services/personnelService'
import { fetchExpeditionsList } from '@/services/expeditionService'
import type { ExpeditionDetail } from '@/data/expeditionsData'

export const PersonnelPage: React.FC = () => {
  const navigate = useNavigate()

  // Master Personnel State from PostgreSQL
  const [personnelList, setPersonnelList] = useState<PersonnelRecord[]>([])
  const [availableExpeditions, setAvailableExpeditions] = useState<ExpeditionDetail[]>([])
  const [expeditionsError, setExpeditionsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [stationFilter, setStationFilter] = useState<string>('All')
  const [expeditionFilter, setExpeditionFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // Register Movement Modal State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [movementForm, setMovementForm] = useState({
    name: '',
    role: '',
    organization: 'NCPOR / MoES',
    expeditionId: 'EXP-2026-014',
    currentStation: 'Maitri Base',
    destination: 'Bharati Base',
    departure: '',
    expectedArrival: '',
    transportMode: 'Basler BT-67 Air Lift' as PersonnelTransportMode,
    bloodGroup: 'O+',
    medicalClearance: 'AIIMS Certified',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load personnel records from PostgreSQL backend API
  const loadPersonnelData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchPersonnelList()
      setPersonnelList(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load personnel from database.')
      setPersonnelList([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPersonnelData()
    fetchExpeditionsList()
      .then((data) => {
        if (data && data.length > 0) {
          setAvailableExpeditions(data)
          setExpeditionsError(null)
          setMovementForm((prev) => ({
            ...prev,
            expeditionId: prev.expeditionId || data[0].id,
          }))
        }
      })
      .catch((err) => {
        setExpeditionsError(err?.message || 'Failed to load expeditions from database.')
      })
  }, [])

  // Reset form
  const resetForm = () => {
    setMovementForm({
      name: '',
      role: '',
      organization: 'NCPOR / MoES',
      expeditionId: 'EXP-2026-014',
      currentStation: 'Maitri Base',
      destination: 'Bharati Base',
      departure: '',
      expectedArrival: '',
      transportMode: 'Basler BT-67 Air Lift',
      bloodGroup: 'O+',
      medicalClearance: 'AIIMS Certified',
    })
    setFormErrors({})
    setSubmitError(null)
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!movementForm.name.trim()) errors.name = 'Full name is required'
    if (!movementForm.role.trim()) errors.role = 'Role / Designation is required'
    if (!movementForm.destination.trim()) errors.destination = 'Destination sector is required'
    if (!movementForm.departure.trim()) errors.departure = 'Departure date is required'
    if (!movementForm.expectedArrival.trim()) errors.expectedArrival = 'Expected arrival is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle register movement with PostgreSQL persistence
  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    const matchedExp = availableExpeditions.find((exp) => exp.id === movementForm.expeditionId)
    const payload: PersonnelApiPayload = {
      name: movementForm.name.trim(),
      role: movementForm.role.trim(),
      organization: movementForm.organization.trim(),
      expeditionId: movementForm.expeditionId,
      expeditionName: matchedExp?.name || movementForm.expeditionId,
      currentStation: movementForm.currentStation,
      destination: movementForm.destination.trim(),
      departure: movementForm.departure,
      expectedArrival: movementForm.expectedArrival,
      transportMode: movementForm.transportMode,
      status: 'In Transit',
      bloodGroup: movementForm.bloodGroup,
      medicalClearance: movementForm.medicalClearance,
    }

    try {
      await createPersonnel(payload)
      await loadPersonnelData()
      setIsMovementModalOpen(false)
      resetForm()
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to register personnel movement.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Personnel list
  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matches =
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.currentStation.toLowerCase().includes(q) ||
          p.destination.toLowerCase().includes(q) ||
          p.expeditionId.toLowerCase().includes(q) ||
          p.organization.toLowerCase().includes(q)
        if (!matches) return false
      }

      // Station filter
      if (stationFilter !== 'All') {
        if (!p.currentStation.toLowerCase().includes(stationFilter.toLowerCase())) {
          return false
        }
      }

      // Expedition filter
      if (expeditionFilter !== 'All' && p.expeditionId !== expeditionFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'All' && p.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [personnelList, searchQuery, stationFilter, expeditionFilter, statusFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setStationFilter('All')
    setExpeditionFilter('All')
    setStatusFilter('All')
  }

  const isFiltered =
    searchQuery.trim() !== '' ||
    stationFilter !== 'All' ||
    expeditionFilter !== 'All' ||
    statusFilter !== 'All'

  // Summary counts
  const atStationCount = personnelList.filter((p) => p.status === 'At Station').length
  const inTransitCount = personnelList.filter((p) => p.status === 'In Transit').length
  const arrivedCount = personnelList.filter((p) => p.status === 'Arrived').length
  const transferredCount = personnelList.filter((p) => p.status === 'Transferred').length

  const getStatusBadgeVariant = (status: PersonnelStatus) => {
    switch (status) {
      case 'At Station':
      case 'Arrived':
        return 'operational'
      case 'In Transit':
        return 'info'
      case 'Transferred':
        return 'neutral'
      case 'Unavailable':
      default:
        return 'critical'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Personnel Movement & Rosters</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Inter-station field movement tracking, airlift itineraries, medical readiness, and polar cadre rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPersonnelData}
            isLoading={isLoading}
            iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh personnel records from PostgreSQL database"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSubmitError(null)
              setIsMovementModalOpen(true)
            }}
            iconLeft={<Plus className="w-3.5 h-3.5" />}
          >
            Log Personnel Movement
          </Button>
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
            onClick={loadPersonnelData}
            iconLeft={<RefreshCw className="w-3 h-3" />}
          >
            Retry Database Query
          </Button>
        </div>
      )}

      {/* 2. OPERATIONAL SUMMARY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>At Base Station</span>
            <Users className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-sans text-slate-900">{atStationCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Maitri, Bharati & Himadri</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>In Active Transit</span>
            <Navigation className="w-3.5 h-3.5 text-[#018ABE]" />
          </div>
          <div className="mt-1 text-2xl font-bold font-sans text-[#02457A]">{inTransitCount}</div>
          <div className="text-[11px] text-blue-700 mt-0.5 font-mono">Flight & Sledge Traverses</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Arrived & Cleared</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-sans text-slate-900">{arrivedCount + atStationCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">100% Medical Cleared</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Transferred / Relieved</span>
            <Ship className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-1 text-2xl font-bold font-sans text-slate-900">{transferredCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Retrograde Rotation Cohort</div>
        </div>
      </div>

      {/* 3. SEARCH & MULTI-FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search personnel by ID, name, role, station, destination, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A] focus:bg-white placeholder:text-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Station Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Station:</span>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              >
                <option value="All">All Sectors</option>
                <option value="Maitri">Maitri Base / Oasis</option>
                <option value="Bharati">Bharati Base</option>
                <option value="Himadri">Himadri (Arctic)</option>
                <option value="En Route">In Transit / En Route</option>
              </select>
            </div>

            {/* Expedition Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expedition:</span>
              <select
                value={expeditionFilter}
                onChange={(e) => setExpeditionFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              >
                <option value="All">All Expeditions</option>
                {availableExpeditions.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.id} ({exp.name.length > 25 ? `${exp.name.slice(0, 25)}...` : exp.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              >
                <option value="All">All Statuses</option>
                <option value="At Station">At Station</option>
                <option value="In Transit">In Transit</option>
                <option value="Arrived">Arrived</option>
                <option value="Transferred">Transferred</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            {isFiltered && (
              <Button variant="ghost" size="xs" onClick={clearFilters} iconLeft={<X className="w-3 h-3" />}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. PERSONNEL TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Personnel Movement Registry
          </span>
          <span className="font-mono font-medium">
            {isLoading ? 'Querying database...' : `Showing ${filteredPersonnel.length} of ${personnelList.length} Roster Records`}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3 shadow-xs">
            <Loader2 className="w-7 h-7 text-[#02457A] animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-700">Connecting to PostgreSQL database...</div>
            <p className="text-[11px] text-slate-400">Fetching live personnel records and rosters.</p>
          </div>
        ) : filteredPersonnel.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-slate-400" />}
            title="No personnel matching criteria"
            description={
              error
                ? `Unable to load personnel: ${error}`
                : isFiltered
                ? "No personnel record matches the search keyword or active filters. Reset filters to view all."
                : "No personnel records are currently recorded in the database."
            }
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : error ? (
                <Button variant="secondary" size="sm" onClick={loadPersonnelData} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
                  Retry Query
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personnel ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expedition</TableHead>
                <TableHead>Current Station</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Expected Arrival</TableHead>
                <TableHead>Transport Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonnel.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => navigate(`/personnel/${p.id}`)}
                  className="cursor-pointer hover:bg-slate-50/90 transition-colors"
                >
                  <TableCell mono className="font-bold text-[#001B48]">
                    {p.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{p.organization}</div>
                  </TableCell>
                  <TableCell className="text-slate-800 text-xs font-semibold">{p.role}</TableCell>
                  <TableCell mono className="text-slate-700 text-xs">
                    {p.expeditionId}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800 text-xs">
                    {p.currentStation}
                  </TableCell>
                  <TableCell className="text-slate-700 text-xs">{p.destination}</TableCell>
                  <TableCell mono className="text-slate-600 text-[11px]">
                    {p.departure}
                  </TableCell>
                  <TableCell mono className="text-slate-600 text-[11px]">
                    {p.expectedArrival}
                  </TableCell>
                  <TableCell className="text-slate-700 text-xs">
                    <div className="flex items-center gap-1.5">
                      {p.transportMode.includes('Air') ? (
                        <Plane className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      ) : p.transportMode.includes('Traverse') ? (
                        <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : p.transportMode.includes('Vasily') ? (
                        <Ship className="w-3.5 h-3.5 text-[#02457A] shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate max-w-[130px] font-medium">{p.transportMode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(p.status)} size="sm" withDot>
                      {p.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/personnel/${p.id}`)
                      }}
                      iconLeft={<Eye className="w-3.5 h-3.5" />}
                    >
                      Dossier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 5. LOG PERSONNEL MOVEMENT MODAL */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false)
          resetForm()
        }}
        title="Log Personnel Movement Manifest"
        description="Register an inter-station transfer, field traverse deployment, or flight passenger itinerary."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsMovementModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRegisterMovement}
              isLoading={isSubmitting}
            >
              Post Movement Order
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegisterMovement} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-850 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900">Failed to register movement:</span>{' '}
                <span className="text-rose-800">{submitError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Verma"
                value={movementForm.name}
                onChange={(e) => {
                  setMovementForm({ ...movementForm, name: e.target.value })
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

            {/* Role */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Role / Field Assignment <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Glaciologist"
                value={movementForm.role}
                onChange={(e) => {
                  setMovementForm({ ...movementForm, role: e.target.value })
                  if (formErrors.role) setFormErrors({ ...formErrors, role: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  formErrors.role
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                }`}
              />
              {formErrors.role && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.role}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Deputed Org */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Deputed Institution
              </label>
              <input
                type="text"
                placeholder="e.g. NCPOR Goa / Survey of India"
                value={movementForm.organization}
                onChange={(e) => setMovementForm({ ...movementForm, organization: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              />
            </div>

            {/* Campaign */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campaign Mandate
              </label>
              {expeditionsError ? (
                <div className="text-[11px] text-rose-600 font-medium p-2 bg-rose-50 border border-rose-200 rounded-md">
                  {expeditionsError}
                </div>
              ) : availableExpeditions.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic p-2 bg-slate-50 border border-slate-200 rounded-md">
                  Loading active campaigns...
                </div>
              ) : (
                <select
                  value={movementForm.expeditionId}
                  onChange={(e) => setMovementForm({ ...movementForm, expeditionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
                >
                  {availableExpeditions.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.id} · {exp.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Origin Station */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Origin Station / Outpost
              </label>
              <select
                value={movementForm.currentStation}
                onChange={(e) => setMovementForm({ ...movementForm, currentStation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              >
                <option value="Maitri Base">Maitri Base (Queen Maud Land)</option>
                <option value="Bharati Base">Bharati Base (Larsemann Hills)</option>
                <option value="Himadri Station">Himadri Station (Arctic)</option>
                <option value="Cape Town Staging Terminal">Cape Town Staging Terminal</option>
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Destination Outpost / Sector <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bharati Base or Schirmacher Waypoint 14"
                value={movementForm.destination}
                onChange={(e) => {
                  setMovementForm({ ...movementForm, destination: e.target.value })
                  if (formErrors.destination) setFormErrors({ ...formErrors, destination: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  formErrors.destination
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                }`}
              />
              {formErrors.destination && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.destination}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Transport Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Transport Mode
              </label>
              <select
                value={movementForm.transportMode}
                onChange={(e) =>
                  setMovementForm({ ...movementForm, transportMode: e.target.value as PersonnelTransportMode })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              >
                <option value="Basler BT-67 Air Lift">Basler BT-67 Air Lift</option>
                <option value="Twin Otter Feeder">Twin Otter Feeder</option>
                <option value="PistenBully Sledge Traverse">PistenBully Sledge Traverse</option>
                <option value="Helicopter Shuttle">Helicopter Shuttle</option>
                <option value="MV Vasily Golovnin">MV Vasily Golovnin</option>
              </select>
            </div>

            {/* Departure */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Departure Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={movementForm.departure}
                onChange={(e) => {
                  setMovementForm({ ...movementForm, departure: e.target.value })
                  if (formErrors.departure) setFormErrors({ ...formErrors, departure: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  formErrors.departure
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                }`}
              />
              {formErrors.departure && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.departure}</p>
              )}
            </div>

            {/* Expected Arrival */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Arrival <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={movementForm.expectedArrival}
                onChange={(e) => {
                  setMovementForm({ ...movementForm, expectedArrival: e.target.value })
                  if (formErrors.expectedArrival) setFormErrors({ ...formErrors, expectedArrival: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  formErrors.expectedArrival
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                }`}
              />
              {formErrors.expectedArrival && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.expectedArrival}</p>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
