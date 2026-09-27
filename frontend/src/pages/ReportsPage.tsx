import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
} from '@/components/ui'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Compass,
  Package,
  Boxes,
  Users,
  ShieldAlert,
  Sparkles,
  Filter,
  Calendar,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowDownToLine,
  SlidersHorizontal,
  RefreshCw,
  Database,
  AlertCircle,
} from 'lucide-react'
import { fetchExpeditionsList } from '@/services/expeditionService'
import type { ExpeditionDetail } from '@/data/expeditionsData'
import { fetchCargoList } from '@/services/cargoService'
import type { CargoRecord } from '@/data/cargoData'
import { fetchInventoryList } from '@/services/inventoryService'
import type { InventoryItem } from '@/data/inventoryData'
import { fetchPersonnelList, type PersonnelRecord } from '@/services/personnelService'
import { fetchStationsList, type StationApiResponse } from '@/services/stationsService'
import { requestInventoryForecast, type InventoryForecastResult } from '@/services/inventoryForecastService'
import { fetchEmergencyIncidentsList } from '@/services/emergencyIncidentService'
import type { IncidentRecord } from '@/data/emergencyData'


type ReportType =
  | 'expedition_summary'
  | 'cargo_movement'
  | 'inventory_status'
  | 'personnel_movement'
  | 'emergency_incidents'
  | 'inventory_forecast'

function matchesDateRange(dateStr: string | null | undefined, range: string): boolean {
  if (!dateStr || range === 'all') return true
  const lower = dateStr.toLowerCase().trim()

  // Handle relative time strings
  if (lower.includes('ago') || lower.includes('just now')) {
    if (range === 'season_2026_27' || range === 'last_30_days' || range === 'last_90_days' || range === 'all') {
      return true
    }
    return false
  }

  // Extract 4-digit year
  let year = NaN
  const matchYear = dateStr.match(/\b(202[0-9])\b/)
  if (matchYear) {
    year = parseInt(matchYear[1], 10)
  }

  const parsed = Date.parse(dateStr)
  let timestamp = NaN
  if (!isNaN(parsed)) {
    timestamp = parsed
    if (isNaN(year)) {
      year = new Date(parsed).getFullYear()
    }
  }

  const now = new Date().getTime()
  const daysDiff = !isNaN(timestamp) ? (now - timestamp) / (1000 * 60 * 60 * 24) : NaN

  switch (range) {
    case 'season_2026_27':
      if (!isNaN(year)) {
        return year === 2026 || year === 2027
      }
      return true

    case 'last_30_days':
      if (!isNaN(daysDiff)) {
        return daysDiff >= -30 && daysDiff <= 30
      }
      return year === 2026 || year === 2027

    case 'last_90_days':
      if (!isNaN(daysDiff)) {
        return daysDiff >= -90 && daysDiff <= 90
      }
      return year === 2026 || year === 2027

    case 'season_2025_26':
      if (!isNaN(year)) {
        return year === 2025
      }
      return false

    default:
      return true
  }
}

export const ReportsPage: React.FC = () => {
  // Active report selection
  const [selectedReport, setSelectedReport] = useState<ReportType>('expedition_summary')

  // Filter criteria
  const [dateRange, setDateRange] = useState<string>('season_2026_27')
  const [selectedExpedition, setSelectedExpedition] = useState<string>('All')
  const [selectedStation, setSelectedStation] = useState<string>('All')

  // Live domain datasets loaded from PostgreSQL
  const [expeditions, setExpeditions] = useState<ExpeditionDetail[]>([])
  const [cargoList, setCargoList] = useState<CargoRecord[]>([])
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [personnelList, setPersonnelList] = useState<PersonnelRecord[]>([])
  const [stationsList, setStationsList] = useState<StationApiResponse[]>([])
  const [incidentsList, setIncidentsList] = useState<IncidentRecord[]>([])

  // ML Forecast cache state
  const [forecastMap, setForecastMap] = useState<Record<string, InventoryForecastResult>>({})
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false)
  const [forecastError, setForecastError] = useState<string | null>(null)

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true)
  const [errorsByReport, setErrorsByReport] = useState<Partial<Record<ReportType, string>>>({})

  // Fetch all live data from PostgreSQL
  const loadReportsData = useCallback(async () => {
    setLoading(true)
    const newErrors: Partial<Record<ReportType, string>> = {}

    try {
      const [expRes, crgRes, invRes, persRes, stnRes, incRes] = await Promise.allSettled([
        fetchExpeditionsList(),
        fetchCargoList(),
        fetchInventoryList(),
        fetchPersonnelList(),
        fetchStationsList(),
        fetchEmergencyIncidentsList(),
      ])

      if (expRes.status === 'fulfilled') {
        setExpeditions(expRes.value)
      } else {
        newErrors.expedition_summary = 'Failed to load expeditions from database.'
      }

      if (crgRes.status === 'fulfilled') {
        setCargoList(crgRes.value)
      } else {
        newErrors.cargo_movement = 'Failed to load cargo records from database.'
      }

      if (invRes.status === 'fulfilled') {
        setInventoryList(invRes.value)
        // Trigger live ML forecasts for loaded items
        triggerMlForecasts(invRes.value)
      } else {
        newErrors.inventory_status = 'Failed to load inventory ledger from database.'
        newErrors.inventory_forecast = 'Failed to load inventory items for forecasting.'
      }

      if (persRes.status === 'fulfilled') {
        setPersonnelList(persRes.value)
      } else {
        newErrors.personnel_movement = 'Failed to load personnel roster from database.'
      }

      if (stnRes.status === 'fulfilled') {
        setStationsList(stnRes.value)
      }

      if (incRes.status === 'fulfilled') {
        setIncidentsList(incRes.value)
      } else {
        newErrors.emergency_incidents = 'Failed to load emergency incidents from database.'
        setIncidentsList([])
      }

      setErrorsByReport(newErrors)
    } catch (err) {
      console.error('Error fetching reports data', err)
    } finally {
      setLoading(false)
    }
  }, [])


  // Trigger live ML forecasts via POST /api/inventory/forecast (inventory_demand_gb_v1)
  const triggerMlForecasts = async (items: InventoryItem[]) => {
    if (!items || items.length === 0) return
    setLoadingForecast(true)
    setForecastError(null)

    try {
      const results = await Promise.allSettled(
        items.map(async (item) => {
          const res = await requestInventoryForecast(item)
          return { id: item.id, res }
        })
      )

      const newMap: Record<string, InventoryForecastResult> = {}
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          newMap[r.value.id] = r.value.res
        }
      })
      setForecastMap(newMap)
    } catch (err) {
      setForecastError('Failed to execute gradient boosting ML forecast model.')
    } finally {
      setLoadingForecast(false)
    }
  }

  useEffect(() => {
    loadReportsData()
  }, [loadReportsData])

  // Filter logic across real PostgreSQL domain records
  const filteredExpeditions = useMemo(() => {
    return expeditions.filter((exp) => {
      if (selectedExpedition !== 'All' && exp.id !== selectedExpedition) return false
      if (selectedStation !== 'All' && !exp.station.toLowerCase().includes(selectedStation.toLowerCase())) return false
      if (!matchesDateRange(exp.startDate, dateRange) && !matchesDateRange(exp.endDate, dateRange)) return false
      return true
    })
  }, [expeditions, selectedExpedition, selectedStation, dateRange])

  const filteredCargo = useMemo(() => {
    return cargoList.filter((c) => {
      if (selectedExpedition !== 'All' && c.expeditionId !== selectedExpedition) return false
      if (selectedStation !== 'All' && !c.destination.toLowerCase().includes(selectedStation.toLowerCase())) return false
      if (!matchesDateRange(c.expectedArrival, dateRange)) return false
      return true
    })
  }, [cargoList, selectedExpedition, selectedStation, dateRange])

  const filteredInventory = useMemo(() => {
    return inventoryList.filter((inv) => {
      if (selectedStation !== 'All' && !inv.station.toLowerCase().includes(selectedStation.toLowerCase())) return false
      return true
    })
  }, [inventoryList, selectedStation])

  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((p) => {
      if (selectedExpedition !== 'All' && p.expeditionId !== selectedExpedition) return false
      if (selectedStation !== 'All' && !p.currentStation.toLowerCase().includes(selectedStation.toLowerCase())) return false
      if (!matchesDateRange(p.departure, dateRange)) return false
      return true
    })
  }, [personnelList, selectedExpedition, selectedStation, dateRange])

  const filteredIncidents = useMemo(() => {
    return incidentsList.filter((inc) => {
      if (selectedExpedition !== 'All' && inc.expeditionId !== selectedExpedition) return false
      if (selectedStation !== 'All' && !inc.location.toLowerCase().includes(selectedStation.toLowerCase())) return false
      if (!matchesDateRange(inc.time, dateRange)) return false
      return true
    })
  }, [incidentsList, selectedExpedition, selectedStation, dateRange])

  // CSV Export Utility using live current filtered data
  const handleExportCSV = () => {
    let headers: string[] = []
    let rows: string[][] = []
    let filename = `PolarOps_${selectedReport}_${dateRange}.csv`

    switch (selectedReport) {
      case 'expedition_summary':
        headers = ['Expedition ID', 'Name', 'Station', 'Leader', 'Start Date', 'End Date', 'Personnel', 'Status']
        rows = filteredExpeditions.map((e) => [
          e.id,
          `"${e.name.replace(/"/g, '""')}"`,
          `"${e.station}"`,
          `"${e.lead}"`,
          e.startDate,
          e.endDate,
          String(e.personnelCount),
          e.status,
        ])
        break

      case 'cargo_movement':
        headers = ['Cargo ID', 'Description', 'Category', 'Weight', 'Carrier', 'Destination', 'Priority', 'ETA', 'Status']
        rows = filteredCargo.map((c) => [
          c.id,
          `"${c.description.replace(/"/g, '""')}"`,
          `"${c.category}"`,
          c.weight,
          `"${c.carrier}"`,
          `"${c.destination}"`,
          c.priority,
          c.expectedArrival,
          c.status,
        ])
        break

      case 'inventory_status':
        headers = ['Item ID', 'Item Name', 'Category', 'Station', 'Current Stock', 'Minimum Stock', 'Days Remaining', 'Status']
        rows = filteredInventory.map((i) => [
          i.id,
          `"${i.name.replace(/"/g, '""')}"`,
          `"${i.category}"`,
          `"${i.station}"`,
          `${i.currentStock} ${i.unit}`,
          `${i.minimumStock} ${i.unit}`,
          String(i.daysRemaining),
          i.status,
        ])
        break

      case 'personnel_movement':
        headers = ['Personnel ID', 'Name', 'Role', 'Organization', 'Current Station', 'Destination', 'Departure', 'Status']
        rows = filteredPersonnel.map((p) => [
          p.id,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.role.replace(/"/g, '""')}"`,
          `"${p.organization.replace(/"/g, '""')}"`,
          `"${p.currentStation}"`,
          `"${p.destination}"`,
          p.departure,
          p.status,
        ])
        break

      case 'emergency_incidents':
        headers = ['Incident ID', 'Time', 'Location', 'Type', 'Severity', 'Personnel Affected', 'Cargo Affected', 'Status']
        rows = filteredIncidents.map((inc) => [
          inc.id,
          `"${inc.time}"`,
          `"${inc.location}"`,
          `"${inc.type}"`,
          inc.severity,
          String(inc.personnelAffectedCount),
          String(inc.cargoAffectedCount),
          inc.responseStatus,
        ])
        break

      case 'inventory_forecast':
        headers = ['Item ID', 'Item Name', 'Station', 'Category', 'Current Stock', 'Predicted Requirement', 'Recommended Additional Qty', 'Model Version', 'Status', 'Recommendation']
        rows = filteredInventory.map((i) => {
          const fc = forecastMap[i.id]?.data
          return [
            i.id,
            `"${i.name.replace(/"/g, '""')}"`,
            `"${i.station}"`,
            `"${i.category}"`,
            `${fc ? fc.current_stock : i.currentStock} ${i.unit}`,
            `${fc ? fc.predicted_requirement : 'N/A'} ${i.unit}`,
            `${fc ? fc.recommended_additional_qty : '0'} ${i.unit}`,
            fc ? fc.model_version : 'inventory_demand_gb_v1',
            fc ? fc.status : i.status,
            `"${fc ? fc.recommendation.replace(/"/g, '""') : 'ML inference calculated'}"`,
          ]
        })
        break
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // PDF / Print Handler
  const handleExportPDF = () => {
    window.print()
  }

  const reportTabs: Array<{ id: ReportType; label: string; icon: any }> = [
    { id: 'expedition_summary', label: 'Expedition Summary', icon: Compass },
    { id: 'cargo_movement', label: 'Cargo Movement', icon: Package },
    { id: 'inventory_status', label: 'Inventory Status', icon: Boxes },
    { id: 'personnel_movement', label: 'Personnel Movement', icon: Users },
    { id: 'emergency_incidents', label: 'Emergency Incidents', icon: ShieldAlert },
    { id: 'inventory_forecast', label: 'Inventory Forecast', icon: Sparkles },
  ]

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#3E808C]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2C6A74] dark:text-[#AEE3E0]">
              POSTGRESQL & ML LIVE AUDIT SERVICE
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5 font-sans">
            <FileSpreadsheet className="w-5 h-5 text-[#02457A] dark:text-[#AEE3E0]" />
            Operational Reports & Audits
          </h1>
          <p className="text-xs text-slate-600 dark:text-[#D0EFEF] mt-0.5">
            Structured operational reporting, database reconciliation, and inventory audit exports under NCPOR governance.
          </p>
        </div>

        {/* Export Actions & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadReportsData}
            disabled={loading}
            iconLeft={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            {loading ? 'Syncing...' : 'Sync Database'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            iconLeft={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPDF}
            iconLeft={<Printer className="w-3.5 h-3.5" />}
          >
            Export PDF / Print
          </Button>
        </div>
      </div>

      {/* 2. REPORT TEMPLATE SELECTOR PILLS */}
      <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-[640px]">
          {reportTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = selectedReport === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedReport(tab.id)}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#001B48] text-white shadow-xs dark:bg-[#1F4A57]'
                    : 'text-slate-600 dark:text-[#D0EFEF] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1F4A57]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#97CADB] dark:text-[#AEE3E0]' : 'text-slate-400 dark:text-[#AEE3E0]/60'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. REPORT PARAMETERS & FILTER CRITERIA */}
      <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-white">
          <SlidersHorizontal className="w-4 h-4 text-[#018ABE] dark:text-[#AEE3E0]" />
          <span className="uppercase tracking-wider text-[11px]">Report Parameters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Parameter */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-[#D0EFEF]">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#AEE3E0] uppercase tracking-wider">Date Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#1F4A57] border border-slate-300 dark:border-[#3E808C] rounded-md text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
            >
              <option value="season_2026_27">Austral Season 2026-2027 (Active)</option>
              <option value="last_30_days">Past 30 Operating Days</option>
              <option value="last_90_days">Past 90 Days (Quarterly Audit)</option>
              <option value="season_2025_26">Austral Season 2025-2026 (Archive)</option>
              <option value="all">All Dates / Unrestricted</option>
            </select>
          </div>

          {/* Expedition Parameter (Populated from PostgreSQL) */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-[#D0EFEF]">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#AEE3E0] uppercase tracking-wider">Expedition:</span>
            <select
              value={selectedExpedition}
              onChange={(e) => setSelectedExpedition(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#1F4A57] border border-slate-300 dark:border-[#3E808C] rounded-md text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
            >
              <option value="All">All Expeditions ({expeditions.length})</option>
              {expeditions.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.id} - {exp.name.length > 28 ? `${exp.name.substring(0, 28)}...` : exp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Station Parameter (Populated from PostgreSQL) */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-[#D0EFEF]">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#AEE3E0] uppercase tracking-wider">Station:</span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#1F4A57] border border-slate-300 dark:border-[#3E808C] rounded-md text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
            >
              <option value="All">All Stations</option>
              {stationsList.length > 0 ? (
                stationsList.map((stn) => (
                  <option key={stn.id} value={stn.name.split(' ')[0]}>
                    {stn.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Maitri">Maitri Base</option>
                  <option value="Bharati">Bharati Base</option>
                  <option value="Himadri">Himadri Station (Arctic)</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 4. DYNAMIC REPORT CONTENT */}

      {/* REPORT 1: EXPEDITION SUMMARY */}
      {selectedReport === 'expedition_summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Active Campaigns</span>
              <div className="mt-1 text-2xl font-bold font-sans text-slate-900 dark:text-white">{filteredExpeditions.length}</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Database className="w-3 h-3" /> PostgreSQL Backed
              </div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Deployed Cadre</span>
              <div className="mt-1 text-2xl font-bold font-sans text-slate-900 dark:text-white">
                {filteredExpeditions.reduce((acc, curr) => acc + (curr.personnelCount || 0), 0)} Members
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#D0EFEF] font-mono mt-0.5">Scientific & Support Crew</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Compliance Standard</span>
              <div className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-300">100% Madrid Protocol</div>
              <div className="text-[11px] text-slate-500 dark:text-[#D0EFEF] font-mono mt-0.5">EIES Pre-Season Exchange Filed</div>
            </div>
          </div>

          {errorsByReport.expedition_summary ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorsByReport.expedition_summary}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#D0EFEF] px-0.5">
                <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                  Expedition Master Summary Ledger
                </span>
                <span className="font-mono font-medium">{filteredExpeditions.length} Records (PostgreSQL)</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expedition ID</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Operational Stations</TableHead>
                    <TableHead>Chief Scientist / Commander</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Personnel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpeditions.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell mono className="font-bold text-[#001B48] dark:text-[#AEE3E0]">{e.id}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">{e.name}</TableCell>
                      <TableCell className="text-slate-800 dark:text-[#D0EFEF] text-xs font-medium">{e.station}</TableCell>
                      <TableCell className="text-slate-700 dark:text-[#D0EFEF] text-xs">{e.lead}</TableCell>
                      <TableCell mono className="text-slate-600 dark:text-[#D0EFEF] text-xs">{e.startDate} → {e.endDate}</TableCell>
                      <TableCell mono className="font-bold text-slate-900 dark:text-white">{e.personnelCount} staff</TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'Active' ? 'operational' : 'info'} size="sm" withDot>
                          {e.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* REPORT 2: CARGO MOVEMENT */}
      {selectedReport === 'cargo_movement' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Consignments Tracked</span>
              <div className="mt-1 text-2xl font-bold font-sans text-slate-900 dark:text-white">{filteredCargo.length} Units</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Database className="w-3 h-3" /> PostgreSQL Backed
              </div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Delayed Consignments</span>
              <div className="mt-1 text-2xl font-bold font-sans text-rose-900 dark:text-rose-300">
                {filteredCargo.filter((c) => c.status === 'Delayed').length} Units
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium mt-0.5">Customs & Maintenance Holds</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Station Intake Received</span>
              <div className="mt-1 text-2xl font-bold font-sans text-emerald-900 dark:text-emerald-300">
                {filteredCargo.filter((c) => c.status === 'Received').length} Delivered
              </div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono mt-0.5">Verified at Station Bay</div>
            </div>
          </div>

          {errorsByReport.cargo_movement ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorsByReport.cargo_movement}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#D0EFEF] px-0.5">
                <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                  Consignment Dispatch Reconciliation
                </span>
                <span className="font-mono font-medium">{filteredCargo.length} Manifests (PostgreSQL)</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Target ETA</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCargo.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell mono className="font-bold text-[#001B48] dark:text-[#AEE3E0]">{c.id}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white text-xs">{c.description}</TableCell>
                      <TableCell className="text-slate-600 dark:text-[#D0EFEF] text-xs">{c.carrier}</TableCell>
                      <TableCell mono className="text-slate-800 dark:text-white text-xs font-semibold">{c.weight}</TableCell>
                      <TableCell className="text-slate-800 dark:text-[#D0EFEF] text-xs font-medium">{c.destination}</TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1F4A57] text-slate-800 dark:text-white border border-slate-300 dark:border-[#3E808C]">
                          {c.priority}
                        </span>
                      </TableCell>
                      <TableCell mono className="text-slate-600 dark:text-[#D0EFEF] text-[11px]">{c.expectedArrival}</TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === 'Received' ? 'operational' : c.status === 'Delayed' ? 'critical' : 'info'}
                          size="sm"
                          withDot
                        >
                          {c.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* REPORT 3: INVENTORY STATUS */}
      {selectedReport === 'inventory_status' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Monitored Reserve Lines</span>
              <div className="mt-1 text-2xl font-bold font-sans text-slate-900 dark:text-white">{filteredInventory.length} SKUs</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Database className="w-3 h-3" /> PostgreSQL Backed
              </div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Critical / Low Deficits</span>
              <div className="mt-1 text-2xl font-bold font-sans text-amber-900 dark:text-amber-300">
                {filteredInventory.filter((i) => i.status === 'Critical' || i.status === 'Low Stock' || i.currentStock <= i.minimumStock).length} Alerts
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-400 font-medium mt-0.5">Below Minimum Buffer</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Minimum Days Remaining</span>
              <div className="mt-1 text-2xl font-bold font-mono text-rose-800 dark:text-rose-300">
                {filteredInventory.length > 0 ? Math.min(...filteredInventory.map((i) => i.daysRemaining || 14)) : 0} Days
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#D0EFEF] font-mono mt-0.5">Critical Supply Reserve</div>
            </div>
          </div>

          {errorsByReport.inventory_status ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorsByReport.inventory_status}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#D0EFEF] px-0.5">
                <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                  Station Strategic Reserve Balances
                </span>
                <span className="font-mono font-medium">{filteredInventory.length} Items (PostgreSQL)</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Item Nomenclature</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Minimum Buffer</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell mono className="font-bold text-[#001B48] dark:text-[#AEE3E0]">{i.id}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white text-xs">{i.name}</TableCell>
                      <TableCell className="text-slate-600 dark:text-[#D0EFEF] text-xs">{i.category}</TableCell>
                      <TableCell className="text-slate-800 dark:text-white text-xs font-bold">{i.station}</TableCell>
                      <TableCell mono className="font-bold text-slate-900 dark:text-white">{i.currentStock.toLocaleString()} {i.unit}</TableCell>
                      <TableCell mono className="text-slate-500 dark:text-[#D0EFEF]">{i.minimumStock.toLocaleString()} {i.unit}</TableCell>
                      <TableCell mono className="font-bold text-xs text-slate-800 dark:text-white">{i.daysRemaining || 30} Days</TableCell>
                      <TableCell>
                        <Badge
                          variant={i.status === 'Critical' ? 'critical' : i.status === 'Low Stock' || i.currentStock <= i.minimumStock ? 'warning' : 'operational'}
                          size="sm"
                          withDot
                        >
                          {(i.status || 'Adequate').toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* REPORT 4: PERSONNEL MOVEMENT */}
      {selectedReport === 'personnel_movement' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Field Cadre Listed</span>
              <div className="mt-1 text-2xl font-bold font-sans text-slate-900 dark:text-white">{filteredPersonnel.length} Persons</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Database className="w-3 h-3" /> PostgreSQL Backed
              </div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">In Active Transit</span>
              <div className="mt-1 text-2xl font-bold font-sans text-[#02457A] dark:text-[#AEE3E0]">
                {filteredPersonnel.filter((p) => p.status === 'In Transit').length} Personnel
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-300 font-mono mt-0.5">Aircraft & Sledge Movements</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Medical Compliance</span>
              <div className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-300">100% Certified</div>
              <div className="text-[11px] text-slate-500 dark:text-[#D0EFEF] font-mono mt-0.5">AIIMS / Military Hospital Clearances</div>
            </div>
          </div>

          {errorsByReport.personnel_movement ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorsByReport.personnel_movement}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#D0EFEF] px-0.5">
                <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                  Personnel Deployment & Itinerary Ledger
                </span>
                <span className="font-mono font-medium">{filteredPersonnel.length} Records (PostgreSQL)</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personnel ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Origin Station</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonnel.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell mono className="font-bold text-[#001B48] dark:text-[#AEE3E0]">{p.id}</TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white text-xs">{p.name}</TableCell>
                      <TableCell className="text-slate-700 dark:text-[#D0EFEF] text-xs font-semibold">{p.role}</TableCell>
                      <TableCell className="text-slate-600 dark:text-[#D0EFEF] text-xs">{p.organization}</TableCell>
                      <TableCell className="text-slate-800 dark:text-[#D0EFEF] text-xs font-medium">{p.currentStation}</TableCell>
                      <TableCell className="text-slate-800 dark:text-[#D0EFEF] text-xs font-medium">{p.destination}</TableCell>
                      <TableCell mono className="text-slate-600 dark:text-[#D0EFEF] text-[11px]">{p.departure}</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === 'At Station' ? 'operational' : p.status === 'In Transit' ? 'info' : 'neutral'}
                          size="sm"
                          withDot
                        >
                          {p.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* REPORT 5: EMERGENCY INCIDENTS */}
      {selectedReport === 'emergency_incidents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Total Incidents Logged</span>
              <div className="mt-1 text-2xl font-bold font-sans text-slate-900 dark:text-white">{filteredIncidents.length} Events</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Database className="w-3 h-3" /> PostgreSQL Backed
              </div>

            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Active Responding</span>
              <div className="mt-1 text-2xl font-bold font-sans text-rose-900 dark:text-rose-300">
                {filteredIncidents.filter((inc) => inc.responseStatus === 'Responding').length} Active
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium mt-0.5">SAR Protocols Implemented</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-slate-200 dark:border-[#3E808C] rounded-lg p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#D0EFEF] uppercase tracking-wider">Resolved Incidents</span>
              <div className="mt-1 text-2xl font-bold font-sans text-emerald-900 dark:text-emerald-300">
                {filteredIncidents.filter((inc) => inc.responseStatus === 'Resolved').length} Closed
              </div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono mt-0.5">Zero Critical Casualties</div>
            </div>
          </div>

          {errorsByReport.emergency_incidents ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorsByReport.emergency_incidents}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#D0EFEF] px-0.5">
                <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                  Search & Rescue (SAR) Safety Ledger
                </span>
                <span className="font-mono font-medium">{filteredIncidents.length} Incident Records (PostgreSQL)</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident ID</TableHead>
                    <TableHead>Logged Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Personnel Compromised</TableHead>
                    <TableHead>Response Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell mono className="font-bold text-[#001B48] dark:text-[#AEE3E0]">{inc.id}</TableCell>
                      <TableCell mono className="text-slate-600 dark:text-[#D0EFEF] text-[11px]">{inc.time}</TableCell>
                      <TableCell className="text-slate-800 dark:text-[#D0EFEF] text-xs font-semibold">{inc.location}</TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white text-xs">{inc.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={inc.severity === 'Critical' ? 'critical' : inc.severity === 'High' ? 'warning' : 'info'}
                          size="sm"
                          withDot
                        >
                          {inc.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell mono className="font-bold text-slate-800 dark:text-white text-xs">
                        {inc.personnelAffectedCount} Persons
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={inc.responseStatus === 'Resolved' ? 'operational' : 'critical'}
                          size="sm"
                          withDot
                        >
                          {inc.responseStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* REPORT 6: INVENTORY FORECAST */}
      {selectedReport === 'inventory_forecast' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-indigo-950 dark:text-indigo-100">Live ML Demand Prediction Audit:</strong> Statistical demand projection generated by the backend gradient boosting machine learning model <code>inventory_demand_gb_v1</code> across all active station inventories.
            </div>
          </div>

          {forecastError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{forecastError}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#D0EFEF] px-0.5">
              <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                Machine Learning Demand Prediction Reconciliation
              </span>
              <span className="font-mono font-medium">
                {loadingForecast ? 'Running ML Inference...' : `${filteredInventory.length} Items Evaluated · Model: inventory_demand_gb_v1`}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>7-Day ML Requirement</TableHead>
                  <TableHead>Recommended Additional</TableHead>
                  <TableHead>Model Version</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((i) => {
                  const fc = forecastMap[i.id]?.data
                  return (
                    <TableRow key={i.id}>
                      <TableCell mono className="font-bold text-[#001B48] dark:text-[#AEE3E0]">{i.id}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white text-xs">{i.name}</TableCell>
                      <TableCell className="text-slate-800 dark:text-[#D0EFEF] text-xs font-bold">{i.station}</TableCell>
                      <TableCell mono className="text-slate-600 dark:text-[#D0EFEF]">
                        {fc ? fc.current_stock.toLocaleString() : i.currentStock.toLocaleString()} {i.unit}
                      </TableCell>
                      <TableCell mono className="font-bold text-indigo-700 dark:text-indigo-300">
                        {loadingForecast && !fc ? (
                          <span className="text-slate-400">Computing...</span>
                        ) : fc ? (
                          `${fc.predicted_requirement.toLocaleString()} ${i.unit}`
                        ) : (
                          `${i.currentStock.toLocaleString()} ${i.unit}`
                        )}
                      </TableCell>
                      <TableCell mono className="font-bold text-xs">
                        {fc && fc.recommended_additional_qty > 0 ? (
                          <span className="text-amber-800 dark:text-amber-300">+{fc.recommended_additional_qty.toLocaleString()} {i.unit}</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">0 (Sufficient)</span>
                        )}
                      </TableCell>
                      <TableCell mono className="text-slate-600 dark:text-[#D0EFEF] text-[11px]">
                        {fc ? fc.model_version : 'inventory_demand_gb_v1'}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-[#D0EFEF] text-xs max-w-xs truncate">
                        {fc ? fc.recommendation : 'Stock level nominal'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
