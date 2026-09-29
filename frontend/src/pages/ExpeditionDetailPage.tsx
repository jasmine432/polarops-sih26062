import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  EmptyState,
} from '@/components/ui'
import {
  Compass,
  ArrowLeft,
  Users,
  Package,
  Boxes,
  ShieldAlert,
  Wind,
  Clock,
  MapPin,
  Ship,
  Radio,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Thermometer,
  Eye,
  Check,
  Plane,
  HeartPulse,
  Activity,
  Layers,
  Scale,
  ShieldCheck,
  Navigation,
  Cpu,
} from 'lucide-react'
import { INITIAL_EXPEDITIONS, ExpeditionDetail } from '@/data/expeditionsData'
import { fetchExpeditionsList } from '@/services/expeditionService'
import { PackingAndLoadPlanner } from '@/components/expeditions/PackingAndLoadPlanner'
import { MissionReadinessAudit } from '@/components/expeditions/MissionReadinessAudit'
import { ExpeditionProgressTracker } from '@/components/expeditions/ExpeditionProgressTracker'
import { WhatIfSimulator } from '@/components/expeditions/WhatIfSimulator'

type TabKey =
  | 'overview'
  | 'progress'
  | 'readiness'
  | 'simulation'
  | 'personnel'
  | 'packing'
  | 'cargo'
  | 'inventory'
  | 'environmental'
  | 'incidents'
  | 'timeline'

export const ExpeditionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Master expeditions list from PostgreSQL
  const [expeditionsList, setExpeditionsList] = useState<ExpeditionDetail[]>(INITIAL_EXPEDITIONS)

  useEffect(() => {
    fetchExpeditionsList()
      .then((data) => {
        if (data && data.length > 0) {
          setExpeditionsList(data)
        }
      })
      .catch(() => {})
  }, [])

  // Find expedition by ID or fallback
  const expedition: ExpeditionDetail | undefined = expeditionsList.find(
    (exp) =>
      exp.id.toLowerCase() === id?.toLowerCase() ||
      exp.id.replace(/-/g, '').toLowerCase() === id?.replace(/-/g, '').toLowerCase()
  )

  const rawTabParam = searchParams.get('tab')
  const validTabs: TabKey[] = [
    'overview',
    'progress',
    'readiness',
    'simulation',
    'personnel',
    'packing',
    'cargo',
    'inventory',
    'environmental',
    'incidents',
    'timeline',
  ]

  const normalizeTab = (raw: string | null): TabKey | null => {
    if (!raw) return null
    const cleaned = raw.toLowerCase().trim()
    if (validTabs.includes(cleaned as TabKey)) return cleaned as TabKey
    if (['simulation', 'what-if', 'whatif', 'simulator', 'what_if'].includes(cleaned)) return 'simulation'
    if (['progress', 'route', 'tracking', 'progress-route', 'progress_route'].includes(cleaned)) return 'progress'
    if (['readiness', 'audit', 'mission-readiness', 'mission_readiness'].includes(cleaned)) return 'readiness'
    if (['packing', 'load', 'packing-load', 'individual-packing', 'packing_load'].includes(cleaned)) return 'packing'
    if (['env', 'environment', 'weather'].includes(cleaned)) return 'environmental'
    if (['incident'].includes(cleaned)) return 'incidents'
    if (['activity', 'history'].includes(cleaned)) return 'timeline'
    return null
  }

  const tabParam = normalizeTab(rawTabParam)

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      return tabParam
    }
    return 'overview'
  })

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabSelect = (tab: TabKey) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  if (!expedition) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/expeditions')} iconLeft={<ArrowLeft className="w-4 h-4" />}>
            Back to Expeditions
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Compass className="w-8 h-8 text-slate-400" />}
              title="Expedition Record Not Found"
              description={`No polar expedition with identifier "${id}" is registered in the operational database.`}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/expeditions')}>
                  Return to Expeditions Directory
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusVariant =
    expedition.status === 'Active'
      ? 'operational'
      : expedition.status === 'Planning'
      ? 'info'
      : expedition.status === 'Returning'
      ? 'warning'
      : 'neutral'

  return (
    <div className="space-y-6">
      {/* 1. TOP BREADCRUMB & BACK BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/expeditions" className="hover:text-[#02457A] font-medium flex items-center gap-1 transition-colors">
            <Compass className="w-3.5 h-3.5 text-[#02457A]" />
            Expeditions
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">{expedition.id}</span>
        </div>

        <Button
          variant="secondary"
          size="xs"
          onClick={() => navigate('/expeditions')}
          iconLeft={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          All Expeditions
        </Button>
      </div>

      {/* 2. HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#001B48] text-white tracking-wider">
                {expedition.id}
              </span>
              <Badge variant={statusVariant} size="sm" withDot>
                {expedition.status.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">Mandate: <strong className="text-slate-800 font-semibold">{expedition.mandate}</strong></span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{expedition.name}</h1>
            <p className="text-xs text-slate-600 max-w-4xl">{expedition.season}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-right min-w-[180px]">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Campaign Window</div>
              <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                {expedition.startDate} → {expedition.endDate}
              </div>
            </div>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div>
            <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Expedition Lead</span>
            <span className="font-bold text-slate-900">{expedition.lead}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Assigned Station(s)</span>
            <span className="font-bold text-slate-900">{expedition.station}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Personnel Deployed</span>
            <span className="font-mono font-bold text-slate-900">{expedition.personnelCount} Members</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Vessel Support</span>
            <span className="font-bold text-slate-900 truncate block">{expedition.primaryVessel}</span>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="border border-slate-200 bg-white rounded-xl p-1.5 shadow-xs overflow-x-auto">
        <nav className="flex space-x-1 min-w-max" aria-label="Expedition Tabs">
          {[
            { key: 'overview', label: 'Overview', icon: Layers, count: null, badge: null },
            { key: 'progress', label: 'Progress & Route', icon: Navigation, count: null, badge: 'Route Tracking' },
            { key: 'readiness', label: 'Mission Readiness', icon: ShieldCheck, count: null, badge: '7-Pillar Audit' },
            { key: 'simulation', label: 'What-If Simulation', icon: Cpu, count: null, badge: 'Decision Support' },
            { key: 'personnel', label: 'Personnel', icon: Users, count: expedition.personnel.length, badge: null },
            { key: 'packing', label: 'Individual Packing & Load', icon: Scale, count: null, badge: 'Capacity Planning' },
            { key: 'cargo', label: 'Cargo', icon: Package, count: expedition.cargo.length, badge: null },
            { key: 'inventory', label: 'Inventory Requirements', icon: Boxes, count: expedition.inventory.length, badge: null },
            { key: 'environmental', label: 'Environmental Conditions', icon: Wind, count: expedition.environmental.length, badge: null },
            { key: 'incidents', label: 'Incidents', icon: ShieldAlert, count: expedition.incidents.length, badge: null },
            { key: 'timeline', label: 'Activity Timeline', icon: Clock, count: expedition.timeline.length, badge: null },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabSelect(tab.key as TabKey)}
                className={`group inline-flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#02457A] ${
                  isActive
                    ? 'bg-[#02457A] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold tracking-tight ${
                      isActive
                        ? 'bg-sky-400/20 text-sky-200 border border-sky-300/30'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.count !== null && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>


      {/* 4. TAB CONTENTS */}
      <div className="space-y-4">
        {/* TAB: PROGRESS & ROUTE TRACKER */}
        {activeTab === 'progress' && (
          <ExpeditionProgressTracker
            expeditionId={expedition.id}
            expeditionName={expedition.name}
            station={expedition.station}
          />
        )}

        {/* TAB: MISSION READINESS ENGINE */}
        {activeTab === 'readiness' && (
          <MissionReadinessAudit
            expeditionId={expedition.id}
            expeditionName={expedition.name}
          />
        )}

        {/* TAB: WHAT-IF MISSION SIMULATOR */}
        {activeTab === 'simulation' && (
          <WhatIfSimulator
            expeditionId={expedition.id}
            expeditionName={expedition.name}
            station={expedition.station}
          />
        )}


        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Operational Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
                  <span>Personnel Roster</span>
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                  {expedition.personnelCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {expedition.personnel.length} listed in active duty
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
                  <span>Cargo Manifests</span>
                  <Package className="w-3.5 h-3.5 text-[#02457A]" />
                </div>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                  {expedition.cargoCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {expedition.cargo.filter((c) => c.status === 'Delayed').length} delayed shipments
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
                  <span>Inventory Items</span>
                  <Boxes className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                  {expedition.inventory.length}
                </div>
                <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                  {expedition.inventory.filter((i) => i.status !== 'Normal').length} require attention
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
                  <span>Active Incidents</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                  {expedition.incidents.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {expedition.incidents.filter((i) => i.severity === 'Critical').length} critical safety flag
                </div>
              </div>
            </div>

            {/* Campaign Parameters & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200">
                    <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
                      Operational Brief & Mission Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs leading-relaxed text-slate-700">
                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {expedition.notes}
                    </p>
                    <p className="text-slate-600">
                      Operations are conducted under the authority of the Ministry of Earth Sciences (MoES) and managed by NCPOR Goa. Environmental protocols adhere strictly to the Protocol on Environmental Protection to the Antarctic Treaty (Madrid Protocol, 1991).
                    </p>
                  </CardContent>
                </Card>

                {/* Sub-system quick matrix */}
                <Card>
                  <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200">
                    <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
                      Expedition Integration Sub-systems
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Users className="w-3.5 h-3.5 text-[#02457A]" />
                          <span>Personnel & Safety</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">
                          {expedition.personnelCount} personnel deployed. Full AIIMS medical clearance and ITBP polar survival certs active.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Package className="w-3.5 h-3.5 text-[#018ABE]" />
                          <span>Cargo & Vessel Staging</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">
                          Vessel {expedition.primaryVessel}. Air bridge via {expedition.airSupport}.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Boxes className="w-3.5 h-3.5 text-amber-600" />
                          <span>Critical Consumables</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">
                          Fuel, RO membrane filters, emergency blood plasma, and turbine turbochargers tracked.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Radio className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Telemetry & Comms</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">
                          Ground Station link: {expedition.commsLink}.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200">
                    <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
                      Command & Operations Desk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Expedition Leader</span>
                      <strong className="text-slate-900">{expedition.lead}</strong>
                      <div className="text-[11px] text-slate-600">{expedition.leadRole}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{expedition.leadOrg}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Primary Polar Vessel</span>
                      <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5 text-[#02457A]" />
                        <span>{expedition.primaryVessel}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Air Support & Feeder</span>
                      <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <Plane className="w-3.5 h-3.5 text-[#02457A]" />
                        <span>{expedition.airSupport}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Satellite Comms Feed</span>
                      <div className="font-mono text-slate-800 text-[11px] mt-0.5">{expedition.commsLink}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PERSONNEL */}
        {activeTab === 'personnel' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Expedition Personnel Roster ({expedition.personnel.length} listed of {expedition.personnelCount} total)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Deployed scientific, technical, and military logistics personnel assigned to this campaign
                </p>
              </div>
              <Badge variant="neutral" size="sm" mono>
                100% Medical & Survival Cleared
              </Badge>
            </div>

            {expedition.personnel.length === 0 ? (
              <EmptyState
                icon={<Users className="w-6 h-6 text-slate-400" />}
                title="No Personnel Records Assigned"
                description="Personnel assignments for this expedition have not yet been synchronized from the NCPOR database."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role & Designation</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Blood</TableHead>
                    <TableHead>Medical Clearance</TableHead>
                    <TableHead>Survival Cert</TableHead>
                    <TableHead>Duty Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expedition.personnel.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell mono className="font-bold text-slate-900">
                        {p.id}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">{p.name}</TableCell>
                      <TableCell className="text-slate-800 font-semibold">{p.role}</TableCell>
                      <TableCell className="font-medium text-slate-700">{p.station}</TableCell>
                      <TableCell className="text-slate-600 text-xs">{p.organization}</TableCell>
                      <TableCell mono className="font-bold text-rose-700">
                        {p.bloodGroup}
                      </TableCell>
                      <TableCell className="text-[11px] text-emerald-800 font-bold">
                        {p.medicalClearance}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-600">
                        {p.survivalTraining}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === 'Deployed' ? 'operational' : 'info'}
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
            )}
          </div>
        )}

        {/* TAB: INDIVIDUAL PACKING & LOAD PLANNER */}
        {activeTab === 'packing' && (
          <PackingAndLoadPlanner
            expeditionId={expedition.id}
            expeditionName={expedition.name}
            station={expedition.station}
          />
        )}

        {/* TAB: CARGO */}
        {activeTab === 'cargo' && (

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Associated Cargo & TEU Manifests
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sea freight containers, air drops, and station consignments supporting this expedition
                </p>
              </div>
              <Badge variant="neutral" size="sm" mono>
                {expedition.cargo.length} Manifests Tracked
              </Badge>
            </div>

            {expedition.cargo.length === 0 ? (
              <EmptyState
                icon={<Package className="w-6 h-6 text-slate-400" />}
                title="No Cargo Assigned"
                description="No active consignments are currently registered under this campaign identifier."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Target ETA</TableHead>
                    <TableHead>HAZMAT</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expedition.cargo.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell mono className="font-bold text-slate-900">
                        {c.id}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{c.description}</TableCell>
                      <TableCell className="text-slate-700 text-xs font-medium">{c.carrier}</TableCell>
                      <TableCell className="text-slate-800 font-semibold">{c.destination}</TableCell>
                      <TableCell mono className="text-slate-700 font-semibold">
                        {c.weight}
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
                        {c.eta}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-600 font-mono">{c.hazmat}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.status === 'Received'
                              ? 'operational'
                              : c.status === 'Delayed'
                              ? 'critical'
                              : c.status === 'In Transit'
                              ? 'info'
                              : 'neutral'
                          }
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
            )}
          </div>
        )}

        {/* TAB: INVENTORY REQUIREMENTS */}
        {activeTab === 'inventory' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Critical Inventory & Strategic Stock Reserves
                </h3>
                <p className="text-[11px] text-slate-500">
                  Consumables, fuel reserves, medical packs, and machinery spares allocated for this mission
                </p>
              </div>
              <Badge variant="warning" size="sm" withDot>
                {expedition.inventory.filter((i) => i.status !== 'Normal').length} Attention Alerts
              </Badge>
            </div>

            {expedition.inventory.length === 0 ? (
              <EmptyState
                icon={<Boxes className="w-6 h-6 text-slate-400" />}
                title="No Inventory Lines Tracked"
                description="Stock quotas for this expedition are managed under general station inventory."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Nomenclature</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Minimum Stock</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Burn Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expedition.inventory.map((inv, idx) => (
                    <TableRow key={idx} className={inv.status === 'Critical' ? 'bg-rose-50/25' : ''}>
                      <TableCell className="font-bold text-slate-900">{inv.item}</TableCell>
                      <TableCell>
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {inv.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">{inv.station}</TableCell>
                      <TableCell mono className="font-bold text-slate-900">
                        {inv.currentStock}
                      </TableCell>
                      <TableCell mono className="text-slate-500">
                        {inv.minimumStock}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold tabular-nums ${
                              inv.daysRemaining <= 15
                                ? 'text-rose-700'
                                : inv.daysRemaining <= 30
                                ? 'text-amber-800'
                                : 'text-slate-800'
                            }`}
                          >
                            {inv.daysRemaining} Days
                          </span>
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full ${
                                inv.daysRemaining <= 15
                                    ? 'bg-rose-600'
                                    : inv.daysRemaining <= 30
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.min(100, (inv.daysRemaining / 90) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-[11px] font-mono">{inv.burnRate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inv.status === 'Critical'
                              ? 'critical'
                              : inv.status === 'Low Stock'
                              ? 'warning'
                              : 'operational'
                          }
                          size="sm"
                          withDot
                        >
                          {inv.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* TAB: ENVIRONMENTAL CONDITIONS */}
        {activeTab === 'environmental' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Environmental Conditions & Station AWS Sensors
                </h3>
                <p className="text-[11px] text-slate-500">
                  Automated Weather Station (AWS) telemetry from NCPOR sensors at expedition operating locations
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Live In-situ Telemetry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expedition.environmental.map((env, idx) => (
                <Card
                  key={idx}
                  accent={
                    env.alertLevel === 'NOMINAL'
                      ? 'operational'
                      : env.alertLevel === 'WIND ADVISORY'
                      ? 'warning'
                      : 'critical'
                  }
                >
                  <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs text-slate-900 font-bold">{env.station}</CardTitle>
                      <div className="text-[10px] text-slate-500 font-mono">{env.coordinates}</div>
                    </div>
                    <Badge
                      variant={
                        env.alertLevel === 'NOMINAL'
                          ? 'operational'
                          : env.alertLevel === 'WIND ADVISORY'
                          ? 'warning'
                          : 'critical'
                      }
                      size="sm"
                      withDot
                    >
                      {env.alertLevel}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <div className="text-[10px] uppercase text-slate-500 font-bold font-mono">Temperature</div>
                        <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                          {env.temperature}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Chill: {env.windChill}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <div className="text-[10px] uppercase text-slate-500 font-bold font-mono">Wind Speed</div>
                        <div className="text-base font-bold text-amber-800 font-mono mt-0.5">
                          {env.windSpeed}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{env.windDirection}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <div className="text-[10px] uppercase text-slate-500 font-bold font-mono">Pressure</div>
                        <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                          {env.pressure}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{env.pressureTrend}</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-100/70 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center justify-between">
                      <div>
                        <strong>Surface Condition:</strong> {env.condition}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Updated: {env.lastUpdated}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB: INCIDENTS */}
        {activeTab === 'incidents' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Emergency Incidents & Traverse Logs
                </h3>
                <p className="text-[11px] text-slate-500">
                  Active safety events, search and rescue directives, and field hazard notifications
                </p>
              </div>
              <Badge
                variant={expedition.incidents.length > 0 ? 'critical' : 'operational'}
                size="sm"
                withDot
              >
                {expedition.incidents.length} Open Incidents
              </Badge>
            </div>

            {expedition.incidents.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                title="No Active Incidents"
                description="Zero emergency or safety incidents logged for this campaign. All field units report nominal status."
              />
            ) : (
              <div className="space-y-3">
                {expedition.incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className={`border rounded-lg p-4 bg-white shadow-xs ${
                      inc.severity === 'Critical'
                        ? 'border-l-4 border-l-rose-600 border-slate-200'
                        : 'border-l-4 border-l-amber-500 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{inc.id}</span>
                        <Badge variant={inc.severity === 'Critical' ? 'critical' : 'warning'} size="sm" withDot>
                          {inc.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-800">{inc.type}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{inc.time}</span>
                    </div>

                    <div className="mt-2 text-xs text-slate-700 space-y-1">
                      <div>
                        <strong>Location:</strong> {inc.location} · <strong>Assigned Unit:</strong> {inc.assignedUnit}
                      </div>
                      <p className="text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                        {inc.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">
                        Current Response Status: <strong className="text-slate-800">{inc.status}</strong>
                      </span>
                      <Button variant="secondary" size="xs">
                        View Full SAR Log
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Operational Activity & Audit Timeline
                </h3>
                <p className="text-[11px] text-slate-500">
                  Chronological record of campaign milestones, logistics events, and safety communications
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Chronological Order</span>
            </div>

            {expedition.timeline.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-6 h-6 text-slate-400" />}
                title="No Logged Timeline Events"
                description="Timeline events will populate as field dispatches and logistics checkpoints occur."
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-4 divide-y divide-slate-100 shadow-xs">
                {expedition.timeline.map((event) => (
                  <div key={event.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                          event.category === 'Safety'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : event.category === 'Logistics'
                            ? 'bg-[#02457A]/10 text-[#02457A] border-[#02457A]/20'
                            : event.category === 'Scientific'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {event.category}
                      </span>
                    </div>

                    <div className="space-y-0.5 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">{event.title}</span>
                        <span className="text-[11px] font-mono text-slate-500">{event.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">{event.details}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Logged by: <strong className="text-slate-700">{event.officer}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
