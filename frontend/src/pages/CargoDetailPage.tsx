import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Modal,
  EmptyState,
} from '@/components/ui'
import {
  Package,
  ArrowLeft,
  Ship,
  Plane,
  Truck,
  Anchor,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Shield,
  Activity,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Loader2,
  Database,
  AlertCircle,
} from 'lucide-react'
import {
  INITIAL_CARGO_DATA,
  CargoRecord,
  CargoStatus,
  TIMELINE_STAGES,
} from '@/data/cargoData'
import { fetchCargoList, updateCargoStatus } from '@/services/cargoService'


export const CargoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Master cargo list
  const [cargoList, setCargoList] = useState<CargoRecord[]>(INITIAL_CARGO_DATA)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchCargoList()
      .then((data) => {
        if (data && data.length > 0) {
          setCargoList(data)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const cargo = cargoList.find((c) => c.id.toLowerCase() === id?.toLowerCase())

  // Status update modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<CargoStatus>(cargo?.status || 'In Transit')
  const [updateReason, setUpdateReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  if (!cargo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/cargo')} iconLeft={<ArrowLeft className="w-4 h-4" />}>
            Back to Cargo Directory
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Package className="w-8 h-8 text-slate-400" />}
              title="Consignment Record Not Found"
              description={`No cargo consignment with identifier "${id}" exists in the polar logistics database.`}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/cargo')}>
                  Return to Cargo Directory
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle status update with PostgreSQL persistence
  const handleStatusUpdate = async () => {
    setIsUpdating(true)
    setUpdateError(null)

    try {
      // Call PATCH /cargo/{cargo_id}/status to persist in PostgreSQL
      const updatedCargo = await updateCargoStatus(cargo.id, newStatus)

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
      const newTimeline = [
        {
          timestamp: nowStr,
          action: `Status Updated to: ${newStatus}`,
          officer: 'Logistics Operations Officer',
          details: updateReason.trim() || `Status progression updated and saved to PostgreSQL.`,
        },
        ...cargo.timeline,
      ]

      let actualArr = cargo.actualArrival
      if (newStatus === 'Received' && !actualArr) {
        actualArr = nowStr
      }

      const mergedCargo: CargoRecord = {
        ...updatedCargo,
        actualArrival: actualArr,
        timeline: newTimeline,
      }

      setCargoList((prev) =>
        prev.map((c) => (c.id === cargo.id ? mergedCargo : c))
      )
      setIsUpdateModalOpen(false)
      setUpdateReason('')
    } catch (err: any) {
      console.error('Failed to update cargo status in PostgreSQL:', err)
      setUpdateError(err?.message || 'Failed to persist status change to PostgreSQL.')
    } finally {
      setIsUpdating(false)
    }
  }


  // Map timeline progression index
  const getStageIndex = (status: CargoStatus) => {
    if (status === 'Delayed') {
      if (cargo.previousStatus) {
        return TIMELINE_STAGES.indexOf(cargo.previousStatus as any)
      }
      return 3 // Default in transit
    }
    return TIMELINE_STAGES.indexOf(status as any)
  }

  const currentStageIndex = getStageIndex(cargo.status)

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
      {/* 1. TOP BREADCRUMB & BACK */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/cargo" className="hover:text-[#02457A] font-medium flex items-center gap-1.5 transition-colors">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            Cargo Logistics
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-800 font-semibold">{cargo.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/cargo')}
            iconLeft={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            All Consignments
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setNewStatus(cargo.status)
              setUpdateError(null)
              setIsUpdateModalOpen(true)
            }}
          >
            Update Cargo Status
          </Button>
        </div>
      </div>

      {/* 2. HEADER DOSSIER */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#001B48] text-white tracking-wider">
                {cargo.id}
              </span>
              <Badge variant={getStatusBadgeVariant(cargo.status)} size="sm" withDot>
                {cargo.status.toUpperCase()}
              </Badge>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Database className="w-3 h-3" /> PostgreSQL Backed
              </span>

              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  cargo.priority === 'Critical'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : cargo.priority === 'High'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                Priority: {cargo.priority}
              </span>
              <span className="text-xs text-slate-500 font-mono">Category: {cargo.category}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{cargo.description}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="text-slate-500 font-medium">Expedition Mandate:</span>
              <Link
                to={`/expeditions/${cargo.expeditionId}`}
                className="font-semibold text-[#02457A] hover:text-[#001B48] hover:underline inline-flex items-center gap-1"
              >
                {cargo.expeditionName} ({cargo.expeditionId})
                <ExternalLink className="w-3 h-3 text-[#018ABE]" />
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gross Weight</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">{cargo.weight}</div>
            </div>
            <div className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Carrier</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5 truncate max-w-[150px]">
                {cargo.carrier}
              </div>
            </div>
          </div>
        </div>

        {/* Delayed Alert Warning Banner if Delayed */}
        {cargo.status === 'Delayed' && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-950">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-rose-900">Logistics Delay Flagged Active</div>
              <p className="text-rose-800 leading-snug">
                This consignment has encountered transit or customs delays. Priority expediting protocol has been notified to Cape Town and Punta Arenas dispatch coordinators.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. VISUAL SHIPMENT TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Shipment Logistics Lifecycle
          </h2>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            Stage {Math.max(1, currentStageIndex + 1)} of 6
          </span>
        </div>

        {/* Visual Timeline Steps */}
        <div className="py-2 px-2 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[620px] relative">
            {/* Connecting background bar */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />

            {TIMELINE_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex
              const isCurrent = idx === currentStageIndex
              const isDelayedStage = cargo.status === 'Delayed' && isCurrent

              return (
                <div key={stage} className="relative z-10 flex flex-col items-center group">
                  {/* Step indicator circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all border-2 ${
                      isDelayedStage
                        ? 'bg-rose-600 text-white border-rose-300 ring-4 ring-rose-100'
                        : isCurrent
                        ? 'bg-[#02457A] text-white border-[#001B48] ring-4 ring-[#97CADB]/40'
                        : isPast
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isDelayedStage ? (
                      <AlertTriangle className="w-4 h-4 text-white" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`mt-2 text-xs font-semibold whitespace-nowrap ${
                      isDelayedStage
                        ? 'text-rose-700 font-bold'
                        : isCurrent
                        ? 'text-[#001B48] font-bold'
                        : isPast
                        ? 'text-emerald-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage}
                  </span>

                  {/* Status tag */}
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {isDelayedStage
                      ? 'DELAYED'
                      : isCurrent
                      ? 'IN PROGRESS'
                      : isPast
                      ? 'COMPLETED'
                      : 'PENDING'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. DETAIL GRID: Cargo Info, Transport Info, Arrival Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cargo & Transport & Expedition Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cargo Information Card */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Cargo Specifications & Hazards
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Cargo Identification Code</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{cargo.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Consignment Category</span>
                  <span className="font-semibold text-slate-900">{cargo.category}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Total Freight Weight</span>
                  <span className="font-mono font-semibold text-slate-900">{cargo.weight}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">HAZMAT Declaration</span>
                  <span className="font-mono font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                    {cargo.hazmat}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#1B2529]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#A7B2B8] block mb-1">Operational Notes</span>
                <p className="text-slate-700 dark:text-[#CBD5DB] leading-relaxed bg-slate-50/80 dark:bg-[#0A0E10] p-3 rounded-lg border border-slate-200 dark:border-[#263238]">
                  {cargo.notes}
                </p>
              </div>

              {/* Logistics Risk Metric */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#1B2529] flex items-center justify-between p-3 bg-slate-50/80 dark:bg-[#0A0E10] rounded-lg border border-slate-200 dark:border-[#263238]">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-[#018ABE] dark:text-[#28B6FF]" />
                  <span className="text-slate-700 dark:text-[#CBD5DB] font-medium text-xs">Logistics Risk Metric:</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-[#F5F7F8] text-xs">
                  {cargo.riskScorePlaceholder}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Transport & Staging Information Card */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Transport & Routing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Transport Mode</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 mt-0.5">
                    {cargo.transportMode === 'Polar Vessel' ? (
                      <Ship className="w-4 h-4 text-[#02457A]" />
                    ) : (
                      <Plane className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>{cargo.transportMode}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Assigned Carrier / Vessel</span>
                  <span className="font-semibold text-slate-900">{cargo.carrier}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Port of Origin / Staging</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cargo.origin}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Destination Base / Berth</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 mt-0.5">
                    <Anchor className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{cargo.destination}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Arrival Information & Action */}
        <div className="space-y-6">
          {/* Arrival Information Card */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Arrival & Dispatch Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Target Expected Arrival (ETA)</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  {cargo.expectedArrival}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Actual Arrival / Receipt</span>
                <div className="font-mono font-semibold text-slate-800 mt-0.5">
                  {cargo.actualArrival ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {cargo.actualArrival}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Pending Staging Arrival</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Current Status</span>
                <Badge variant={getStatusBadgeVariant(cargo.status)} size="sm" withDot>
                  {cargo.status.toUpperCase()}
                </Badge>
              </div>

              <div className="pt-3">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setNewStatus(cargo.status)
                    setIsUpdateModalOpen(true)
                  }}
                >
                  Update Lifecycle Status
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expedition Attachment Card */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Expedition Linkage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="font-mono font-bold text-slate-900">{cargo.expeditionId}</div>
              <div className="text-slate-700 font-medium">{cargo.expeditionName}</div>
              <div className="pt-2">
                <Link to={`/expeditions/${cargo.expeditionId}`}>
                  <Button variant="outline" size="xs" className="w-full" iconRight={<ExternalLink className="w-3 h-3" />}>
                    View Expedition Roster
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. AUDIT & LOGISTICS TIMELINE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Logistics Activity & Audit Logs
            </h2>
            <p className="text-[11px] text-slate-500">
              Verified operational timestamps and handling records for consignment {cargo.id}
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">{cargo.timeline.length} Events Logged</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 divide-y divide-slate-100 shadow-xs">
          {cargo.timeline.map((entry, idx) => (
            <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#02457A] mt-1 ring-2 ring-[#97CADB]/40" />
              </div>

              <div className="space-y-0.5 flex-1 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-900">{entry.action}</span>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">{entry.timestamp}</span>
                </div>
                <p className="text-slate-600 leading-snug">{entry.details}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Recorded by: <strong className="text-slate-700 font-semibold">{entry.officer}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UPDATE STATUS MODAL */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Status: ${cargo.id}`}
        description="Advance consignment along the polar logistics pipeline or log transit delays."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStatusUpdate}
              isLoading={isUpdating}
            >
              Confirm Status Update
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {updateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{updateError}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select New Cargo Status
            </label>

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as CargoStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
            >
              <option value="Planned">Planned</option>
              <option value="Packed">Packed</option>
              <option value="Loaded">Loaded</option>
              <option value="In Transit">In Transit</option>
              <option value="Arrived">Arrived</option>
              <option value="Received">Received</option>
              <option value="Delayed">Delayed (Flag Issue)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Operational Reason / Log Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Vessel berthed at ice shelf. Sledge transfer initiated by Logistics team..."
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
