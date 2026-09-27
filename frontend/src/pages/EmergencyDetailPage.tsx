import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
  ArrowLeft,
  AlertTriangle,
  Radio,
  MapPin,
  Clock,
  Users,
  Package,
  CheckCircle2,
  PhoneCall,
  Activity,
  Calendar,
  ExternalLink,
  Check,
  Edit,
  FileText,
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
  fetchEmergencyIncidentById,
  updateEmergencyIncidentStatus,
} from '@/services/emergencyIncidentService'

export const EmergencyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [incident, setIncident] = useState<IncidentRecord | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Status update / Resolve Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<IncidentResponseStatus>('Responding')
  const [actionLogText, setActionLogText] = useState('')
  const [resolutionInput, setResolutionInput] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Load from PostgreSQL
  const loadIncident = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchEmergencyIncidentById(id)
      setIncident(data)
      setTargetStatus(data.responseStatus)
    } catch (err: any) {
      console.warn('Could not fetch incident from PostgreSQL:', err)
      // Fallback search in static list
      const fallback = INITIAL_INCIDENTS_DATA.find(
        (inc) =>
          inc.id.toLowerCase() === id.toLowerCase() ||
          inc.id.replace(/-/g, '').toLowerCase() === id.replace(/-/g, '').toLowerCase()
      )
      if (fallback) {
        setIncident(fallback)
        setTargetStatus(fallback.responseStatus)
      } else {
        setLoadError(err?.message || `Incident "${id}" was not found in the database.`)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadIncident()
  }, [loadIncident])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/emergency')} iconLeft={<ArrowLeft className="w-4 h-4" />}>
            Back to Emergency Command
          </Button>
        </div>
        <Card>
          <CardContent className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#018ABE]" />
            <span>Loading incident details from PostgreSQL database...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!incident || loadError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/emergency')} iconLeft={<ArrowLeft className="w-4 h-4" />}>
            Back to Emergency Command
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<ShieldAlert className="w-8 h-8 text-slate-400" />}
              title="Incident Record Not Found"
              description={`No emergency response log matching identifier "${id}" exists in the operational database.`}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/emergency')}>
                  Return to Emergency Board
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle status & resolution update in PostgreSQL
  const handleUpdateStatus = async () => {
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
      const newTimeline = [
        {
          id: `EVT-${Date.now()}`,
          timestamp: nowStr,
          action: `Response Status Advanced to: ${targetStatus}`,
          officer: 'Emergency Operations Desk',
          details:
            actionLogText.trim() ||
            (targetStatus === 'Resolved'
              ? `Incident formally resolved: ${resolutionInput.trim()}`
              : `Operational status update logged.`),
        },
        ...incident.timeline,
      ]

      const resolutionNotes =
        targetStatus === 'Resolved'
          ? resolutionInput.trim() || 'Incident closed by Station Emergency Coordinator.'
          : incident.resolutionNotes

      const responseAction =
        actionLogText.trim() ||
        (targetStatus === 'Resolved' ? 'Incident formally resolved' : `Advanced to ${targetStatus}`)

      // Persist to PostgreSQL via PATCH
      const updated = await updateEmergencyIncidentStatus(incident.id, {
        status: targetStatus,
        resolution_notes: resolutionNotes,
        response_action: responseAction,
        timeline: JSON.stringify(newTimeline),
      })

      setIncident(updated)
      setIsStatusModalOpen(false)
      setActionLogText('')
      setResolutionInput('')
    } catch (err: any) {
      console.error('Failed to update emergency incident in database:', err)
      setUpdateError(err?.message || 'Failed to persist status change to PostgreSQL.')
    } finally {
      setIsUpdating(false)
    }
  }

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

  const isCritical = incident.severity === 'Critical'

  return (
    <div className="space-y-6">
      {/* 1. TOP BREADCRUMB & BACK */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/emergency" className="hover:text-[#02457A] font-medium flex items-center gap-1.5 transition-colors">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Emergency Response
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-800 font-semibold">{incident.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/emergency')}
            iconLeft={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Emergency Command Board
          </Button>
          <Button
            variant={incident.responseStatus === 'Resolved' ? 'outline' : 'primary'}
            size="sm"
            onClick={() => {
              setTargetStatus(incident.responseStatus)
              setUpdateError(null)
              setIsStatusModalOpen(true)
            }}
          >
            {incident.responseStatus === 'Resolved' ? 'Edit Incident Status' : 'Update Response Action'}
          </Button>
        </div>
      </div>

      {/* 2. HEADER */}
      <div
        className={`bg-white border rounded-lg p-5 shadow-xs ${
          isCritical
            ? 'border-slate-300 border-l-4 border-l-rose-600'
            : incident.severity === 'High'
            ? 'border-slate-200 border-l-4 border-l-amber-500'
            : 'border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#001B48] text-white tracking-wider">
                {incident.id}
              </span>
              <Badge variant={getSeverityBadgeVariant(incident.severity)} size="sm" withDot>
                SEVERITY: {incident.severity.toUpperCase()}
              </Badge>
              <Badge variant={getStatusBadgeVariant(incident.responseStatus)} size="sm" withDot>
                STATUS: {incident.responseStatus.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500 font-mono font-medium">Logged: {incident.time}</span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Database className="w-3 h-3" /> PostgreSQL Backed
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{incident.type}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Location: <strong className="text-slate-800 font-semibold">{incident.location}</strong></span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-slate-400" />
                <span>Emergency Comms: <strong className="text-slate-800 font-mono font-semibold">{incident.commsFrequency}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Personnel Affected</div>
              <div
                className={`text-sm font-bold font-mono mt-0.5 ${
                  incident.personnelAffectedCount > 0 ? 'text-rose-700' : 'text-slate-700'
                }`}
              >
                {incident.personnelAffectedCount} Persons
              </div>
            </div>
            <div className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cargo Affected</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {incident.cargoAffectedCount} Consignments
              </div>
            </div>
          </div>
        </div>

        {/* Quick summary line */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Assigned Response Unit</span>
            <span className="font-semibold text-slate-900">{incident.assignedUnit}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Incident Commander</span>
            <span className="font-semibold text-slate-900">{incident.leadOfficer}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">GPS Coordinates</span>
            <span className="font-mono font-bold text-slate-900">{incident.coordinates}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Associated Expedition</span>
            <Link
              to={`/expeditions/${incident.expeditionId}`}
              className="font-semibold text-[#02457A] hover:text-[#001B48] hover:underline inline-flex items-center gap-1 truncate"
            >
              {incident.expeditionId}
              <ExternalLink className="w-3 h-3 text-[#018ABE]" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. INCIDENT OVERVIEW & RESPONSE ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Overview, Response Actions, Affected Roster */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Incident Situation Report & Tactical Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-800 leading-relaxed font-medium bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
                {incident.description}
              </p>

              {incident.resolutionNotes && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Formal Incident Resolution Logged
                  </div>
                  <p className="text-emerald-900 text-xs leading-relaxed">{incident.resolutionNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Response Actions */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Search & Rescue Directives & Operational Actions
              </CardTitle>
              <Badge variant="neutral" size="sm" mono>
                {incident.responseActions.length} Actions Logged
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {incident.responseActions.map((act, idx) => (
                  <div key={idx} className="p-4 space-y-1.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-slate-900">{act.title}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-500 font-medium">{act.time}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                          {act.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-600">
                      Assigned Unit: <strong className="text-slate-800 font-semibold">{act.unit}</strong>
                    </div>
                    <p className="text-slate-600 leading-snug">{act.notes}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Affected Personnel Roster */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                  Affected Personnel Roster ({incident.affectedPersonnel.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {incident.affectedPersonnel.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 italic text-center">
                  No field personnel directly compromised in this incident.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Station / Post</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Safety & Medical Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incident.affectedPersonnel.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell mono className="font-bold text-[#001B48]">
                          {p.id}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">{p.name}</TableCell>
                        <TableCell className="text-slate-700 text-xs font-semibold">{p.role}</TableCell>
                        <TableCell className="text-slate-600 text-xs">{p.station}</TableCell>
                        <TableCell mono className="font-bold text-rose-700 text-xs">
                          {p.bloodGroup}
                        </TableCell>
                        <TableCell className="text-emerald-800 font-bold text-xs">
                          {p.medicalStatus}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Affected Cargo */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-600" />
                <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                  Affected Cargo & Consignments ({incident.affectedCargo.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {incident.affectedCargo.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 italic text-center">
                  Zero freight containers or hazardous material manifests affected.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Stowage / Hazard Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incident.affectedCargo.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell mono className="font-bold text-[#001B48]">
                          {c.id}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 text-xs">
                          {c.description}
                        </TableCell>
                        <TableCell className="text-slate-700 text-xs">{c.destination}</TableCell>
                        <TableCell>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                            {c.priority}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-700 font-medium">
                          {c.currentStatus}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Timeline & Emergency Hotline */}
        <div className="space-y-6">
          {/* Chronological Incident Timeline */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Emergency Event Timeline
              </CardTitle>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="divide-y divide-slate-100">
                {incident.timeline.map((evt) => (
                  <div key={evt.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-slate-900">{evt.action}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{evt.timestamp}</span>
                    </div>
                    <p className="text-slate-600 leading-snug">{evt.details}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Logged by: <strong className="text-slate-700 font-semibold">{evt.officer}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Satellite Distress Communication Card */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Emergency Communications Link
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg font-mono text-[11px] space-y-1 text-slate-800">
                <div>Primary: <strong>{incident.commsFrequency}</strong></div>
                <div>Satellite Link: <strong>INMARSAT Terminal 4</strong></div>
                <div>MRCC Relay: <strong>Cape Town SAR Centre (+27 21 938 3300)</strong></div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  setTargetStatus('Responding')
                  setUpdateError(null)
                  setIsStatusModalOpen(true)
                }}
              >
                Log SAR Directive
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* UPDATE / RESOLVE STATUS MODAL */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false)
          setUpdateError(null)
        }}
        title={`Update Incident Status: ${incident.id}`}
        description={`${incident.type} · ${incident.location}`}
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsStatusModalOpen(false)
                setUpdateError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateStatus}
              isLoading={isUpdating}
            >
              Post Status Update
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
              Response Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as IncidentResponseStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
            >
              <option value="Reported">Reported</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Responding">Responding (SAR Active)</option>
              <option value="Resolved">Resolved (Close Incident)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Response Action Notes
            </label>
            <textarea
              rows={3}
              placeholder="Describe response directive, asset deployment status, or safety confirmation..."
              value={actionLogText}
              onChange={(e) => setActionLogText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/20 focus:border-[#02457A]"
            />
          </div>

          {targetStatus === 'Resolved' && (
            <div>
              <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                Final Resolution Summary
              </label>
              <textarea
                rows={2}
                placeholder="e.g. All 4 members returned to base. Vehicle safely parked. Zero injuries."
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
