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
  Scale,
  ShieldCheck,
  ShieldAlert,
  Navigation,
  Cpu,
  Boxes,
  Ship,
  Sparkles,
  LayoutGrid,
  List,
  Check,
  Zap,
  TrendingDown,
  Clock,
  Radio,
} from 'lucide-react'
import { ExpeditionDetail } from '@/data/expeditionsData'
import {
  fetchExpeditionsList,
  createExpedition,
  ExpeditionApiPayload,
  fetchExpeditionMissionControlSummary,
  ExpeditionMissionControlSummary,
} from '@/services/expeditionService'

export const ExpeditionsPage: React.FC = () => {
  const navigate = useNavigate()

  // Master expeditions list state
  const [expeditions, setExpeditions] = useState<ExpeditionDetail[]>([])
  const [summaries, setSummaries] = useState<Record<string, ExpeditionMissionControlSummary>>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingSummaries, setIsLoadingSummaries] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // View state: 'grid' (Mission Control Cards) or 'table' (Register Table)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

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

  // Load Expeditions data from backend
  const loadExpeditionsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchExpeditionsList()
      setExpeditions(data)

      // Fetch mission control summaries for all expeditions in parallel
      setIsLoadingSummaries(true)
      const summaryPromises = data.map(async (exp) => {
        try {
          const sum = await fetchExpeditionMissionControlSummary(exp)
          return { id: exp.id, summary: sum }
        } catch {
          return { id: exp.id, summary: null }
        }
      })

      const results = await Promise.allSettled(summaryPromises)
      const summaryMap: Record<string, ExpeditionMissionControlSummary> = {}
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.summary) {
          summaryMap[r.value.id] = r.value.summary
        }
      })
      setSummaries(summaryMap)
    } catch (err: any) {
      setError(err?.message || 'Failed to load expeditions from database.')
      setExpeditions([])
    } finally {
      setIsLoading(false)
      setIsLoadingSummaries(false)
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

  // Handle Form Submit
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

  // Calculated Real Mission-Level Metrics from Backend
  const missionMetrics = useMemo(() => {
    const totalExpeditions = expeditions.length
    const activeExpeditions = expeditions.filter((e) => e.status === 'Active').length
    const planningExpeditions = expeditions.filter((e) => e.status === 'Planning').length
    const totalPersonnel = expeditions.reduce((acc, e) => {
      const sum = summaries[e.id]
      return acc + (sum?.personnelCount !== undefined ? sum.personnelCount : 0)
    }, 0)

    let readinessPassed = 0
    let readinessBlocked = 0
    let missionsRequiringAttention = 0
    let totalPlannedCargoKg = 0
    let totalCapacityKg = 0
    let pendingResupplyCount = 0

    Object.values(summaries).forEach((sum) => {
      if (sum.readiness) {
        if (sum.readiness.overallStatus === 'READY') {
          readinessPassed++
        } else {
          readinessBlocked++
        }
      }
      if (sum.attentionReasons.length > 0) {
        missionsRequiringAttention++
      }
      if (sum.capacity) {
        totalPlannedCargoKg += sum.capacity.total_planned_weight_kg || 0
        totalCapacityKg += sum.capacity.maximum_capacity_kg || 0
      }
      if (sum.resupplyItems) {
        pendingResupplyCount += sum.resupplyItems.length
      }
    })

    return {
      totalExpeditions,
      activeExpeditions,
      planningExpeditions,
      totalPersonnel,
      readinessPassed,
      readinessBlocked,
      missionsRequiringAttention,
      totalPlannedCargoKg,
      totalCapacityKg,
      pendingResupplyCount,
    }
  }, [expeditions, summaries])

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
      {/* 1. MISSION CONTROL PAGE HEADER */}
      <div className="bg-[#001B48] border border-[#02457A] rounded-xl p-3.5 sm:p-5 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shrink-0">
              <Compass className="w-5 h-5 sm:w-7 sm:h-7 text-sky-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-mono text-[10px] sm:text-xs font-bold text-sky-300 tracking-wider uppercase bg-sky-950/70 px-1.5 sm:px-2 py-0.5 rounded border border-sky-800/60">
                  POLAR OPERATIONS COMMAND
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase">
                  NCPOR / MoES Mandate
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  What-If Simulation Active
                </span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight leading-snug font-sans">
                Expedition Mission Control &amp; Campaign Register
              </h1>
              <p className="text-[11px] sm:text-xs text-sky-100/90 max-w-3xl leading-relaxed font-sans">
                Centralized operational command for Indian Antarctic &amp; Arctic scientific expeditions. Real-time integration across <strong>7-Pillar Readiness</strong>, <strong>Route &amp; Progress Tracking</strong>, <strong>Cargo Capacity Allocation</strong>, <strong>ML Resupply Demand</strong>, and <strong>What-If Scenario Simulation</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={loadExpeditionsData}
              isLoading={isLoading}
              iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
              className="flex-1 sm:flex-initial justify-center bg-slate-900/60 text-sky-200 border-sky-600/50 hover:bg-slate-800 hover:text-white text-xs py-1.5 min-h-[32px]"
              title="Refresh expeditions and live operational telemetry from database"
            >
              Sync Telemetry
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSubmitError(null)
                setIsModalOpen(true)
              }}
              iconLeft={<Plus className="w-3.5 h-3.5" />}
              className="flex-1 sm:flex-initial justify-center bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer py-1.5 min-h-[32px]"
            >
              Register Campaign
            </Button>
          </div>
        </div>

        {/* 11 Integrated Capabilities Badge Bar */}
        <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3.5 border-t border-sky-900/60 flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-[10px] sm:text-[11px] font-mono text-sky-200/90 scrollbar-none">
          <span className="font-bold text-white uppercase shrink-0 text-[9px] sm:text-[10px] bg-sky-900/80 px-1.5 sm:px-2 py-0.5 rounded">
            Integrated Capabilities:
          </span>
          {[
            'Expedition Planning',
            'Personnel Roster',
            'Cargo Manifests',
            'Depot Inventory',
            'Individual Packing',
            'Capacity Margin',
            '7-Pillar Readiness',
            'Route Tracking',
            'ML Resupply',
            'What-If Simulation',
            'Incident Response',
          ].map((cap, idx) => (
            <span
              key={idx}
              className="px-1.5 sm:px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/40 text-sky-300 font-medium whitespace-nowrap text-[9px] sm:text-[10px]"
            >
              ✓ {cap}
            </span>
          ))}
        </div>
      </div>

      {/* 2. REAL BACKEND DERIVED MISSION METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Expeditions */}
        <div className="p-3.5 bg-white dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
            <span>Total Missions</span>
            <Compass className="w-3.5 h-3.5 text-[#02457A] dark:text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {missionMetrics.totalExpeditions}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Registered Campaigns
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="p-3.5 bg-white dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
            <span>Active Missions</span>
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
            {missionMetrics.activeExpeditions}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {missionMetrics.planningExpeditions} in Planning
          </div>
        </div>

        {/* Deployed Personnel */}
        <div className="p-3.5 bg-white dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
            <span>Personnel</span>
            <Users className="w-3.5 h-3.5 text-[#02457A] dark:text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {missionMetrics.totalPersonnel}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Deployed Members
          </div>
        </div>

        {/* 7-Pillar Readiness Status */}
        <div className="p-3.5 bg-white dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
            <span>Readiness Status</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5">
            <span className="text-emerald-700 dark:text-emerald-400">{missionMetrics.readinessPassed}</span>
            <span className="text-xs text-slate-400">/</span>
            <span className={missionMetrics.readinessBlocked > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
              {missionMetrics.readinessBlocked} Hold
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            7-Pillar Audit Clearance
          </div>
        </div>

        {/* Cargo Load Margin */}
        <div className="p-3.5 bg-white dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
            <span>Planned Payload</span>
            <Scale className="w-3.5 h-3.5 text-[#02457A] dark:text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {missionMetrics.totalPlannedCargoKg > 0 ? `${(missionMetrics.totalPlannedCargoKg / 1000).toFixed(1)}k` : '0'}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-0.5">kg</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {missionMetrics.totalCapacityKg > 0 ? `${(missionMetrics.totalCapacityKg / 1000).toFixed(1)}k kg capacity` : 'Carrier Allocated'}
          </div>
        </div>

        {/* Attention Required Count */}
        <div className="p-3.5 bg-white dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
            <span>Attention Required</span>
            <ShieldAlert className={`w-3.5 h-3.5 ${missionMetrics.missionsRequiringAttention > 0 ? 'text-amber-600 dark:text-amber-400 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${missionMetrics.missionsRequiringAttention > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {missionMetrics.missionsRequiringAttention}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Missions with Alerts/Blockers
          </div>
        </div>
      </div>

      {/* ERROR BANNER IF DATABASE CONNECTION FAILS */}
      {error && !isLoading && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center justify-between text-xs text-rose-950 dark:text-rose-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-rose-900 dark:text-rose-300">Database Connection Error:</span>{' '}
              <span className="text-rose-800 dark:text-rose-200">{error}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={loadExpeditionsData}
            iconLeft={<RefreshCw className="w-3 h-3" />}
          >
            Retry Query
          </Button>
        </div>
      )}

      {/* 3. SEARCH, FILTERS & VIEW MODE CONTROLS */}
      <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search expeditions by ID, name, lead scientist, or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-[#11191D] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] focus:bg-white dark:focus:bg-[#152026] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#11191D] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Planning">Planning</option>
                <option value="Returning">Returning</option>
                <option value="Concluded">Concluded</option>
              </select>
            </div>

            {/* Station Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">Station:</span>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#11191D] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Stations</option>
                <option value="Maitri">Maitri Base</option>
                <option value="Bharati">Bharati Base</option>
                <option value="Maitri & Bharati">Maitri &amp; Bharati (Joint)</option>
                <option value="Himadri">Himadri (Arctic)</option>
                <option value="Prydz Bay Sector">Prydz Bay / Southern Ocean</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">Season:</span>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#11191D] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
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

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center border border-slate-200 dark:border-[#263238] rounded-lg p-0.5 bg-slate-100 dark:bg-[#152026] ml-1">              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#02457A] dark:bg-[#11191D] dark:text-[#FFD21C] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
                title="Mission Control Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#02457A] dark:bg-[#11191D] dark:text-[#FFD21C] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
                title="Tabular Register View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Register</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EXPEDITIONS DISPLAY (MISSION CONTROL CARDS vs TABLE) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#02457A] dark:text-[#FFD21C]" />
            Active Expedition Dossiers
          </span>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            {isLoading ? 'Querying PostgreSQL database...' : `Showing ${filteredExpeditions.length} of ${expeditions.length} Campaigns`}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
            <Loader2 className="w-8 h-8 text-[#02457A] dark:text-sky-400 animate-spin mx-auto" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono uppercase">
              Connecting to PostgreSQL Operational Database...
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              Fetching expedition dossiers, readiness audits, route tracking fixes, and carrier payload summaries.
            </p>
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
                  Clear Search &amp; Filters
                </Button>
              ) : error ? (
                <Button variant="secondary" size="sm" onClick={loadExpeditionsData} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
                  Retry Query
                </Button>
              ) : undefined
            }
          />
        ) : viewMode === 'grid' ? (
          /* ========================================================================= */
          /* RICH OPERATIONAL MISSION CONTROL CARDS                                    */
          /* ========================================================================= */
          <div className="grid grid-cols-1 gap-6">
            {filteredExpeditions.map((exp) => {
              const summary = summaries[exp.id]
              const statusVariant =
                exp.status === 'Active'
                  ? 'operational'
                  : exp.status === 'Planning'
                  ? 'info'
                  : exp.status === 'Returning'
                  ? 'warning'
                  : 'neutral'

              const readiness = summary?.readiness
              const progress = summary?.progress
              const capacity = summary?.capacity
              const attentionReasons = summary?.attentionReasons || []

              return (
                <Card
                  key={exp.id}
                  className="border-slate-200 shadow-sm hover:border-[#02457A]/50 dark:hover:border-sky-500/50 transition-all overflow-hidden rounded-xl"
                >
                  {/* Card Header Strip */}
                  <div className="bg-slate-900 border-b border-slate-800 p-3.5 sm:p-4.5 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-3.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 tracking-wider">
                            {exp.id}
                          </span>
                          <Badge variant={statusVariant} size="sm" withDot>
                            {exp.status.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-slate-200 font-mono">
                            Mandate: <strong className="text-white font-semibold">{exp.mandate}</strong>
                          </span>
                        </div>
                        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          {exp.name}
                        </h2>
                        <p className="text-xs text-slate-300 font-sans">
                          {exp.season}
                        </p>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0">
                        <div className="bg-slate-800/95 border border-slate-700 rounded-lg px-3 py-1.5 sm:px-3.5 sm:py-2 text-left sm:text-right font-mono flex-1 sm:flex-initial">
                          <div className="text-[10px] sm:text-xs uppercase font-bold text-slate-300 font-mono">Campaign Window</div>
                          <div className="text-xs font-bold font-mono text-sky-300 mt-0.5">
                            {exp.startDate} → {exp.endDate}
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => navigate(`/expeditions/${exp.id}`)}
                          className="bg-[#02457A] hover:bg-sky-700 text-white font-bold text-xs gap-1.5 h-8 px-3.5 cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Mission
                        </Button>
                      </div>
                    </div>

                    {/* Officer & Logistics Strip */}
                    <div className="mt-3.5 pt-3 sm:mt-4 sm:pt-3.5 border-t border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 text-xs font-sans">
                      <div>
                        <span className="text-[11px] sm:text-xs text-slate-300 block font-mono uppercase font-semibold mb-0.5">Expedition Lead</span>
                        <span className="font-bold text-white text-xs truncate block">{exp.lead}</span>
                      </div>
                      <div>
                        <span className="text-[11px] sm:text-xs text-slate-300 block font-mono uppercase font-semibold mb-0.5">Assigned Stations</span>
                        <span className="font-bold text-white text-xs truncate block">{exp.station}</span>
                      </div>
                      <div>
                        <span className="text-[11px] sm:text-xs text-slate-300 block font-mono uppercase font-semibold mb-0.5">Personnel Roster</span>
                        <span className="font-mono font-bold text-sky-300 text-xs">
                          {summary?.personnelCount !== undefined ? `${summary.personnelCount} Members` : 'Querying roster...'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] sm:text-xs text-slate-300 block font-mono uppercase font-semibold mb-0.5">Vessel Support</span>
                        <span className="font-bold text-white text-xs truncate block">{exp.primaryVessel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Capabilities Overview (4 High-Visibility Modules) */}
                  <CardContent className="p-3.5 sm:p-4.5 bg-white dark:bg-[#0D1316] space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
                      {/* Module 1: 7-Pillar Readiness Audit */}
                      <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#02457A] dark:text-sky-400" />
                            Readiness Audit
                          </span>
                          <span className="text-[10px] font-mono bg-blue-100 dark:bg-sky-950/60 text-blue-900 dark:text-sky-300 px-2 py-0.5 rounded font-bold border border-transparent dark:border-sky-800/40">
                            7-Pillar
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {readiness ? (
                            readiness.overallStatus === 'READY' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                READY (CLEARED)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/40">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                NOT READY ({readiness.failedChecks} BLOCKERS)
                              </span>
                            )
                          ) : (
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading audit...</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                          {readiness ? `${readiness.passedChecks}/7 checks verified` : 'Executing 7 pillars'}
                        </p>
                      </div>

                      {/* Module 2: Route & Progress Tracking */}
                      <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5 text-[#02457A] dark:text-sky-400" />
                            Progress &amp; Route
                          </span>
                          <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-bold border border-transparent dark:border-slate-700">
                            Haversine
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {progress ? progress.currentPhase : 'IN_TRANSIT'}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#02457A] dark:text-sky-400">
                            {progress ? `${progress.progressPercent}%` : '0%'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate">
                          {progress
                            ? progress.totalDistanceKm > 0
                              ? `${progress.distanceTraveledKm.toLocaleString()} / ${progress.totalDistanceKm.toLocaleString()} km`
                              : 'Route data unavailable'
                            : 'Route data unavailable'}
                        </p>
                      </div>

                      {/* Module 3: Packing & Cargo Capacity */}
                      <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-[#02457A] dark:text-sky-400" />
                            Packing &amp; Capacity
                          </span>
                          <span className="text-[10px] font-mono bg-blue-100 dark:bg-sky-950/60 text-blue-900 dark:text-sky-300 px-2 py-0.5 rounded font-bold border border-transparent dark:border-sky-800/40">
                            Payload
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                            {capacity ? `${capacity.total_planned_weight_kg.toFixed(1)} / ${capacity.maximum_capacity_kg.toFixed(0)} kg` : '0 / 2500 kg'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                          {capacity ? `${capacity.capacity_utilization_pct}% carrier utilization` : 'Loading load manifest...'}
                        </p>
                      </div>

                      {/* Module 4: What-If Simulation */}
                      <div className="p-3 sm:p-3.5 bg-sky-50/90 dark:bg-[#0B253D] border border-sky-300/80 dark:border-sky-500/40 rounded-lg space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase text-[#001B48] dark:text-sky-200 flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-[#02457A] dark:text-sky-400" />
                            What-If Simulator
                          </span>
                          <span className="text-[10px] font-mono bg-sky-200/90 dark:bg-sky-900/80 text-[#001B48] dark:text-sky-200 px-2 py-0.5 rounded font-bold border border-sky-300/50 dark:border-sky-700/50">
                            Decision Support
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#02457A] dark:text-sky-300 pt-0.5 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Scenario Evaluator</span>
                        </div>
                        <p className="text-xs text-slate-900 dark:text-slate-100 font-sans font-medium">
                          Simulate duration, payload &amp; stock
                        </p>
                      </div>
                    </div>

                    {/* Attention Warning Strip (if any issues exist) */}
                    {attentionReasons.length > 0 && (
                      <div className="p-3 sm:p-3.5 bg-amber-50/90 dark:bg-[#2D2006] border border-amber-300/90 dark:border-amber-500/50 rounded-lg space-y-1.5 text-xs shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold text-xs font-mono text-[#451A03] dark:text-[#FCD34D]">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>ATTENTION REQUIRED ({attentionReasons.length} Active Operational Issues):</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-xs text-[#78350F] dark:text-[#FEF08A] font-semibold leading-relaxed pl-1">
                          {attentionReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Direct Capability Quick-Action Buttons */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                        Direct Capabilities:
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1. Progress & Route */}
                        <button
                          type="button"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=progress`)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer border border-transparent dark:border-slate-700"
                          title="Open Route Tracking & Telemetry"
                        >
                          <Navigation className="w-3 h-3 text-[#02457A] dark:text-sky-400" />
                          Progress &amp; Route
                        </button>

                        {/* 2. Readiness Audit */}
                        <button
                          type="button"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=readiness`)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer border border-transparent dark:border-slate-700"
                          title="Open 7-Pillar Readiness Audit"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Readiness Audit
                        </button>

                        {/* 3. What-If Simulator (Highlighted Primary Differentiator) */}
                        <button
                          type="button"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=simulation`)}
                          className="px-3 py-1 rounded-md text-xs font-bold bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/50 dark:hover:bg-sky-900/80 text-[#02457A] dark:text-sky-300 border border-sky-300 dark:border-sky-600/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Open What-If Mission Scenario Evaluator"
                        >
                          <Cpu className="w-3.5 h-3.5 text-[#02457A] dark:text-sky-400" />
                          What-If Simulator
                        </button>

                        {/* 4. Packing & Load */}
                        <button
                          type="button"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=packing`)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer border border-transparent dark:border-slate-700"
                          title="Open Individual Packing & Cargo Load Planner"
                        >
                          <Scale className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                          Packing &amp; Load
                        </button>

                        {/* 5. Personnel */}
                        <button
                          type="button"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=personnel`)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer border border-transparent dark:border-slate-700"
                          title="Open Expedition Personnel Roster"
                        >
                          <Users className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                          Personnel ({summary?.personnelCount !== undefined ? summary.personnelCount : '—'})
                        </button>

                        {/* 6. Cargo */}
                        <button
                          type="button"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=cargo`)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer border border-transparent dark:border-slate-700"
                          title="Open Cargo Items Manifest"
                        >
                          <Package className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                          Cargo ({summary?.cargoCount !== undefined ? summary.cargoCount : '—'})
                        </button>

                        {/* 7. Inventory */}
                        <button
                          type="button"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=inventory`)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer border border-transparent dark:border-slate-700"
                          title="Open Station Inventory Requirements"
                        >
                          <Boxes className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                          Inventory ({summary?.resupplyItems ? summary.resupplyItems.length : 0})
                        </button>

                        {/* 8. Mission Overview */}
                        <button
                          type="button"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=overview`)}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#02457A] dark:bg-[#169FE5] text-white dark:text-[#050708] hover:bg-sky-800 dark:hover:bg-sky-400 transition-colors flex items-center gap-1 cursor-pointer ml-1 shadow-xs"
                          title="Open Complete Expedition Dossier"
                        >
                          <Eye className="w-3 h-3" />
                          Overview
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* TABULAR REGISTER VIEW                                                     */
          /* ========================================================================= */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expedition ID</TableHead>
                <TableHead>Expedition Name</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Personnel</TableHead>
                <TableHead>Readiness</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quick Capabilities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpeditions.map((exp) => {
                const summary = summaries[exp.id]
                const isReady = summary?.readiness?.overallStatus === 'READY'

                return (
                  <TableRow
                    key={exp.id}
                    onClick={() => navigate(`/expeditions/${exp.id}`)}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell mono className="font-bold text-slate-900 dark:text-white">
                      {exp.id}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <div className="font-bold text-slate-900 dark:text-white">{exp.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                        Lead: <span className="text-slate-700 dark:text-slate-300 font-medium">{exp.lead}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-800 dark:text-slate-200 font-semibold text-xs">{exp.station}</TableCell>
                    <TableCell mono className="text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                      {exp.startDate} → {exp.endDate}
                    </TableCell>
                    <TableCell mono className="text-slate-900 dark:text-white font-bold">
                      {summary?.personnelCount !== undefined ? `${summary.personnelCount} staff` : '—'}
                    </TableCell>
                    <TableCell>
                      {summary?.readiness ? (
                        <Badge variant={isReady ? 'operational' : 'critical'} size="sm" withDot>
                          {summary.readiness.overallStatus}
                        </Badge>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Evaluating...</span>
                      )}
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
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=simulation`)}
                          className="text-[#02457A] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 font-bold"
                          title="What-If Simulator"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=readiness`)}
                          className="text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-bold"
                          title="Readiness Audit"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => navigate(`/expeditions/${exp.id}?tab=overview`)}
                          className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 5. CREATE EXPEDITION MODAL */}
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
              className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 ${
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              >
                <option value="Maitri & Bharati">Maitri &amp; Bharati (Joint Antarctic)</option>
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
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 ${
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
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 ${
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
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 ${
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
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 ${
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
              Mission Objectives &amp; Notes
            </label>
            <textarea
              rows={3}
              placeholder="Brief operational mission objectives, scientific tasks, or special environmental logistics notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default ExpeditionsPage
