import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  EmptyState,
  Modal,
} from '@/components/ui'
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Check,
  ShieldAlert,
  Search,
  X,
  ExternalLink,
  Sparkles,
  Boxes,
  Package,
  Users,
  Wind,
  Clock,
  Radio,
  Eye,
  SlidersHorizontal,
  Download,
  Plus,
  MoreVertical,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  INITIAL_ALERTS_DATA,
  OperationalAlertItem,
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  AlertSourceType,
} from '@/data/alertsData'
import {
  fetchAlertsList,
  createAlert,
  updateAlertStatus,
  CreateAlertPayload,
} from '@/services/alertService'
import { useOperational } from '@/context/OperationalContext'
import { cn } from '@/lib/utils'

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate()
  const { decrementAlertCount, currentUser, currentRole } = useOperational()

  // Master Alerts State (from PostgreSQL)
  const [alerts, setAlerts] = useState<OperationalAlertItem[]>(INITIAL_ALERTS_DATA)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [severityFilter, setSeverityFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [dateFilter, setDateFilter] = useState<string>('All')

  // Create Alert Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState<CreateAlertPayload>({
    category: 'Emergency',
    severity: 'High',
    message: '',
    detail: '',
    related_entity: '',
    source_mechanism: 'Manual Dispatch',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch alerts from PostgreSQL
  const loadAlerts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAlertsList()
      setAlerts(data)
    } catch (err: any) {
      console.error('Failed to load alerts from backend:', err)
      setError(err?.message || 'Failed to connect to alerts stream.')
      if (alerts.length === 0) {
        setAlerts(INITIAL_ALERTS_DATA)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  // Acknowledge single alert with PostgreSQL persistence
  const handleAcknowledge = async (id: string) => {
    try {
      await updateAlertStatus(id, 'Acknowledged', currentUser?.name || 'Duty Operations Officer')
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Acknowledged' as AlertStatus } : a))
      )
      decrementAlertCount()
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err)
      // Optimistic fallback for UI responsiveness
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Acknowledged' as AlertStatus } : a))
      )
      decrementAlertCount()
    }
  }

  // Resolve single alert with PostgreSQL persistence
  const handleResolve = async (id: string) => {
    try {
      await updateAlertStatus(id, 'Resolved')
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Resolved' as AlertStatus } : a))
      )
    } catch (err: any) {
      console.error('Failed to resolve alert:', err)
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Resolved' as AlertStatus } : a))
      )
    }
  }

  // Acknowledge all new alerts with PostgreSQL persistence
  const handleAcknowledgeAll = async () => {
    const newAlerts = alerts.filter((a) => a.status === 'New')
    setAlerts((prev) =>
      prev.map((a) => (a.status === 'New' ? { ...a, status: 'Acknowledged' as AlertStatus } : a))
    )
    for (const a of newAlerts) {
      try {
        await updateAlertStatus(a.id, 'Acknowledged', currentUser?.name || 'Duty Operations Officer')
        decrementAlertCount()
      } catch (err) {
        console.error(`Failed to acknowledge alert ${a.id}:`, err)
      }
    }
  }

  // Validate Create Form
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.message.trim()) {
      errors.message = 'Advisory message is required.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const created = await createAlert(formData)
      setAlerts((prev) => [created, ...prev])
      setIsCreateModalOpen(false)
      setFormData({
        category: 'Emergency',
        severity: 'High',
        message: '',
        detail: '',
        related_entity: '',
        source_mechanism: 'Manual Dispatch',
      })
      setFormErrors({})
    } catch (err: any) {
      console.error('Failed to create alert in backend:', err)
      setSubmitError(err?.message || 'Failed to dispatch operational alert.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          a.id.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          a.detail.toLowerCase().includes(q) ||
          a.relatedEntityName.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        if (!match) return false
      }

      // Category
      if (categoryFilter !== 'All' && a.category !== categoryFilter) {
        return false
      }

      // Severity
      if (severityFilter !== 'All' && a.severity !== severityFilter) {
        return false
      }

      // Status
      if (statusFilter !== 'All' && a.status !== statusFilter) {
        return false
      }

      // Date
      if (dateFilter !== 'All') {
        if (dateFilter === 'Today' && a.createdDate !== '2026-09-17') return false
        if (dateFilter === '3days' && a.createdDate < '2026-09-15') return false
      }

      return true
    })
  }, [alerts, searchQuery, categoryFilter, severityFilter, statusFilter, dateFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('All')
    setSeverityFilter('All')
    setStatusFilter('All')
    setDateFilter('All')
  }

  const isFiltered =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'All' ||
    severityFilter !== 'All' ||
    statusFilter !== 'All' ||
    dateFilter !== 'All'

  // Summary counts
  const totalCount = alerts.length
  const newCount = alerts.filter((a) => a.status === 'New').length
  const criticalCount = alerts.filter((a) => a.severity === 'Critical' && a.status !== 'Resolved').length
  const mlCount = alerts.filter((a) => a.sourceType === 'ML Forecast').length

  const getSeverityBadgeVariant = (sev: AlertSeverity) => {
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

  const getStatusBadgeVariant = (st: AlertStatus) => {
    switch (st) {
      case 'New':
        return 'critical'
      case 'Acknowledged':
        return 'operational'
      case 'Resolved':
      default:
        return 'operational'
    }
  }

  const getCategoryIcon = (cat: AlertCategory) => {
    switch (cat) {
      case 'Inventory':
        return <Boxes className="w-3.5 h-3.5 text-amber-600 dark:text-[#A7B2B8]" />
      case 'Cargo':
        return <Package className="w-3.5 h-3.5 text-indigo-600 dark:text-[#A7B2B8]" />
      case 'Personnel':
        return <Users className="w-3.5 h-3.5 text-[#02457A] dark:text-[#A7B2B8]" />
      case 'Emergency':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-[#A7B2B8]" />
      case 'Environmental':
        return <Wind className="w-3.5 h-3.5 text-[#018ABE] dark:text-[#A7B2B8]" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER (MISSION CONTROL / ALERTS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-transparent">
        <div className="flex items-start gap-3.5">
          {/* Yellow vertical accent indicator bar */}
          <div className="w-1 self-stretch min-h-[50px] bg-[#2C6A74] dark:bg-[#FFD21C] rounded-full shrink-0" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-[#F5F7F8] uppercase font-mono mb-0.5">
              MISSION CONTROL
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#F5F7F8] tracking-tight uppercase font-sans">
              ALERTS
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A7B2B8] mt-1 leading-relaxed font-normal">
              Monitor critical events, advisories, and operational updates in real time.
            </p>
          </div>
        </div>

        {/* Top Right Actions & Decorative Label */}
        <div className="flex flex-col items-start sm:items-end gap-2.5">
          {/* Subtle Decorative Marker */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 dark:text-[#F5F7F8] tracking-wider select-none">
            <span className="text-amber-500 dark:text-[#FFD21C] font-bold">// — —</span>
            <span>SCIENCE BEYOND BORDERS</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              className="text-xs"
              onClick={loadAlerts}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Download className="w-3.5 h-3.5" />}
              className="text-xs"
              onClick={() => {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredAlerts, null, 2))
                const downloadAnchor = document.createElement('a')
                downloadAnchor.setAttribute('href', dataStr)
                downloadAnchor.setAttribute('download', `polarops-alerts-${new Date().toISOString().slice(0, 10)}.json`)
                document.body.appendChild(downloadAnchor)
                downloadAnchor.click()
                downloadAnchor.remove()
              }}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + New Alert
            </Button>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Operational Stream Notice</div>
            <div>{error} (Displaying synchronized offline data).</div>
          </div>
        </div>
      )}

      {/* 2. SEARCH & MULTI-FILTER CONTROLS (HORIZONTAL FILTER BAR) */}
      <div className="bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-xl p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#6F7C82]" />
            <input
              type="text"
              placeholder="Search alerts by ID, message keyword, or related entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-900 dark:text-[#F5F7F8] placeholder:text-slate-400 dark:placeholder:text-[#6F7C82] focus:outline-none focus:ring-2 focus:ring-[#FFD21C]/30 focus:border-[#FFD21C] focus:bg-white dark:focus:bg-[#0A0E10] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-[#6F7C82] dark:hover:text-[#F5F7F8]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-medium text-slate-500 dark:text-[#A7B2B8]">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD21C]/30 focus:border-[#FFD21C]"
              >
                <option value="All">All Categories</option>
                <option value="Inventory">Inventory</option>
                <option value="Cargo">Cargo</option>
                <option value="Personnel">Personnel</option>
                <option value="Emergency">Emergency</option>
                <option value="Environmental">Environmental</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-medium text-slate-500 dark:text-[#A7B2B8]">Severity</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD21C]/30 focus:border-[#FFD21C]"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-medium text-slate-500 dark:text-[#A7B2B8]">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD21C]/30 focus:border-[#FFD21C]"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-medium text-slate-500 dark:text-[#A7B2B8]">Date</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD21C]/30 focus:border-[#FFD21C]"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today (17 Sep)</option>
                <option value="3days">Past 3 Days</option>
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

      {/* 3. ALERTS DATA TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#A7B2B8] px-0.5">
          <span className="font-bold text-slate-800 dark:text-[#F5F7F8] uppercase tracking-wider text-[11px]">
            ALERT STREAM & OPERATIONAL FEED
          </span>
          <span className="font-mono font-medium text-slate-500 dark:text-[#A7B2B8]">
            Showing {filteredAlerts.length} of {alerts.length} Alerts
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8 text-slate-400 dark:text-[#6F7C82]" />}
            title="No alerts match the criteria"
            description="No active operational notices or warnings were found with the selected filter parameters."
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table className="w-full min-w-[1240px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px] min-w-[110px] whitespace-nowrap">Alert ID</TableHead>
                <TableHead className="w-[110px] min-w-[110px] whitespace-nowrap">Severity</TableHead>
                <TableHead className="w-[130px] min-w-[130px] whitespace-nowrap">Category</TableHead>
                <TableHead className="min-w-[340px]">Message & Advisory</TableHead>
                <TableHead className="w-[240px] min-w-[220px]">Related Entity</TableHead>
                <TableHead className="w-[170px] min-w-[170px] whitespace-nowrap">Source Mechanism</TableHead>
                <TableHead className="w-[130px] min-w-[130px] whitespace-nowrap">Created At</TableHead>
                <TableHead className="w-[130px] min-w-[130px] whitespace-nowrap">Status</TableHead>
                <TableHead className="w-[140px] min-w-[140px] text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow
                  key={alert.id}
                  className={cn(
                    'transition-colors',
                    alert.status === 'New'
                      ? alert.severity === 'Critical'
                        ? 'bg-rose-50/30 dark:bg-[#050708] font-medium border-l-4 border-l-rose-600 dark:border-l-[#FF3038]'
                        : 'bg-amber-50/20 dark:bg-[#050708] font-medium border-l-4 border-l-amber-500 dark:border-l-[#FFD21C]'
                      : alert.status === 'Resolved'
                      ? 'opacity-75 hover:opacity-100 dark:bg-[#050708]'
                      : 'hover:bg-slate-50/90 dark:bg-[#050708] dark:hover:bg-[#11191D]'
                  )}
                >
                  <TableCell mono className="font-bold text-[#001B48] dark:text-[#F5F7F8] whitespace-nowrap w-[110px] min-w-[110px]">
                    {alert.id}
                  </TableCell>
                  <TableCell className="w-[110px] min-w-[110px] whitespace-nowrap">
                    <Badge variant={getSeverityBadgeVariant(alert.severity)} size="sm" withDot className="whitespace-nowrap">
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[130px] min-w-[130px] whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-[#F5F7F8] text-xs font-semibold whitespace-nowrap">
                      {getCategoryIcon(alert.category)}
                      <span>{alert.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[340px] pr-4">
                    <div className="font-bold text-slate-900 dark:text-[#F5F7F8] text-xs leading-snug break-words">
                      {alert.message}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-[#A7B2B8] leading-relaxed mt-1 font-normal break-words">
                      {alert.detail}
                    </div>
                  </TableCell>
                  <TableCell className="w-[240px] min-w-[220px] max-w-[280px]">
                    <Link
                      to={alert.relatedEntityRoute}
                      title={alert.relatedEntityName}
                      className="text-xs font-semibold text-[#02457A] dark:text-[#28B6FF] hover:underline inline-flex items-center gap-1.5 group break-words"
                    >
                      <span className="leading-snug">{alert.relatedEntityName}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-slate-400 dark:text-[#28B6FF] group-hover:text-[#02457A] dark:group-hover:text-[#FFD21C]" />
                    </Link>
                  </TableCell>
                  <TableCell className="w-[170px] min-w-[170px] whitespace-nowrap">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-md border inline-block whitespace-nowrap ${
                        alert.sourceType === 'ML Forecast'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold dark:bg-[#11191D] dark:text-[#F5F7F8] dark:border-[#263238]'
                          : alert.sourceType === 'Sensor Downlink'
                          ? 'bg-sky-50 text-sky-800 border-sky-200 font-medium dark:bg-[#11191D] dark:text-[#F5F7F8] dark:border-[#263238]'
                          : alert.sourceType === 'Rule-Based Threshold'
                          ? 'bg-slate-100 text-slate-800 border-slate-300 font-medium dark:bg-[#11191D] dark:text-[#F5F7F8] dark:border-[#263238]'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#11191D] dark:text-[#F5F7F8] dark:border-[#263238]'
                      }`}
                    >
                      {alert.sourceType}
                    </span>
                  </TableCell>
                  <TableCell mono className="text-slate-500 dark:text-[#F5F7F8] text-[11px] font-medium w-[130px] min-w-[130px] whitespace-nowrap">
                    <div className="font-mono">{alert.createdAt}</div>
                    <div className="text-[10px] text-slate-400 dark:text-[#6F7C82]">
                      {alert.createdDate || '2026-09-17'}
                    </div>
                  </TableCell>
                  <TableCell className="w-[130px] min-w-[130px] whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(alert.status)} size="sm" withDot className="whitespace-nowrap">
                      {alert.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right w-[140px] min-w-[140px] whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      {alert.status === 'New' ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="dark:bg-[#0D1316] dark:border-[#263238] dark:text-[#F5F7F8] dark:hover:bg-[#11191D] whitespace-nowrap"
                        >
                          Acknowledge
                        </Button>
                      ) : alert.status === 'Acknowledged' ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleResolve(alert.id)}
                          className="dark:bg-[#0D1316] dark:border-[#263238] dark:text-[#F5F7F8] dark:hover:bg-[#11191D] whitespace-nowrap"
                        >
                          Resolve
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="xs"
                          className="dark:bg-[#0D1316] dark:border-[#263238] dark:text-[#F5F7F8] dark:hover:bg-[#11191D] whitespace-nowrap opacity-60"
                        >
                          Resolved
                        </Button>
                      )}
                      <button
                        type="button"
                        className="p-1 text-slate-400 dark:text-[#A7B2B8] hover:text-slate-700 dark:hover:text-white rounded cursor-pointer shrink-0"
                        aria-label="More actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* CREATE ALERT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSubmitError(null)
          setFormErrors({})
        }}
        title="Dispatch New Operational Alert"
        description="Broadcast a real-time advisory, threshold warning, or emergency alert to mission control and field stations."
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5DB] mb-1">
                Alert Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AlertCategory })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#2C6A74]"
              >
                <option value="Emergency">Emergency</option>
                <option value="Inventory">Inventory</option>
                <option value="Cargo">Cargo</option>
                <option value="Personnel">Personnel</option>
                <option value="Environmental">Environmental</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5DB] mb-1">
                Severity Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverity })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#2C6A74]"
              >
                <option value="Critical">Critical (Immediate Operational Action)</option>
                <option value="High">High (Urgent Attention Required)</option>
                <option value="Moderate">Moderate (Operational Advisory)</option>
                <option value="Low">Low (Informational / Notice)</option>
              </select>
            </div>
          </div>

          {/* Message / Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5DB] mb-1">
              Advisory Headline / Message <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value })
                if (formErrors.message) setFormErrors({ ...formErrors, message: '' })
              }}
              placeholder="e.g. Fuel transfer pump seal failure at Bharati Base generator module."
              className={cn(
                'w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#2C6A74]',
                formErrors.message ? 'border-rose-500' : 'border-slate-300 dark:border-[#263238]'
              )}
            />
            {formErrors.message && (
              <p className="text-[11px] text-rose-500 mt-1">{formErrors.message}</p>
            )}
          </div>

          {/* Detail */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5DB] mb-1">
              Operational Detail & Action Required
            </label>
            <textarea
              rows={3}
              value={formData.detail || ''}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
              placeholder="Provide context, station coordinates, impacted equipment, or immediate protocol guidance..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#2C6A74]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Related Entity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5DB] mb-1">
                Related Entity Identifier
              </label>
              <input
                type="text"
                value={formData.related_entity || ''}
                onChange={(e) => setFormData({ ...formData, related_entity: e.target.value })}
                placeholder="e.g. Generator GEN-B3 / Maitri Fuel Depot"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#2C6A74]"
              />
            </div>

            {/* Source Mechanism */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5DB] mb-1">
                Source Mechanism
              </label>
              <select
                value={formData.source_mechanism}
                onChange={(e) => setFormData({ ...formData, source_mechanism: e.target.value as AlertSourceType })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-lg text-xs text-slate-800 dark:text-[#F5F7F8] focus:outline-none focus:ring-2 focus:ring-[#2C6A74]"
              >
                <option value="Manual Dispatch">Manual Dispatch</option>
                <option value="Rule-Based Threshold">Rule-Based Threshold</option>
                <option value="Sensor Downlink">Sensor Downlink</option>
                <option value="ML Forecast">ML Forecast</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#263238]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              iconLeft={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? 'Broadcasting Alert...' : 'Dispatch Alert'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
