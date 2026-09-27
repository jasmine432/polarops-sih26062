import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  ShieldAlert,
  AlertTriangle,
  Radio,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  CheckCircle2,
  Users,
  Package,
  Clock,
  MapPin,
  ExternalLink,
  PhoneCall,
  Activity,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react'
import {
  INITIAL_INCIDENTS_DATA,
  IncidentRecord,
  IncidentSeverity,
  IncidentResponseStatus,
} from '@/data/emergencyData'
import {
  fetchEmergencyIncidentsList,
  createEmergencyIncident,
} from '@/services/emergencyIncidentService'

export const EmergencyPage: React.FC = () => {
  const navigate = useNavigate()

  // Master Incidents State (Loaded from PostgreSQL)
  const [incidents, setIncidents] = useState<IncidentRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // Create Incident Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    dateTime: '',
    severity: 'High' as IncidentSeverity,
    personnelAffected: '0',
    cargoAffected: '0',
    description: '',
    assignedUnit: 'Maitri Station SAR Unit',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch incidents from PostgreSQL
  const loadIncidents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchEmergencyIncidentsList()
      setIncidents(data)
    } catch (err: any) {
      console.error('Failed to load incidents from PostgreSQL:', err)
      setError(err?.message || 'Failed to connect to emergency response database.')
      // Fallback to initial data if offline / initial load error
      if (incidents.length === 0) {
        setIncidents(INITIAL_INCIDENTS_DATA)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIncidents()
  }, [loadIncidents])

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.type.trim()) errors.type = 'Incident type is required'
    if (!formData.location.trim()) errors.location = 'Location / Sector is required'
    if (!formData.description.trim()) errors.description = 'Description of the situation is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle create incident via PostgreSQL backend
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const nextSeq = Math.floor(6 + Math.random() * 90)
      const nextId = `INC-2026-${nextSeq < 10 ? '0' + nextSeq : nextSeq}`
      const nowStr = formData.dateTime || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'

      const newRecord: IncidentRecord = {
        id: nextId,
        time: `${nowStr} (Just logged)`,
        location: formData.location.trim(),
        type: formData.type.trim(),
        severity: formData.severity,
        personnelAffectedCount: parseInt(formData.personnelAffected, 10) || 0,
        cargoAffectedCount: parseInt(formData.cargoAffected, 10) || 0,
        responseStatus: 'Reported',
        description: formData.description.trim(),
        expeditionId: 'EXP-2026-014',
        expeditionName: '44th Indian Scientific Expedition to Antarctica (ISEA)',
        assignedUnit: formData.assignedUnit.trim(),
        leadOfficer: 'Station Emergency Desk',
        commsFrequency: 'VHF Channel 16 Active',
        coordinates: 'Pending Field Fix',
        affectedPersonnel: [],
        affectedCargo: [],
        responseActions: [
          {
            title: 'Initial Incident Report Logged',
            unit: formData.assignedUnit.trim(),
            time: 'Just now',
            status: 'Acknowledged',
            notes: 'Emergency broadcast dispatched across station watch desk.',
          },
        ],
        timeline: [
          {
            id: `EVT-${Date.now()}`,
            timestamp: nowStr,
            action: `Incident Logged: ${formData.type.trim()}`,
            officer: 'Operations Duty Officer',
            details: formData.description.trim(),
          },
        ],
      }

      // Save to PostgreSQL via API
      const created = await createEmergencyIncident(newRecord)
      setIncidents((prev) => [created, ...prev])
      setIsCreateModalOpen(false)
      setFormData({
        type: '',
        location: '',
        dateTime: '',
        severity: 'High',
        personnelAffected: '0',
        cargoAffected: '0',
        description: '',
        assignedUnit: 'Maitri Station SAR Unit',
      })
      setFormErrors({})
    } catch (err: any) {
      console.error('Failed to create emergency incident in database:', err)
      setSubmitError(err?.message || 'Database error while registering emergency incident.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matches =
          inc.id.toLowerCase().includes(q) ||
          inc.type.toLowerCase().includes(q) ||
          inc.location.toLowerCase().includes(q) ||
          inc.description.toLowerCase().includes(q) ||
          inc.assignedUnit.toLowerCase().includes(q)
        if (!matches) return false
      }

      // Severity filter
      if (severityFilter !== 'All' && inc.severity !== severityFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'All' && inc.responseStatus !== statusFilter) {
        return false
      }

      return true
    })
  }, [incidents, searchQuery, severityFilter, statusFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setSeverityFilter('All')
    setStatusFilter('All')
  }

  const isFiltered = searchQuery.trim() !== '' || severityFilter !== 'All' || statusFilter !== 'All'

  // Summary counts
  const activeIncidentsCount = incidents.filter((i) => i.responseStatus !== 'Resolved').length
  const criticalIncidentsCount = incidents.filter((i) => i.severity === 'Critical' && i.responseStatus !== 'Resolved').length
  const totalPersonnelAffected = incidents
    .filter((i) => i.responseStatus !== 'Resolved')
    .reduce((acc, curr) => acc + curr.personnelAffectedCount, 0)
  const totalCargoAffected = incidents
    .filter((i) => i.responseStatus !== 'Resolved')
    .reduce((acc, curr) => acc + curr.cargoAffectedCount, 0)

  const getSeverityBadgeVariant = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'Critical':
        return 'critical'
      case 'High':
        return 'warning'
      case 'Moderate':
        return 'info'
      case 'Low':
      default:
        return 'neutral'
    }
  }

  const getStatusBadgeVariant = (status: IncidentResponseStatus) => {
    switch (status) {
      case 'Resolved':
        return 'operational'
      case 'Responding':
        return 'critical'
      case 'Acknowledged':
        return 'warning'
      case 'Reported':
      default:
        return 'info'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Emergency Response & Incident Management
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Operational Search & Rescue (SAR) incident monitoring, field safety directives, and hazard management backed by PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadIncidents}
            disabled={isLoading}
            iconLeft={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            {isLoading ? 'Syncing...' : 'Sync Data'}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setSubmitError(null)
              setIsCreateModalOpen(true)
            }}
            iconLeft={<Plus className="w-3.5 h-3.5" />}
          >
            Create Incident
          </Button>
        </div>
      </div>

      {/* ERROR BANNER IF ANY */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="xs" onClick={loadIncidents}>
            Retry
          </Button>
        </div>
      )}

      {/* 2. TOP SECTION: 4 COMPACT OPERATIONAL SUMMARY BLOCKS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Critical Incidents Count (Deep Navy / High Contrast) */}
        <div className="bg-[#001B48] border border-[#001B48] rounded-lg p-5 shadow-xs text-white flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Critical Incidents</span>
              <span className="text-[9px] text-emerald-400 font-sans flex items-center gap-0.5">
                <Database className="w-2.5 h-2.5" /> DB
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold font-sans text-white">
              {criticalIncidentsCount}
            </div>
          </div>
          <div className="text-[11px] text-rose-300 mt-2 pt-2 border-t border-white/10 font-mono font-medium">
            {criticalIncidentsCount > 0 ? 'High Priority SAR Active' : 'Zero Active Emergencies'}
          </div>
        </div>

        {/* Active Incidents Count */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Active Incidents
            </div>
            <div className="mt-2 text-2xl font-bold font-sans text-slate-900">
              {activeIncidentsCount} <span className="text-xs font-medium text-slate-500">Open</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono font-medium">
            {incidents.length - activeIncidentsCount} Resolved in past 30d
          </div>
        </div>

        {/* Personnel Affected */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Personnel Affected
            </div>
            <div className="mt-2 text-2xl font-bold font-sans text-slate-900">
              {totalPersonnelAffected} <span className="text-xs font-medium text-slate-500">Persons</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono font-medium">
            Field vitals confirmed safe
          </div>
        </div>

        {/* Cargo Affected */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Cargo Units Impacted
            </div>
            <div className="mt-2 text-2xl font-bold font-sans text-slate-900">
              {totalCargoAffected} <span className="text-xs font-medium text-slate-500">Units</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono font-medium">
            Consignments secured
          </div>
        </div>
      </div>

      {/* 3. SEARCH & MULTI-FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search incidents by ID, type, location, or response unit..."
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
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Response Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Response Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              >
                <option value="All">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Responding">Responding</option>
                <option value="Resolved">Resolved</option>
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

      {/* 4. INCIDENTS TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span>Incident Response Log</span>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
              <Database className="w-3 h-3" /> PostgreSQL
            </span>
          </span>
          <span className="font-mono font-medium">
            Showing {filteredIncidents.length} of {incidents.length} Records
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center bg-white border border-slate-200 rounded-lg text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#018ABE]" />
            <span>Loading emergency incidents from PostgreSQL database...</span>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="w-8 h-8 text-slate-400" />}
            title="No emergency incidents found"
            description="No incidents match the active search or filter criteria."
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Personnel Affected</TableHead>
                <TableHead>Cargo Affected</TableHead>
                <TableHead>Response Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((inc) => (
                <TableRow
                  key={inc.id}
                  onClick={() => navigate(`/emergency/${inc.id}`)}
                  className={`cursor-pointer transition-colors ${
                    inc.severity === 'Critical'
                      ? 'bg-rose-50/30 hover:bg-rose-50/60 border-l-4 border-l-rose-600'
                      : inc.severity === 'High'
                      ? 'bg-amber-50/20 hover:bg-amber-50/40 border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50/90'
                  }`}
                >
                  <TableCell mono className="font-bold text-[#001B48]">
                    {inc.id}
                  </TableCell>
                  <TableCell mono className="text-slate-600 text-[11px]">
                    {inc.time}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 text-xs">{inc.location}</TableCell>
                  <TableCell className="font-bold text-slate-900 max-w-[220px]">
                    <div className="truncate">{inc.type}</div>
                    <div className="text-[10px] text-slate-500 font-medium truncate">
                      Unit: {inc.assignedUnit}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityBadgeVariant(inc.severity)} size="sm" withDot>
                      {inc.severity.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell mono className="text-slate-800 font-bold text-xs">
                    {inc.personnelAffectedCount > 0 ? (
                      <span className="text-rose-800 font-bold">{inc.personnelAffectedCount} Persons</span>
                    ) : (
                      <span className="text-slate-400 font-normal">0</span>
                    )}
                  </TableCell>
                  <TableCell mono className="text-slate-800 text-xs">
                    {inc.cargoAffectedCount > 0 ? (
                      <span className="font-semibold text-slate-900">{inc.cargoAffectedCount} Units</span>
                    ) : (
                      <span className="text-slate-400 font-normal">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(inc.responseStatus)} size="sm" withDot>
                      {inc.responseStatus.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/emergency/${inc.id}`)
                      }}
                      iconLeft={<Eye className="w-3 h-3" />}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 5. CREATE INCIDENT MODAL / FORM */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setFormErrors({})
          setSubmitError(null)
        }}
        title="Declare Operational Emergency / Log Incident"
        description="Register an active SAR event, traverse delay, medical emergency, or equipment hazard in PostgreSQL."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false)
                setFormErrors({})
                setSubmitError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCreateIncident}
              isLoading={isSubmitting}
            >
              Broadcast Incident Entry
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Incident Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Incident Type <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Overdue Field Traverse / Severe Whiteout"
                value={formData.type}
                onChange={(e) => {
                  setFormData({ ...formData, type: e.target.value })
                  if (formErrors.type) setFormErrors({ ...formErrors, type: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  formErrors.type
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
                }`}
              />
              {formErrors.type && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.type}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Location / Sector <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Schirmacher Oasis (Waypoint 14)"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Severity */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Severity Level
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as IncidentSeverity })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              >
                <option value="Critical">Critical (Immediate Danger)</option>
                <option value="High">High (Urgent SAR Action)</option>
                <option value="Moderate">Moderate (Contained Risk)</option>
                <option value="Low">Low (Advisory Log)</option>
              </select>
            </div>

            {/* Personnel Affected */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Personnel Affected (Count)
              </label>
              <input
                type="number"
                min="0"
                value={formData.personnelAffected}
                onChange={(e) => setFormData({ ...formData, personnelAffected: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              />
            </div>

            {/* Cargo Affected */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cargo Affected (Count)
              </label>
              <input
                type="number"
                min="0"
                value={formData.cargoAffected}
                onChange={(e) => setFormData({ ...formData, cargoAffected: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Assigned Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned SAR / Response Unit
              </label>
              <input
                type="text"
                placeholder="e.g. Maitri SAR Sledge Unit PB-01"
                value={formData.assignedUnit}
                onChange={(e) => setFormData({ ...formData, assignedUnit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              />
            </div>

            {/* Date Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date & Time (Optional / Auto)
              </label>
              <input
                type="text"
                placeholder="Auto-populated with current UTC"
                value={formData.dateTime}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description of Emergency & Action Required <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe event circumstances, weather condition, shelter status, and immediate SAR directives..."
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value })
                if (formErrors.description) setFormErrors({ ...formErrors, description: '' })
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                formErrors.description
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-[#018ABE]/20 focus:border-[#02457A]'
              }`}
            />
            {formErrors.description && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{formErrors.description}</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  )
}
