import React, { useState, useEffect } from 'react'
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
  Users,
  ArrowLeft,
  MapPin,
  Plane,
  Ship,
  Truck,
  Shield,
  HeartPulse,
  Award,
  Radio,
  Clock,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Navigation,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  PersonnelRecord,
  PersonnelStatus,
} from '@/data/personnelData'
import { fetchPersonnelList } from '@/services/personnelService'

export const PersonnelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Find personnel
  const [personnelList, setPersonnelList] = useState<PersonnelRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await fetchPersonnelList()
        setPersonnelList(data)
      } catch {
        setPersonnelList([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const person = personnelList.find(
    (p) =>
      p.id.toLowerCase() === id?.toLowerCase() ||
      p.id.replace(/-/g, '').toLowerCase() === id?.replace(/-/g, '').toLowerCase()
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/personnel')} iconLeft={<ArrowLeft className="w-4 h-4" />}>
            Back to Personnel Directory
          </Button>
        </div>
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#02457A] animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-700">Loading personnel dossier from database...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/personnel')} iconLeft={<ArrowLeft className="w-4 h-4" />}>
            Back to Personnel Directory
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-400" />}
              title="Personnel File Not Found"
              description={`No operational deployment record for ID "${id}" was found in the NCPOR personnel database.`}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/personnel')}>
                  Return to Personnel Directory
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadgeVariant = (status: PersonnelStatus) => {
    switch (status) {
      case 'At Station':
      case 'Arrived':
        return 'operational'
      case 'In Transit':
        return 'info'
      case 'Transferred':
        return 'neutral'
      case 'Unavailable':
      default:
        return 'critical'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP BREADCRUMB & BACK */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/personnel" className="hover:text-[#02457A] font-medium flex items-center gap-1.5 transition-colors">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Personnel Movement
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-800 font-semibold">{person.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/personnel')}
            iconLeft={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            All Field Personnel
          </Button>
        </div>
      </div>

      {/* 2. HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#001B48] text-white tracking-wider">
                {person.id}
              </span>
              <Badge variant={getStatusBadgeVariant(person.status)} size="sm" withDot>
                {person.status.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500 font-mono font-medium">
                Organization: {person.organization}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{person.name}</h1>
            <p className="text-xs text-slate-700 font-semibold">{person.role}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Station / Sector</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">{person.currentStation}</div>
            </div>
            <div className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">VHF Callsign</div>
              <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">{person.vhfCallsign}</div>
            </div>
          </div>
        </div>

        {/* Quick operational meta strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Expedition Mandate</span>
            <Link
              to={`/expeditions/${person.expeditionId}`}
              className="font-semibold text-[#02457A] hover:text-[#001B48] hover:underline flex items-center gap-1 mt-0.5 truncate"
            >
              {person.expeditionName}
              <ExternalLink className="w-3 h-3 text-[#018ABE] shrink-0" />
            </Link>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Transport Mode</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">{person.transportMode}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Blood Group</span>
            <span className="font-mono font-bold text-rose-700 mt-0.5 block">{person.bloodGroup}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Medical Clearance</span>
            <span className="font-semibold text-emerald-800 mt-0.5 block">{person.medicalClearance}</span>
          </div>
        </div>
      </div>

      {/* 3. VISUAL MOVEMENT TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Active Movement Lifecycle & Transit Stages
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {person.movementTimeline.origin} → {person.movementTimeline.destination}
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            Stage {person.movementTimeline.currentStageIndex + 1} of {person.movementTimeline.stages.length}
          </span>
        </div>

        {/* Visual Timeline Steps */}
        <div className="py-2 px-2 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[580px] relative">
            {/* Connecting background bar */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />

            {person.movementTimeline.stages.map((stage, idx) => {
              const isPast = idx < person.movementTimeline.currentStageIndex
              const isCurrent = idx === person.movementTimeline.currentStageIndex

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all border-2 ${
                      isCurrent
                        ? 'bg-[#02457A] text-white border-[#001B48] ring-4 ring-[#97CADB]/40'
                        : isPast
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-white" /> : idx + 1}
                  </div>

                  <span
                    className={`mt-2 text-xs font-semibold whitespace-nowrap ${
                      isCurrent ? 'text-[#001B48] font-bold' : isPast ? 'text-emerald-800' : 'text-slate-400'
                    }`}
                  >
                    {stage.name}
                  </span>

                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">{stage.time}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. DETAIL GRID: Profile, Location, Emergency Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile & Location & Movement History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile & Assignment Card */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Operational Profile & Deployment Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Service Roster ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{person.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Deputed Organization</span>
                  <span className="font-semibold text-slate-900">{person.organization}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Expedition Designation</span>
                  <span className="font-medium text-slate-900">{person.expeditionName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Carrier / Transit Vehicle</span>
                  <span className="font-semibold text-slate-900">{person.carrierFlight}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Current Coordinates & Module</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">GPS Coordinates</span>
                    <span className="font-mono font-bold text-slate-900">{person.coordinates}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Habitat / Vehicle Berth</span>
                    <span className="font-semibold text-slate-900">{person.moduleLocation}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movement History Table */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Sector Movement & Transit History
              </CardTitle>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                {person.movementHistory.length} Movement Logs
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Movement ID</TableHead>
                    <TableHead>Origin → Destination</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Transport Mode</TableHead>
                    <TableHead>Carrier / Convoy</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {person.movementHistory.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell mono className="font-bold text-[#001B48]">
                        {mov.id}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {mov.origin} → {mov.destination}
                      </TableCell>
                      <TableCell mono className="text-slate-600 text-[11px]">
                        {mov.departureDate} → {mov.arrivalDate}
                      </TableCell>
                      <TableCell className="text-slate-700 text-xs font-medium">{mov.transportMode}</TableCell>
                      <TableCell className="text-slate-600 text-xs font-mono">{mov.carrierVehicle}</TableCell>
                      <TableCell>
                        <Badge
                          variant={mov.status === 'Completed' ? 'operational' : 'info'}
                          size="sm"
                          withDot
                        >
                          {mov.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Emergency Information & Activity */}
        <div className="space-y-6">
          {/* Emergency Information Card */}
          <Card accent="operational">
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                  Emergency & Survival Accreditation
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase text-rose-800 font-bold tracking-wider block">
                    Emergency Blood Group
                  </span>
                  <span className="text-xl font-bold font-mono text-rose-950">{person.bloodGroup}</span>
                </div>
                <HeartPulse className="w-7 h-7 text-rose-600" />
              </div>

              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Medical Accreditation</span>
                  <span className="font-semibold text-slate-900">{person.medicalClearance}</span>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{person.medicalClearanceDate}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Survival Qualification</span>
                  <span className="font-semibold text-slate-900">{person.survivalTraining}</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{person.survivalTrainingSchool}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Station Emergency Role</span>
                  <span className="font-semibold text-slate-800">{person.emergencyRole}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 leading-snug">
                <strong>Safety Notice:</strong> Emergency profile synchronized with Maitri & Bharati Station Hospital databases and Cape Town MRCC rescue registry.
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs Card */}
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider">
                Recent Duty & Health Logs
              </CardTitle>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </CardHeader>
            <CardContent className="p-4 divide-y divide-slate-100 text-xs">
              {person.activityLogs.map((log, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="font-semibold text-slate-900 leading-snug">{log.activity}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="font-medium text-slate-600">{log.location}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
