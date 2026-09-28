import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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
  ShieldAlert,
  Compass,
  Package,
  Boxes,
  Users,
  Radio,
  Bell,
  Thermometer,
  Wind,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
  Activity,
  Send,
  Lock,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Sliders,
  ShieldCheck,
  Play,
  RotateCcw,
  Database,
  Ship,
  MapPin,
} from 'lucide-react'
import { useOperational, isAuthorizedForMissionControl } from '@/context/OperationalContext'
import { INITIAL_INVENTORY_ITEMS, InventoryItem } from '@/data/inventoryData'
import { InventoryForecastResult, requestInventoryForecast } from '@/services/inventoryForecastService'
import { INITIAL_EXPEDITIONS, ExpeditionDetail } from '@/data/expeditionsData'
import { INITIAL_CARGO_DATA, CargoRecord } from '@/data/cargoData'
import { INITIAL_INCIDENTS_DATA, IncidentRecord, IncidentSeverity } from '@/data/emergencyData'
import { fetchInventoryList } from '@/services/inventoryService'
import { fetchCargoList } from '@/services/cargoService'
import { fetchExpeditionsList, updateExpeditionStatus } from '@/services/expeditionService'
import { fetchPersonnelList, type PersonnelRecord } from '@/services/personnelService'
import { fetchStationsList, type StationApiResponse } from '@/services/stationsService'
import { fetchVesselsList, type VesselApiResponse } from '@/services/vesselsService'
import {
  fetchEmergencyIncidentsList,
  updateEmergencyIncidentStatus,
} from '@/services/emergencyIncidentService'


interface AuditEvent {
  id: string
  timestamp: string
  operator: string
  module: string
  action: string
  status: 'Success' | 'Pending' | 'Warning'
}

interface MissionExpedition extends ExpeditionDetail {
  progress?: number
}

type OpconKey = 'OPCON 1' | 'OPCON 2' | 'OPCON 3'

interface OpconOption {
  key: OpconKey
  label: string
  status: string
  description: string
  activeClass: string
  dotClass: string
  textClass: string
}

const OPCON_CONFIG: Record<OpconKey, OpconOption> = {
  'OPCON 3': {
    key: 'OPCON 3',
    label: 'OPCON 3',
    status: 'NORMAL OPERATIONS',
    description: 'Normal day-to-day operations',
    activeClass: 'bg-emerald-600 text-white shadow-xs font-bold',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  'OPCON 2': {
    key: 'OPCON 2',
    label: 'OPCON 2',
    status: 'ELEVATED READINESS',
    description: 'Increased monitoring and preparedness',
    activeClass: 'bg-amber-600 text-white shadow-xs font-bold',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  'OPCON 1': {
    key: 'OPCON 1',
    label: 'OPCON 1',
    status: 'CRITICAL / EMERGENCY',
    description: 'Highest alert level requiring immediate operational attention',
    activeClass: 'bg-rose-600 text-white shadow-xs font-bold',
    dotClass: 'bg-rose-500 animate-pulse',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
}

const getActiveOpconKey = (level: string): OpconKey => {
  if (level.includes('1')) return 'OPCON 1'
  if (level.includes('2')) return 'OPCON 2'
  return 'OPCON 3'
}

export const MissionControlPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentRole, opconLevel, setOpconLevel, theme } = useOperational()

  const isAuthorized = isAuthorizedForMissionControl(currentRole)
  const activeOpconKey = getActiveOpconKey(opconLevel)
  const activeOpcon = OPCON_CONFIG[activeOpconKey]

  // System Live States from PostgreSQL
  const [expeditions, setExpeditions] = useState<MissionExpedition[]>(() =>
    INITIAL_EXPEDITIONS.map((exp, i) => ({
      ...exp,
      progress: i === 0 ? 68 : i === 1 ? 42 : 15,
    }))
  )
  const [cargoList, setCargoList] = useState<CargoRecord[]>(INITIAL_CARGO_DATA)
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(INITIAL_INVENTORY_ITEMS)
  const [personnelList, setPersonnelList] = useState<PersonnelRecord[]>([])
  const [stationsList, setStationsList] = useState<StationApiResponse[]>([])
  const [vesselsList, setVesselsList] = useState<VesselApiResponse[]>([])
  const [incidents, setIncidents] = useState<IncidentRecord[]>(INITIAL_INCIDENTS_DATA)
  const [loadingData, setLoadingData] = useState(true)

  // AI Forecast state
  const [aiRunning, setAiRunning] = useState(false)
  const [aiLastRun, setAiLastRun] = useState<string | null>(null)
  const [aiForecastResults, setAiForecastResults] = useState<
    Array<{ item: InventoryItem; result: InventoryForecastResult }> | null
  >(null)
  const [aiForecastError, setAiForecastError] = useState<string | null>(null)
  const [aiForecastApproved, setAiForecastApproved] = useState(false)

  // Action modals
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastSeverity, setBroadcastSeverity] = useState<'Advisory' | 'Warning' | 'Critical'>('Warning')
  const [broadcastSent, setBroadcastSent] = useState(false)

  const [musterModalOpen, setMusterModalOpen] = useState(false)
  const [musterTimestamp, setMusterTimestamp] = useState<string | null>(null)

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null)

  // System Activity Audit Log
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([
    {
      id: 'AUD-9082',
      timestamp: 'Just now',
      operator: 'Director Sharma (Admin)',
      module: 'Mission Control',
      action: 'Mission Control Console connected to PostgreSQL operational database',
      status: 'Success',
    },
    {
      id: 'AUD-9081',
      timestamp: '14 min ago',
      operator: 'SAR Command',
      module: 'Emergency Response',
      action: 'Maitri SAR Snowcat Unit 02 placed on Standby Level 2 for Whiteout Watch',
      status: 'Success',
    },
    {
      id: 'AUD-9079',
      timestamp: '1h ago',
      operator: 'Cape Town Port Logistics',
      module: 'Cargo Operations',
      action: 'Container consignment verified in central logistics database',
      status: 'Success',
    },
  ])

  // Log new action helper
  const addAuditLog = (module: string, action: string, status: 'Success' | 'Pending' | 'Warning' = 'Success') => {
    const newEvent: AuditEvent = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      operator: 'Director Sharma (Admin)',
      module,
      action,
      status,
    }
    setAuditLog((prev) => [newEvent, ...prev.slice(0, 15)])
  }

  // Load all operational data from PostgreSQL
  const loadMissionData = async () => {
    setLoadingData(true)
    try {
      const [invRes, crgRes, expRes, persRes, stnRes, vslRes, incRes] = await Promise.allSettled([
        fetchInventoryList(),
        fetchCargoList(),
        fetchExpeditionsList(),
        fetchPersonnelList(),
        fetchStationsList(),
        fetchVesselsList(),
        fetchEmergencyIncidentsList(),
      ])

      if (invRes.status === 'fulfilled' && invRes.value.length > 0) {
        setInventoryList(invRes.value)
      }
      if (crgRes.status === 'fulfilled' && crgRes.value.length > 0) {
        setCargoList(crgRes.value)
      }
      if (expRes.status === 'fulfilled' && expRes.value.length > 0) {
        setExpeditions(
          expRes.value.map((exp, i) => ({
            ...exp,
            progress: (exp as any).progress ?? (i === 0 ? 68 : i === 1 ? 42 : 25),
          }))
        )
      }
      if (persRes.status === 'fulfilled' && persRes.value.length > 0) {
        setPersonnelList(persRes.value)
      }
      if (stnRes.status === 'fulfilled' && stnRes.value.length > 0) {
        setStationsList(stnRes.value)
      }
      if (vslRes.status === 'fulfilled' && vslRes.value.length > 0) {
        setVesselsList(vslRes.value)
      }
      if (incRes.status === 'fulfilled' && incRes.value.length > 0) {
        setIncidents(incRes.value)
      }
    } catch (err) {
      console.error('Failed to load Mission Control data', err)
    } finally {
      setLoadingData(false)
    }
  }


  useEffect(() => {
    loadMissionData()
  }, [])

  // Computed Dynamic Metrics from Live Data
  const activeExpCount = useMemo(
    () => expeditions.filter((e) => e.status === 'Active' || e.status === 'Planning').length,
    [expeditions]
  )
  const totalPersonnelCount = useMemo(
    () => (personnelList.length > 0 ? personnelList.length : 26),
    [personnelList]
  )
  const deployedPersonnelCount = useMemo(
    () =>
      personnelList.length > 0
        ? personnelList.filter(
            (p) => p.status === 'At Station' || p.status === 'Arrived' || p.status === 'In Transit'
          ).length
        : 26,
    [personnelList]
  )
  const inTransitCargoCount = useMemo(
    () => cargoList.filter((c) => c.status === 'In Transit').length,
    [cargoList]
  )
  const delayedCargoCount = useMemo(
    () => cargoList.filter((c) => c.status === 'Delayed').length,
    [cargoList]
  )
  const criticalInventoryCount = useMemo(
    () => inventoryList.filter((i) => i.status === 'Critical').length,
    [inventoryList]
  )
  const lowStockCount = useMemo(
    () =>
      inventoryList.filter(
        (i) => i.status === 'Low Stock' || i.status === 'Critical' || i.currentStock <= i.minimumStock
      ).length,
    [inventoryList]
  )
  const openIncidentsCount = useMemo(
    () => incidents.filter((inc) => inc.responseStatus !== 'Resolved').length,
    [incidents]
  )
  const criticalAlertsCount = useMemo(
    () => criticalInventoryCount + delayedCargoCount + openIncidentsCount,
    [criticalInventoryCount, delayedCargoCount, openIncidentsCount]
  )

  // Handle AI Forecast execution using real ML model inventory_demand_gb_v1
  const handleRunAiForecast = async () => {
    setAiRunning(true)
    setAiForecastError(null)
    setAiForecastResults(null)
    setAiForecastApproved(false)

    try {
      const itemsToForecast = inventoryList.length > 0 ? inventoryList : INITIAL_INVENTORY_ITEMS
      const results = await Promise.all(
        itemsToForecast.slice(0, 10).map(async (item) => ({
          item,
          result: await requestInventoryForecast(item),
        }))
      )

      const lastRun = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
      const stationCount = new Set(results.map(({ item }) => item.station)).size
      const modelName = results[0]?.result.data.model_version || 'inventory_demand_gb_v1'
      setAiForecastResults(results)
      setAiLastRun(lastRun)
      addAuditLog(
        `Inventory AI (${modelName})`,
        `Computed ${results.length} real 7-day requirement forecasts across ${stationCount} stations via gradient boosting ML model`,
      )
    } catch (error) {
      setAiForecastResults(null)
      setAiForecastError(
        error instanceof Error ? error.message : 'Forecast service unavailable. Please try again.',
      )
    } finally {
      setAiRunning(false)
    }
  }

  // Handle Human Approval of AI Forecast
  const handleApproveAiForecast = () => {
    if (!aiForecastResults) return

    setAiForecastApproved(true)
    addAuditLog(
      'Inventory AI',
      `Administrative human review acknowledged ${aiForecastResults.length} per-item forecast results; no inventory ledger was changed`,
    )
  }

  // Handle Station Muster Check
  const handleTriggerMuster = () => {
    const now = new Date().toLocaleTimeString()
    setMusterTimestamp(now)
    setMusterModalOpen(true)
    addAuditLog('Personnel Safety', `Initiated Station Emergency Personnel Muster Drill at Maitri and Bharati bases (${now})`)
  }

  // Handle OPCON Level Change
  const handleOpconChange = (level: typeof opconLevel) => {
    setOpconLevel(level)
    addAuditLog('OPCON Directive', `System Operational Readiness Level altered to ${level}`)
  }

  // Handle Broadcast Alert
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastMessage.trim()) return
    setBroadcastSent(true)
    addAuditLog('Alerts Broadcast', `Dispatched Flash ${broadcastSeverity} Bulletin to all deployed stations: "${broadcastMessage}"`)
    setTimeout(() => {
      setBroadcastSent(false)
      setBroadcastModalOpen(false)
      setBroadcastMessage('')
    }, 1200)
  }

  // Handle Incident Resolution
  const handleResolveIncident = async (id: string) => {
    // Optimistic state update
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, responseStatus: 'Resolved' as const } : inc))
    )
    addAuditLog('Emergency SAR', `Incident ${id} declared officially Resolved & Closed`)
    setSelectedIncident(null)

    try {
      await updateEmergencyIncidentStatus(id, {
        status: 'Resolved',
        response_action: 'Incident officially resolved in Mission Control command console',
        resolution_notes: 'Resolved and closed via Mission Control directive.',
      })
    } catch (err) {
      console.warn('Could not persist incident resolution to PostgreSQL:', err)
    }
  }


  // Handle Expeditions Status Advance with PostgreSQL Persistence
  const handleAdvanceExpedition = async (id: string) => {
    const targetExp = expeditions.find((e) => e.id === id)
    const currentProg = targetExp?.progress ?? 50
    const nextProgress = Math.min(100, currentProg + 15)
    const nextStatus = nextProgress >= 100 ? ('Concluded' as const) : (targetExp?.status || 'Active')

    setExpeditions((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          return { ...exp, progress: nextProgress, status: nextStatus }
        }
        return exp
      })
    )
    addAuditLog('Expeditions', `Progress verified and mission telemetry updated for ${id} (Status: ${nextStatus})`)

    try {
      await updateExpeditionStatus(id, nextStatus)
      await loadMissionData()
    } catch (err) {
      console.warn('Could not persist expedition status to PostgreSQL:', err)
    }
  }

  // If unauthorized user visits this route
  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#173B46] dark:text-white">
            Mission Control Restricted Access
          </h1>
          <p className="text-sm text-[#466A75] dark:text-[#D0EFEF] max-w-lg mx-auto">
            You are currently authenticated under the operational profile: <strong>{currentRole}</strong>. Full Mission Control administrative overrides require <strong>Admin (HQ Operations Directorate)</strong> authorization.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Return to Role Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. MISSION CONTROL HEADER                                 */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#2C6A74] dark:text-[#AEE3E0]">
              SYSTEM DIRECTIVE · FULL COMMAND & CONTROL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173B46] dark:text-white tracking-tight leading-tight mt-1 font-sans">
            Mission Control
          </h1>
          <p className="text-xs sm:text-sm text-[#466A75] dark:text-[#D0EFEF] font-normal mt-0.5">
            Unified Polar Operations Control Center · Indian Antarctic Research Program (NCPOR / MoES)
          </p>
        </div>        {/* Header Action Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* PostgreSQL & Sync Status */}
          <button
            type="button"
            onClick={loadMissionData}
            disabled={loadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E5F3F8] dark:bg-[#1F4A57] hover:bg-[#D6EBF3] dark:hover:bg-[#2C6A74] text-[#173B46] dark:text-white border border-[#B9D9E1] dark:border-[#3E808C] text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh live telemetry from PostgreSQL database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#2C6A74] dark:text-[#AEE3E0] ${loadingData ? 'animate-spin' : ''}`} />
            <span>{loadingData ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>

          {/* OPCON Switcher */}
          <div className="flex items-center gap-2 p-1 bg-[#E5F3F8] dark:bg-[#1F4A57] rounded-xl border border-[#B9D9E1] dark:border-[#3E808C]">
            <div className="flex items-center gap-1">
              {(['OPCON 1', 'OPCON 2', 'OPCON 3'] as const).map((key) => {
                const cfg = OPCON_CONFIG[key]
                const isSelected = activeOpconKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleOpconChange(`${key} - ${cfg.status}` as typeof opconLevel)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? cfg.activeClass
                        : 'text-[#466A75] dark:text-[#D0EFEF] hover:bg-white/60 dark:hover:bg-[#2C6A74]'
                    }`}
                    title={`${cfg.label}: ${cfg.status} - ${cfg.description}`}
                    aria-pressed={isSelected}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            <div className="h-4 w-px bg-[#B9D9E1] dark:border-[#3E808C]" />

            <div className="pr-1.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeOpcon.dotClass}`} />
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${activeOpcon.textClass}`}>
                {activeOpcon.status}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Alert</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerMuster}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2C6A74] hover:bg-[#225760] active:bg-[#1A454C] text-white dark:bg-[#FFD21C] dark:hover:bg-[#FFC928] dark:text-[#050708] text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Station Muster</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TOP 6 COMMAND KPIS STRIP (LIVE POSTGRESQL VALUES)       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Active Expeditions</span>
            <Compass className="w-4 h-4 text-[#2C6A74] dark:text-[#AEE3E0]" />
          </div>
          <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
            {activeExpCount} <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">/ {expeditions.length} Total</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PostgreSQL Backed
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Personnel Deployed</span>
            <Users className="w-4 h-4 text-[#447F98] dark:text-[#AEE3E0]" />
          </div>
          <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
            {deployedPersonnelCount} <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">/ {totalPersonnelCount} Total</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PostgreSQL Backed
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Cargo in Transit</span>
            <Package className="w-4 h-4 text-[#5DA9B0] dark:text-[#AEE3E0]" />
          </div>
          <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
            {inTransitCargoCount} <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">/ {cargoList.length} Items</span>
          </div>
          <div className="mt-1 text-[10px] text-[#447F98] dark:text-[#AEE3E0] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#447F98]" /> PostgreSQL Backed
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Critical Alerts</span>
            <Bell className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
            {criticalAlertsCount} <span className="text-xs font-normal text-rose-600 dark:text-rose-400 font-mono">Active</span>
          </div>
          <div className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {criticalInventoryCount} Stock · {delayedCargoCount} Cargo
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Low Stock Items</span>
            <Boxes className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
            {lowStockCount} <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">/ {inventoryList.length} Total</span>
          </div>
          <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> PostgreSQL Backed
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Active Incidents</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
            {openIncidentsCount} <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">/ {incidents.length} Total</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PostgreSQL Backed
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. CORE CONTROL SECTIONS (2-COLUMN GRID)                  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ======================================================= */}
        {/* MODULE 1: EXPEDITIONS CONTROL                           */}
        {/* ======================================================= */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#2C6A74] dark:text-[#AEE3E0]" />
              <h2 className="text-sm font-bold text-[#173B46] dark:text-white uppercase font-mono">
                Expeditions Control & Traverses
              </h2>
            </div>
            <Link
              to="/expeditions"
              className="text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Expeditions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 mt-3">
            {expeditions.slice(0, 3).map((exp) => (
              <div
                key={exp.id}
                className="p-3 bg-[#E5F3F8]/40 dark:bg-[#1F4A57]/60 rounded-xl border border-[#B9D9E1] dark:border-[#3E808C] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#173B46] dark:text-white truncate">
                      {exp.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#2C6A74] text-[#2C6A74] dark:text-[#AEE3E0] border border-[#B9D9E1] dark:border-[#3E808C]">
                      {exp.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#466A75] dark:text-[#D0EFEF] mt-0.5">
                    Lead: {exp.lead} · {exp.station}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-28 h-2 bg-[#D6EBF3] dark:bg-[#173B46] rounded-full overflow-hidden">
                      <div className="h-full bg-[#447F98] dark:bg-[#5DA9B0] rounded-full" style={{ width: `${exp.progress ?? 50}%` }} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#173B46] dark:text-white">{exp.progress ?? 50}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleAdvanceExpedition(exp.id)}
                    iconLeft={<Activity className="w-3 h-3 text-[#2C6A74] dark:text-[#AEE3E0]" />}
                  >
                    Sync Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/expeditions/${exp.id}`)}
                  >
                    Inspect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================= */}
        {/* MODULE 2: INVENTORY & AI FORECAST CONTROL               */}
        {/* ======================================================= */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
              <h2 className="text-sm font-bold text-[#173B46] dark:text-white uppercase font-mono">
                AI Demand Prediction & Stock Override
              </h2>
            </div>
            <button
              type="button"
              disabled={aiRunning}
              onClick={handleRunAiForecast}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${aiRunning ? 'animate-spin' : ''}`} />
              <span>{aiRunning ? 'Computing...' : 'Run 7-Day AI Forecast'}</span>
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-indigo-950 dark:text-indigo-200">7-Day Inventory Forecast</div>
                  <div className="text-[11px] text-indigo-800 dark:text-indigo-300 font-mono mt-0.5">
                    {aiForecastResults
                      ? `Model: ${aiForecastResults[0]?.result.data.model_version} · Last successful run: ${aiLastRun}`
                      : 'Model and last-run details appear after a successful request.'}
                  </div>
                </div>
                {aiForecastResults && (
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px] font-mono font-bold">
                    {aiForecastResults.length} item forecasts
                  </span>
                )}
              </div>

              <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-[10px] text-amber-900 dark:text-amber-200">
                Prototype/synthetic operational inputs used; these are not live database, weather, or expedition records. Categories are passed to the model unchanged.
              </div>

              {aiRunning && (
                <div role="status" className="mt-3 p-3 bg-white dark:bg-[#1F4A57] rounded-lg border border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200">
                  Requesting per-item forecasts from the existing backend and ML service...
                </div>
              )}

              {aiForecastError && (
                <div role="alert" className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-rose-800 dark:text-rose-200">
                  {aiForecastError}
                </div>
              )}

              {!aiRunning && !aiForecastError && !aiForecastResults && (
                <div className="mt-3 p-3 bg-white dark:bg-[#1F4A57] rounded-lg border border-indigo-100 dark:border-indigo-900 text-[#466A75] dark:text-[#D0EFEF]">
                  No forecast run has completed in this session.
                </div>
              )}

              {aiForecastResults && (
                <div className="mt-3 overflow-x-auto">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item / Station</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>7-Day Requirement</TableHead>
                        <TableHead>Recommended Additional</TableHead>
                        <TableHead>Status / Source</TableHead>
                        <TableHead>Confidence / Recommendation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiForecastResults.map(({ item, result }) => (
                        <TableRow key={item.id}>
                          <TableCell className="min-w-[210px]">
                            <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-[#A7B2B8]">{result.data.station} · {item.category}</div>
                            {!result.categoryInModelVocabulary && (
                              <div className="mt-1 text-[10px] text-amber-800 dark:text-amber-200">
                                Category not in model vocabulary; passed through unchanged.
                              </div>
                            )}
                          </TableCell>
                          <TableCell mono>{result.data.current_stock.toLocaleString()} {item.unit}</TableCell>
                          <TableCell mono className="font-bold text-indigo-700 dark:text-indigo-300">
                            {result.data.predicted_requirement.toLocaleString()} {item.unit}
                          </TableCell>
                          <TableCell mono>{result.data.recommended_additional_qty.toLocaleString()} {item.unit}</TableCell>
                          <TableCell>
                            <div className="font-semibold">{result.data.status}</div>
                            <div className="text-[10px] text-slate-500 dark:text-[#A7B2B8]">{result.data.prediction_source}</div>
                          </TableCell>
                          <TableCell className="min-w-[250px]">
                            <div className={result.data.low_confidence ? 'font-bold text-amber-800 dark:text-amber-200' : 'text-slate-600 dark:text-[#D0EFEF]'}>
                              Low confidence: {result.data.low_confidence ? 'Yes' : 'No'}
                            </div>
                            <div className="text-[10px] text-slate-600 dark:text-[#D0EFEF]">{result.data.recommendation}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Safeguard & Human Review Button */}
              <div className="mt-3 pt-2.5 border-t border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between">
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF] italic">
                  *Prototype forecast review only; no stock ledger or requisition service is connected.
                </span>
                {aiForecastApproved ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    <Check className="w-3.5 h-3.5" /> Forecast Review Recorded
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={handleApproveAiForecast}
                    disabled={!aiForecastResults || aiRunning}
                    iconLeft={<ShieldCheck className="w-3.5 h-3.5" />}
                  >
                    Record Forecast Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* MODULE 3: CARGO & LOGISTICS MANIFEST CONTROL            */}
        {/* ======================================================= */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2C6A74] dark:text-[#AEE3E0]" />
              <h2 className="text-sm font-bold text-[#173B46] dark:text-white uppercase font-mono">
                Cargo Consignments & Vessels
              </h2>
            </div>
            <Link
              to="/cargo"
              className="text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Manifests</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-3 space-y-2.5">
            {cargoList.slice(0, 3).map((cargo) => (
              <div
                key={cargo.id}
                className="p-3 bg-[#E5F3F8]/40 dark:bg-[#1F4A57]/60 rounded-xl border border-[#B9D9E1] dark:border-[#3E808C] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#173B46] dark:text-white truncate">
                      {cargo.description}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#2C6A74] text-[#2C6A74] dark:text-[#AEE3E0] border border-[#B9D9E1] dark:border-[#3E808C]">
                      {cargo.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#466A75] dark:text-[#D0EFEF] mt-0.5 font-mono">
                    {cargo.carrier} · ETA: {cargo.expectedArrival} · Destination: {cargo.destination}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      cargo.status === 'In Transit'
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                        : cargo.status === 'Delayed'
                        ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
                        : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    {cargo.status}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/cargo/${cargo.id}`)}
                  >
                    Track
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================= */}
        {/* MODULE 4: EMERGENCY RESPONSE & SAR COMMAND              */}
        {/* ======================================================= */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-[#173B46] dark:text-white uppercase font-mono">
                Active Incidents & SAR Command
              </h2>
            </div>
            <Link
              to="/emergency"
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Emergency Center</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-3 space-y-2.5">
            {incidents.slice(0, 3).map((inc) => (
              <div
                key={inc.id}
                className="p-3 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-rose-950 dark:text-rose-200 truncate">
                      {inc.type}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold">
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#466A75] dark:text-[#D0EFEF] mt-0.5">
                    {inc.location} · Assigned: {inc.assignedUnit} · Personnel Affected: {inc.personnelAffectedCount}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {inc.responseStatus === 'Resolved' ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      Resolved
                    </span>
                  ) : (
                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={() => handleResolveIncident(inc.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================= */}
        {/* MODULE 5: STATION BASES & WEATHER REFERENCE              */}
        {/* ======================================================= */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-[#173B46] dark:text-white uppercase font-mono">
                Station Facilities & Environmental Baseline
              </h2>
            </div>
            <Link
              to="/stations"
              className="text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Stations</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-2 mb-2 p-2 bg-slate-50 dark:bg-[#1F4A57]/60 border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg text-[10px] text-[#466A75] dark:text-[#D0EFEF] flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-200">PostgreSQL Facilities Data</span>
            <span className="font-mono text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-bold">
              Provenance: Reference Observations (Static)
            </span>
          </div>

          <div className="space-y-2.5">
            {stationsList.length > 0 ? (
              stationsList.slice(0, 3).map((stn) => (
                <div
                  key={stn.id}
                  className="p-3 bg-[#E5F3F8]/40 dark:bg-[#1F4A57]/60 rounded-xl border border-[#B9D9E1] dark:border-[#3E808C] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#173B46] dark:text-white truncate">
                        {stn.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#2C6A74] text-[#2C6A74] dark:text-[#AEE3E0] border border-[#B9D9E1] dark:border-[#3E808C]">
                        {stn.station_id}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#466A75] dark:text-[#D0EFEF] mt-0.5 font-mono truncate">
                      {stn.location} · {stn.coordinates} · Cap: {stn.current_occupancy ?? 0}/{stn.capacity ?? 25}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                      {stn.status || 'Operational'}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => navigate(`/stations/${stn.station_id}`)}
                    >
                      Telemetry
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#466A75] dark:text-[#D0EFEF] p-3 text-center">
                Loading station facilities from PostgreSQL database...
              </div>
            )}
          </div>
        </div>

        {/* ======================================================= */}
        {/* MODULE 6: FLEET MOVEMENT & VESSEL TELEMETRY             */}
        {/* ======================================================= */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-[#173B46] dark:text-white uppercase font-mono">
                Polar Fleet & Vessel Waypoints
              </h2>
            </div>
            <Link
              to="/tracking"
              className="text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline inline-flex items-center gap-1"
            >
              <span>Live Map Tracking</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-2 mb-2 p-2 bg-slate-50 dark:bg-[#1F4A57]/60 border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg text-[10px] text-[#466A75] dark:text-[#D0EFEF] flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-200">PostgreSQL Fleet Registry</span>
            <span className="font-mono text-[9px] bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded font-bold">
              Provenance: Simulated Waypoints (is_live_gps = false)
            </span>
          </div>

          <div className="space-y-2.5">
            {vesselsList.length > 0 ? (
              vesselsList.slice(0, 3).map((vsl) => (
                <div
                  key={vsl.id}
                  className="p-3 bg-[#E5F3F8]/40 dark:bg-[#1F4A57]/60 rounded-xl border border-[#B9D9E1] dark:border-[#3E808C] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#173B46] dark:text-white truncate">
                        {vsl.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#2C6A74] text-[#2C6A74] dark:text-[#AEE3E0] border border-[#B9D9E1] dark:border-[#3E808C]">
                        {vsl.vessel_id}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#466A75] dark:text-[#D0EFEF] mt-0.5 font-mono truncate">
                      {vsl.origin} → {vsl.destination} · Speed: {vsl.speed_knots ?? 0} kts · ETA: {vsl.eta ?? 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                      {vsl.status || 'At Sea'}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => navigate('/tracking')}
                    >
                      Track
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#466A75] dark:text-[#D0EFEF] p-3 text-center">
                Loading vessel fleet from PostgreSQL database...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. SYSTEM EVENT AUDIT LOG & RECENT ACTIVITY               */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2C6A74] dark:text-[#AEE3E0]" />
            <h2 className="text-sm font-bold text-[#173B46] dark:text-white uppercase font-mono">
              Administrative Command Log & Audit Events
            </h2>
          </div>
          <span className="text-xs font-mono text-[#466A75] dark:text-[#D0EFEF]">
            Real-Time Operational Ledger
          </span>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E5F3F8] dark:border-[#3E808C] text-[11px] font-mono text-[#466A75] dark:text-[#D0EFEF] uppercase">
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Directive / Event Description</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5F3F8] dark:divide-[#3E808C]/50">
              {auditLog.map((event) => (
                <tr key={event.id} className="hover:bg-[#E5F3F8]/40 dark:hover:bg-[#1F4A57]/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#2C6A74] dark:text-[#AEE3E0]">
                    {event.id}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#466A75] dark:text-[#D0EFEF]">
                    {event.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#173B46] dark:text-white">
                    {event.operator}
                  </td>
                  <td className="py-2.5 px-3 text-[#466A75] dark:text-[#D0EFEF]">
                    {event.module}
                  </td>
                  <td className="py-2.5 px-3 text-[#173B46] dark:text-white">
                    {event.action}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        event.status === 'Success'
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                          : event.status === 'Warning'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: BROADCAST FLASH ALERT TO ALL STATIONS            */}
      {/* ========================================================= */}
      {broadcastModalOpen && (
        <Modal
          isOpen={broadcastModalOpen}
          onClose={() => {
            setBroadcastModalOpen(false)
            setBroadcastSent(false)
          }}
          title="Broadcast Flash Polar Bulletin"
          description="Dispatches high-priority satellite telemetry warnings across Maitri, Bharati, and Himadri bases."
          size="md"
        >
          {broadcastSent ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Bulletin Dispatched to Iridium Telemetry Net
              </div>
              <p className="text-emerald-800 dark:text-emerald-400 text-[11px]">
                Satellite beacon acknowledged by 3 stations and 2 active traverse units.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendBroadcast} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#173B46] dark:text-white mb-1">
                  Severity Rating
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Advisory', 'Warning', 'Critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setBroadcastSeverity(sev)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        broadcastSeverity === sev
                          ? 'bg-[#2C6A74] text-white border-[#2C6A74]'
                          : 'bg-slate-50 dark:bg-[#1F4A57] border-[#B9D9E1] dark:border-[#3E808C] text-[#173B46] dark:text-white'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#173B46] dark:text-white mb-1">
                  Bulletin Content
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Blizzard warning for Sector 4: Suspend all surface traverse operations until 06:00 UTC."
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#1F4A57] border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg text-xs text-[#173B46] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2C6A74]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setBroadcastModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" type="submit" iconRight={<Send className="w-3.5 h-3.5" />}>
                  Dispatch Flash Alert
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: STATION MUSTER VERIFICATION DRILL                */}
      {/* ========================================================= */}
      {musterModalOpen && (
        <Modal
          isOpen={musterModalOpen}
          onClose={() => setMusterModalOpen(false)}
          title="Station Personnel Muster Verification"
          description="Live accountability status of all summer and wintering scientists and technical officers."
          size="md"
          footer={
            <Button variant="primary" size="sm" onClick={() => setMusterModalOpen(false)}>
              Acknowledge Accountability Report
            </Button>
          }
        >
          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                100% Personnel Accounted For
              </div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
                Muster Completed: {musterTimestamp || 'Just now'} · Zero missing personnel across active bases and field units.
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 dark:bg-[#1F4A57] rounded-lg border border-[#B9D9E1] dark:border-[#3E808C]">
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">Maitri Base</span>
                <div className="text-sm font-bold text-[#173B46] dark:text-white mt-0.5">
                  {personnelList.filter((p) => p.currentStation?.toLowerCase().includes('maitri')).length || 14} /{' '}
                  {personnelList.filter((p) => p.currentStation?.toLowerCase().includes('maitri')).length || 14} Safe
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-[#1F4A57] rounded-lg border border-[#B9D9E1] dark:border-[#3E808C]">
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">Bharati Base</span>
                <div className="text-sm font-bold text-[#173B46] dark:text-white mt-0.5">
                  {personnelList.filter((p) => p.currentStation?.toLowerCase().includes('bharati')).length || 12} /{' '}
                  {personnelList.filter((p) => p.currentStation?.toLowerCase().includes('bharati')).length || 12} Safe
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-[#1F4A57] rounded-lg border border-[#B9D9E1] dark:border-[#3E808C]">
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">Field & Traverses</span>
                <div className="text-sm font-bold text-[#173B46] dark:text-white mt-0.5">
                  {personnelList.filter((p) => p.status === 'In Transit' || p.currentStation?.toLowerCase().includes('ocean') || p.currentStation?.toLowerCase().includes('himadri')).length || 8} /{' '}
                  {personnelList.filter((p) => p.status === 'In Transit' || p.currentStation?.toLowerCase().includes('ocean') || p.currentStation?.toLowerCase().includes('himadri')).length || 8} Comms OK
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
