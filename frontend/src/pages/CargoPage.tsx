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
  Package,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  AlertTriangle,
  Ship,
  Plane,
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  ExternalLink,
  Shield,
  Edit,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import {
  CargoRecord,
  CargoStatus,
  CargoPriority,
  TransportMode,
  TIMELINE_STAGES,
} from '@/data/cargoData'
import {
  fetchCargoList,
  createCargo,
  CargoApiPayload,
} from '@/services/cargoService'

export const CargoPage: React.FC = () => {
  const navigate = useNavigate()

  // Master cargo state
  const [cargoList, setCargoList] = useState<CargoRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [priorityFilter, setPriorityFilter] = useState<string>('All')
  const [destinationFilter, setDestinationFilter] = useState<string>('All')

  // Selected cargo for quick inspection modal
  const [inspectCargo, setInspectCargo] = useState<CargoRecord | null>(null)

  // Add cargo modal & form
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    category: 'Machinery Spares' as CargoRecord['category'],
    weight: '',
    origin: 'Cape Town Staging Port',
    destination: 'Maitri Ice Shelf Berth',
    transportMode: 'Polar Vessel' as TransportMode,
    carrier: 'MV Vasily Golovnin',
    priority: 'Standard' as CargoPriority,
    expectedArrival: '',
    expeditionId: 'EXP-2026-014',
    hazmat: 'Non-Hazardous',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quick Status update modal state
  const [statusModalCargo, setStatusModalCargo] = useState<CargoRecord | null>(null)
  const [targetStatus, setTargetStatus] = useState<CargoStatus>('In Transit')
  const [statusReason, setStatusReason] = useState('')

  // Load cargo from database API
  const loadCargoData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchCargoList()
      setCargoList(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load cargo records from database.')
      setCargoList([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCargoData()
  }, [])

  // Form Validation
  const validateAddForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.description.trim()) {
      errors.description = 'Cargo description is required'
    } else if (formData.description.trim().length < 5) {
      errors.description = 'Description must be at least 5 characters'
    }

    if (!formData.weight.trim()) {
      errors.weight = 'Gross weight is required (e.g. 4.2 MT or 800 kg)'
    }

    if (!formData.origin.trim()) {
      errors.origin = 'Origin staging port is required'
    }

    if (!formData.destination.trim()) {
      errors.destination = 'Destination base or berth is required'
    }

    if (!formData.expectedArrival.trim()) {
      errors.expectedArrival = 'Expected arrival date is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Add Cargo with database persistence
  const handleAddCargo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAddForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    const weightMatch = formData.weight.match(/^([\d.]+)\s*(.*)$/)
    const parsedWeight = weightMatch ? parseFloat(weightMatch[1]) : (parseFloat(formData.weight) || 0)
    const parsedUnit = weightMatch && weightMatch[2] ? weightMatch[2].trim() : 'MT'

    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const nextId = `CRG-${randomSuffix}`

    const payload: CargoApiPayload = {
      cargo_id: nextId,
      description: formData.description.trim(),
      category: formData.category,
      weight: isNaN(parsedWeight) ? null : parsedWeight,
      weight_unit: parsedUnit || 'MT',
      origin: formData.origin.trim(),
      destination: formData.destination.trim(),
      transport_mode: formData.transportMode,
      priority: formData.priority,
      arrival_date: formData.expectedArrival ? formData.expectedArrival.split(' ')[0] : null,
      status: 'Planned',
    }

    try {
      await createCargo(payload)
      await loadCargoData()
      setIsAddModalOpen(false)
      setFormData({
        description: '',
        category: 'Machinery Spares',
        weight: '',
        origin: 'Cape Town Staging Port',
        destination: 'Maitri Ice Shelf Berth',
        transportMode: 'Polar Vessel',
        carrier: 'MV Vasily Golovnin',
        priority: 'Standard',
        expectedArrival: '',
        expeditionId: 'EXP-2026-014',
        hazmat: 'Non-Hazardous',
        notes: '',
      })
      setFormErrors({})
      setSubmitError(null)
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to register cargo consignment in database.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Quick Status Update
  const handleQuickStatusUpdate = () => {
    if (!statusModalCargo) return

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
    const updatedList = cargoList.map((c) => {
      if (c.id === statusModalCargo.id) {
        let actualArr = c.actualArrival
        if (targetStatus === 'Received' && !actualArr) {
          actualArr = nowStr
        }

        const newLog = {
          timestamp: nowStr,
          action: `Status Updated to: ${targetStatus}`,
          officer: 'Logistics Operations Desk',
          details: statusReason.trim() || `Status updated via Cargo Operations Panel.`,
        }

        return {
          ...c,
          status: targetStatus,
          actualArrival: actualArr,
          timeline: [newLog, ...c.timeline],
        }
      }
      return c
    })

    setCargoList(updatedList)
    if (inspectCargo && inspectCargo.id === statusModalCargo.id) {
      setInspectCargo({
        ...inspectCargo,
        status: targetStatus,
      })
    }
    setStatusModalCargo(null)
    setStatusReason('')
  }

  // Filtered Cargo items
  const filteredCargo = useMemo(() => {
    return cargoList.filter((c) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          c.id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.origin.toLowerCase().includes(q) ||
          c.destination.toLowerCase().includes(q) ||
          c.carrier.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        if (!match) return false
      }

      // Status filter
      if (statusFilter !== 'All' && c.status !== statusFilter) {
        return false
      }

      // Priority filter
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) {
        return false
      }

      // Destination filter
      if (destinationFilter !== 'All' && !c.destination.toLowerCase().includes(destinationFilter.toLowerCase())) {
        return false
      }

      return true
    })
  }, [cargoList, searchQuery, statusFilter, priorityFilter, destinationFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('All')
    setPriorityFilter('All')
    setDestinationFilter('All')
  }

  const isFiltered =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All' ||
    destinationFilter !== 'All'

  // Summary counts
  const delayedCount = cargoList.filter((c) => c.status === 'Delayed').length
  const inTransitCount = cargoList.filter((c) => c.status === 'In Transit').length
  const receivedCount = cargoList.filter((c) => c.status === 'Received').length

  const getStatusBadgeVariant = (status: CargoStatus) => {
    switch (status) {
      case 'Received':
      case 'Arrived':
        return 'operational'
      case 'Delayed':
        return 'critical'
      case 'In Transit':
      case 'Loaded':
        return 'info'
      case 'Packed':
      case 'Planned':
      default:
        return 'neutral'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-[#02457A]" />
            Cargo Logistics & Manifest Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            End-to-end expedition freight tracking, port staging, and polar station consignment dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCargoData}
            isLoading={isLoading}
            iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh cargo records from database"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSubmitError(null)
              setIsAddModalOpen(true)
            }}
            iconLeft={<Plus className="w-3.5 h-3.5" />}
          >
            Add Cargo
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
            onClick={loadCargoData}
            iconLeft={<RefreshCw className="w-3 h-3" />}
          >
            Retry Database Query
          </Button>
        </div>
      )}

      {/* 2. OPERATIONAL SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Total Consignments</span>
            <Package className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {isLoading ? '...' : cargoList.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">PostgreSQL Database Tracked</div>
        </div>

        <div className="bg-white border border-slate-200 border-l-4 border-l-[#02457A] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>In Transit</span>
            <Ship className="w-3.5 h-3.5 text-[#02457A]" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {isLoading ? '...' : inTransitCount}
          </div>
          <div className="text-[11px] text-[#02457A] mt-0.5 font-semibold">Sea & Air Feeder Routes</div>
        </div>

        <div
          className={`bg-white border rounded-lg p-4 shadow-xs ${
            delayedCount > 0
              ? 'border-slate-200 border-l-4 border-l-rose-600 bg-rose-50/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Delayed Cargo</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${delayedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-rose-900">
            {isLoading ? '...' : delayedCount}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5 font-semibold">Action Required (Customs/Hold)</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Received at Station</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {isLoading ? '...' : receivedCount}
          </div>
          <div className="text-[11px] text-emerald-800 mt-0.5 font-mono">Intake Verified</div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cargo by ID, description, origin, destination, or carrier..."
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
                <option value="Planned">Planned</option>
                <option value="Packed">Packed</option>
                <option value="Loaded">Loaded</option>
                <option value="In Transit">In Transit</option>
                <option value="Arrived">Arrived</option>
                <option value="Received">Received</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 font-mono">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Standard">Standard</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Destination Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 font-mono">Destination:</span>
              <select
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Destinations</option>
                <option value="Maitri">Maitri Base / Ice Shelf</option>
                <option value="Bharati">Bharati Base / Vehicle Bay</option>
                <option value="Himadri">Himadri Station (Arctic)</option>
                <option value="ORV Sagar Kanya">ORV Sagar Kanya Hold</option>
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

      {/* 4. CARGO DATA TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            Master Cargo Manifest Roster
          </span>
          <span className="font-mono">
            {isLoading ? 'Querying database...' : `Showing ${filteredCargo.length} of ${cargoList.length} Consignments`}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3 shadow-xs">
            <Loader2 className="w-7 h-7 text-[#02457A] animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-700">Connecting to PostgreSQL database...</div>
            <p className="text-[11px] text-slate-400">Fetching live polar cargo consignment records.</p>
          </div>
        ) : filteredCargo.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-slate-400" />}
            title="No cargo manifests found"
            description={
              error
                ? `Unable to load manifests: ${error}`
                : isFiltered
                ? "No consignment matches the search or filter parameters. Adjust criteria or clear filters."
                : "No cargo consignments are currently recorded in the database."
            }
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear Search & Filters
                </Button>
              ) : error ? (
                <Button variant="secondary" size="sm" onClick={loadCargoData} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
                  Retry Query
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Transport Mode</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Expected Arrival</TableHead>
                <TableHead>Actual Arrival</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCargo.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => navigate(`/cargo/${c.id}`)}
                  className={`cursor-pointer transition-colors ${
                    c.status === 'Delayed'
                      ? 'bg-rose-50/30 hover:bg-rose-50/60 border-l-2 border-l-rose-600'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <TableCell mono className="font-bold text-slate-900">
                    {c.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 max-w-[200px]">
                    <div className="truncate font-bold">{c.description}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Carrier: {c.carrier}</div>
                  </TableCell>
                  <TableCell className="text-slate-700 text-xs font-medium">{c.category}</TableCell>
                  <TableCell mono className="text-slate-900 font-bold text-xs">
                    {c.weight}
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">{c.origin}</TableCell>
                  <TableCell className="font-semibold text-slate-800 text-xs">{c.destination}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                      {c.transportMode === 'Polar Vessel' ? (
                        <Ship className="w-3.5 h-3.5 text-[#02457A] shrink-0" />
                      ) : (
                        <Plane className="w-3.5 h-3.5 text-[#018ABE] shrink-0" />
                      )}
                      <span>{c.transportMode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${
                        c.priority === 'Critical'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : c.priority === 'High'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </TableCell>
                  <TableCell mono className="text-slate-700 text-[11px]">
                    {c.expectedArrival}
                  </TableCell>
                  <TableCell mono className="text-slate-700 text-[11px]">
                    {c.actualArrival || <span className="text-slate-400 font-normal italic">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(c.status)} size="sm" withDot>
                      {c.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setStatusModalCargo(c)
                          setTargetStatus(c.status)
                        }}
                        iconLeft={<Edit className="w-3 h-3" />}
                        title="Update status"
                      >
                        Status
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => navigate(`/cargo/${c.id}`)}
                        iconLeft={<Eye className="w-3 h-3" />}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 5. ADD CARGO MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setFormErrors({})
          setSubmitError(null)
        }}
        title="Register Cargo Consignment"
        description="Add a new container, fuel tank, or air freight pallet to the polar logistics dispatch manifest."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false)
                setFormErrors({})
                setSubmitError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddCargo}
              isLoading={isSubmitting}
            >
              Register Manifest
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCargo} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-850 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900">Failed to register cargo:</span>{' '}
                <span className="text-rose-800">{submitError}</span>
              </div>
            </div>
          )}
          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
              Cargo Item Description <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ultra-Low Sulfur Arctic Diesel (20,000L ISO Tank)"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value })
                if (formErrors.description) setFormErrors({ ...formErrors, description: '' })
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                formErrors.description
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-[#02457A]'
              }`}
            />
            {formErrors.description && (
              <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              >
                <option value="Fuel & Hydrocarbons">Fuel & Hydrocarbons</option>
                <option value="Machinery Spares">Machinery Spares</option>
                <option value="Scientific Instrumentation">Scientific Instrumentation</option>
                <option value="Provisions & Food">Provisions & Food</option>
                <option value="Medical Supplies">Medical Supplies</option>
                <option value="Structural & Habitat">Structural & Habitat</option>
              </select>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Gross Weight <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 18.4 MT or 850 kg"
                value={formData.weight}
                onChange={(e) => {
                  setFormData({ ...formData, weight: e.target.value })
                  if (formErrors.weight) setFormErrors({ ...formErrors, weight: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.weight
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.weight && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.weight}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as CargoPriority })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Standard">Standard</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Origin */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Origin / Staging Port <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cape Town Berth 7 or Mormugao Port Goa"
                value={formData.origin}
                onChange={(e) => {
                  setFormData({ ...formData, origin: e.target.value })
                  if (formErrors.origin) setFormErrors({ ...formErrors, origin: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.origin
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.origin && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.origin}</p>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Destination Base / Berth <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              >
                <option value="Maitri Ice Shelf Berth">Maitri Ice Shelf Berth</option>
                <option value="Maitri Station Hub">Maitri Station Hub</option>
                <option value="Bharati Vehicle Bay">Bharati Vehicle Bay</option>
                <option value="Bharati Power Module">Bharati Power Module</option>
                <option value="Bharati Research Lab">Bharati Research Lab</option>
                <option value="Himadri Marine Lab">Himadri Marine Lab (Arctic)</option>
                <option value="ORV Sagar Kanya Hold">ORV Sagar Kanya Hold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Transport Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Transport Mode
              </label>
              <select
                value={formData.transportMode}
                onChange={(e) => setFormData({ ...formData, transportMode: e.target.value as TransportMode })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              >
                <option value="Polar Vessel">Polar Vessel</option>
                <option value="Air Cargo">Air Cargo</option>
                <option value="Ice Traverse Sledge">Ice Traverse Sledge</option>
                <option value="Helicopter Sling">Helicopter Sling</option>
              </select>
            </div>

            {/* Carrier */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Assigned Carrier
              </label>
              <input
                type="text"
                placeholder="e.g. MV Vasily Golovnin or BT-67"
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              />
            </div>

            {/* Expected Arrival */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Target ETA Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={formData.expectedArrival}
                onChange={(e) => {
                  setFormData({ ...formData, expectedArrival: e.target.value })
                  if (formErrors.expectedArrival) setFormErrors({ ...formErrors, expectedArrival: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.expectedArrival
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.expectedArrival && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.expectedArrival}</p>
              )}
            </div>
          </div>

          {/* Expedition Link */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
              Assigned Campaign
            </label>
            <select
              value={formData.expeditionId}
              onChange={(e) => setFormData({ ...formData, expeditionId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
            >
              <option value="EXP-2026-014">EXP-2026-014 · 44th ISEA (Antarctica)</option>
              <option value="EXP-2026-015">EXP-2026-015 · Indian Arctic Campaign (Himadri)</option>
              <option value="EXP-2026-016">EXP-2026-016 · Southern Ocean Paleoclimate Marine Cruise</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
              Handling Requirements / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Temperature-controlled containment, special sling rigging..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
            />
          </div>
        </form>
      </Modal>

      {/* 6. QUICK UPDATE STATUS MODAL */}
      {statusModalCargo && (
        <Modal
          isOpen={!!statusModalCargo}
          onClose={() => {
            setStatusModalCargo(null)
            setStatusReason('')
          }}
          title={`Update Status: ${statusModalCargo.id}`}
          description={`Current: ${statusModalCargo.status} · ${statusModalCargo.description}`}
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusModalCargo(null)
                  setStatusReason('')
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleQuickStatusUpdate}>
                Save Status Change
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                New Cargo Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as CargoStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              >
                <option value="Planned">Planned</option>
                <option value="Packed">Packed</option>
                <option value="Loaded">Loaded</option>
                <option value="In Transit">In Transit</option>
                <option value="Arrived">Arrived</option>
                <option value="Received">Received</option>
                <option value="Delayed">Delayed (Flag Operational Hold)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Audit Log Reason
              </label>
              <textarea
                rows={3}
                placeholder="Describe reason for status transition (e.g. Vessel berthed, customs cleared, transfer in progress)..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
