import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Compass,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Package,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Eye,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { ExpeditionDetail } from '@/data/expeditionsData'
import {
  fetchExpeditionsList,
  createExpedition,
  ExpeditionApiPayload,
} from '@/services/expeditionService'

export const ExpeditionsPage: React.FC = () => {
  const navigate = useNavigate()

  // Master expeditions list state from PostgreSQL Database
  const [expeditions, setExpeditions] = useState<ExpeditionDetail[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [stationFilter, setStationFilter] = useState<string>('All')
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('All')

  // Create Expedition Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    station: 'Maitri & Bharati',
    startDate: '',
    endDate: '',
    lead: '',
    personnelCount: '',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Expeditions data from PostgreSQL backend API
  const loadExpeditionsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchExpeditionsList()
      setExpeditions(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load expeditions from database.')
      setExpeditions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadExpeditionsData()
  }, [])

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      station: 'Maitri & Bharati',
      startDate: '',
      endDate: '',
      lead: '',
      personnelCount: '',
      notes: '',
    })
    setFormErrors({})
    setSubmitError(null)
  }

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Expedition name is required'
    } else if (formData.name.trim().length < 5) {
      errors.name = 'Expedition name must be at least 5 characters'
    }

    if (!formData.station) {
      errors.station = 'Station assignment is required'
    }

    if (!formData.lead.trim()) {
      errors.lead = 'Expedition Lead name is required'
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required'
    }

    if (!formData.endDate) {
      errors.endDate = 'Expected end date is required'
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End date cannot be prior to start date'
    }

    const personnelNum = parseInt(formData.personnelCount, 10)
    if (!formData.personnelCount) {
      errors.personnelCount = 'Personnel count is required'
    } else if (isNaN(personnelNum) || personnelNum <= 0) {
      errors.personnelCount = 'Personnel count must be a positive number'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Form Submit with PostgreSQL persistence
  const handleCreateExpedition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    const payload: ExpeditionApiPayload = {
      name: formData.name.trim(),
      station: formData.station.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      lead: formData.lead.trim(),
      personnelCount: parseInt(formData.personnelCount, 10) || 1,
      notes: formData.notes.trim(),
      status: 'Planning',
    }

    try {
      await createExpedition(payload)
      await loadExpeditionsData()
      setIsModalOpen(false)
      resetForm()
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to register expedition in database.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Expeditions
  const filteredExpeditions = useMemo(() => {
    return expeditions.filter((exp) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          exp.id.toLowerCase().includes(q) ||
          exp.name.toLowerCase().includes(q) ||
          exp.station.toLowerCase().includes(q) ||
          exp.lead.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'All' && exp.status !== statusFilter) {
        return false
      }

      // Station filter
      if (stationFilter !== 'All') {
        if (stationFilter === 'Maitri & Bharati' && exp.station !== 'Maitri & Bharati') {
          return false
        } else if (stationFilter !== 'Maitri & Bharati' && !exp.station.includes(stationFilter)) {
          return false
        }
      }

      // Date Range filter
      if (dateRangeFilter !== 'All') {
        if (dateRangeFilter === '2026-2027') {
          if (!exp.startDate.startsWith('2026') && !exp.startDate.startsWith('2027')) return false
        } else if (dateRangeFilter === '2025-2026') {
          if (!exp.startDate.startsWith('2025')) return false
        }
      }

      return true
    })
  }, [expeditions, searchQuery, statusFilter, stationFilter, dateRangeFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('All')
    setStationFilter('All')
    setDateRangeFilter('All')
  }

  const isFiltered =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    stationFilter !== 'All' ||
    dateRangeFilter !== 'All'

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#02457A]" />
            Polar Expeditions & Campaigns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Scientific campaigns, polar deployments, and seasonal missions under NCPOR / MoES mandate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadExpeditionsData}
            isLoading={isLoading}
            iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh expeditions from PostgreSQL database"
          >
            Refresh
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
            Create Expedition
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
            onClick={loadExpeditionsData}
            iconLeft={<RefreshCw className="w-3 h-3" />}
          >
            Retry Database Query
          </Button>
        </div>
      )}

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expeditions by ID, name, lead scientist, or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] focus:bg-white placeholder:text-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 font-mono">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Planning">Planning</option>
                <option value="Returning">Returning</option>
                <option value="Concluded">Concluded</option>
              </select>
            </div>

            {/* Station Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 font-mono">Station:</span>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Stations</option>
                <option value="Maitri">Maitri Base</option>
                <option value="Bharati">Bharati Base</option>
                <option value="Maitri & Bharati">Maitri & Bharati (Joint)</option>
                <option value="Himadri">Himadri (Arctic)</option>
                <option value="Prydz Bay Sector">Prydz Bay / Southern Ocean</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 font-mono">Season:</span>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Seasons</option>
                <option value="2026-2027">2026-2027 Campaigns</option>
                <option value="2025-2026">2025-2026 Concluded</option>
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

      {/* 3. EXPEDITIONS TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            Expeditions Register
          </span>
          <span className="font-mono">
            {isLoading ? 'Querying database...' : `Showing ${filteredExpeditions.length} of ${expeditions.length} Total Campaigns`}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3 shadow-xs">
            <Loader2 className="w-7 h-7 text-[#02457A] animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-700">Connecting to PostgreSQL database...</div>
            <p className="text-[11px] text-slate-400">Fetching live polar expedition campaigns.</p>
          </div>
        ) : filteredExpeditions.length === 0 ? (
          <EmptyState
            icon={<Compass className="w-8 h-8 text-slate-400" />}
            title="No matching expeditions"
            description={
              error
                ? `Unable to load expeditions: ${error}`
                : isFiltered
                ? "No expeditions match the specified search or filter criteria. Adjust your query or clear filters."
                : "No expedition campaigns are currently recorded in the database."
            }
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear Search & Filters
                </Button>
              ) : error ? (
                <Button variant="secondary" size="sm" onClick={loadExpeditionsData} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
                  Retry Query
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expedition ID</TableHead>
                <TableHead>Expedition Name</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Personnel</TableHead>
                <TableHead>Cargo Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpeditions.map((exp) => (
                <TableRow
                  key={exp.id}
                  onClick={() => navigate(`/expeditions/${exp.id}`)}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <TableCell mono className="font-bold text-slate-900">
                    {exp.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    <div className="font-bold text-slate-900">{exp.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Lead: <span className="text-slate-700 font-medium">{exp.lead}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-800 font-semibold text-xs">{exp.station}</TableCell>
                  <TableCell mono className="text-slate-700 text-xs">
                    {exp.startDate}
                  </TableCell>
                  <TableCell mono className="text-slate-700 text-xs">
                    {exp.endDate}
                  </TableCell>
                  <TableCell mono className="text-slate-900 font-bold">
                    {exp.personnelCount} staff
                  </TableCell>
                  <TableCell mono className="text-slate-700">
                    {exp.cargoCount} units
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        exp.status === 'Active'
                          ? 'operational'
                          : exp.status === 'Planning'
                          ? 'info'
                          : exp.status === 'Returning'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                      withDot
                    >
                      {exp.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/expeditions/${exp.id}`)
                      }}
                      iconLeft={<Eye className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 4. CREATE EXPEDITION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Register New Polar Expedition Campaign"
        description="Add a sanctioned scientific expedition or station wintering campaign to the NCPOR operational master roster."
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
              onClick={handleCreateExpedition}
              isLoading={isSubmitting}
            >
              Save Campaign
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateExpedition} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-850 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900">Failed to register campaign:</span>{' '}
                <span className="text-rose-800">{submitError}</span>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
              Expedition Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 45th Indian Scientific Expedition to Antarctica"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                formErrors.name
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-[#02457A]'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3 h-3" />
                {formErrors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Station */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Assigned Station <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              >
                <option value="Maitri & Bharati">Maitri & Bharati (Joint Antarctic)</option>
                <option value="Maitri Base">Maitri Base (Schirmacher Oasis)</option>
                <option value="Bharati Base">Bharati Base (Larsemann Hills)</option>
                <option value="Himadri (Ny-Ålesund, Svalbard)">Himadri (Arctic Ny-Ålesund)</option>
                <option value="Prydz Bay Sector">Prydz Bay / Southern Ocean</option>
              </select>
            </div>

            {/* Expedition Lead */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Expedition Lead <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Sharma (NCPOR)"
                value={formData.lead}
                onChange={(e) => {
                  setFormData({ ...formData, lead: e.target.value })
                  if (formErrors.lead) setFormErrors({ ...formErrors, lead: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.lead
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.lead && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.lead}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Start Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value })
                  if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.startDate
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.startDate && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.startDate}</p>
              )}
            </div>

            {/* Expected End Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Expected End Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value })
                  if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.endDate
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.endDate && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.endDate}</p>
              )}
            </div>

            {/* Personnel Count */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Personnel Count <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 42"
                value={formData.personnelCount}
                onChange={(e) => {
                  setFormData({ ...formData, personnelCount: e.target.value })
                  if (formErrors.personnelCount) setFormErrors({ ...formErrors, personnelCount: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.personnelCount
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.personnelCount && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.personnelCount}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
              Mission Objectives & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Brief operational mission objectives, scientific tasks, or special environmental logistics notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
