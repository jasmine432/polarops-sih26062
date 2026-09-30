import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from '@/components/ui'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Scale,
  Package,
  Boxes,
  Ship,
  Building2,
  RefreshCw,
  Clock,
  Check,
  ArrowRight,
} from 'lucide-react'
import {
  fetchMissionReadiness,
  MissionReadinessResponse,
  ReadinessPillarResult,
} from '@/services/expeditionService'

interface MissionReadinessAuditProps {
  expeditionId: string
  expeditionName?: string
  onNavigateTab?: (tabKey: string) => void
}

const PILLAR_ICONS: Record<string, React.ElementType> = {
  PERSONNEL: Users,
  PACKING: Scale,
  CAPACITY: Package,
  INVENTORY: Boxes,
  ASSETS: Ship,
  STATION: Building2,
  SAFETY: ShieldAlert,
}

const PILLAR_ACTION_CONFIG: Record<
  string,
  { label: string; tabKey: string; icon: React.ElementType }
> = {
  PERSONNEL: {
    label: 'Open Personnel Roster',
    tabKey: 'personnel',
    icon: Users,
  },
  PACKING: {
    label: 'Open Packing & Load',
    tabKey: 'packing',
    icon: Scale,
  },
  CAPACITY: {
    label: 'Open Packing & Capacity',
    tabKey: 'packing',
    icon: Package,
  },
  INVENTORY: {
    label: 'Open Inventory Requirements',
    tabKey: 'inventory',
    icon: Boxes,
  },
  ASSETS: {
    label: 'Open Cargo Manifests',
    tabKey: 'cargo',
    icon: Ship,
  },
  STATION: {
    label: 'Open Expedition Overview',
    tabKey: 'overview',
    icon: Building2,
  },
  SAFETY: {
    label: 'Open Incidents & Alerts',
    tabKey: 'incidents',
    icon: ShieldAlert,
  },
}

export const MissionReadinessAudit: React.FC<MissionReadinessAuditProps> = ({
  expeditionId,
  onNavigateTab,
}) => {
  const navigate = useNavigate()
  const [readinessData, setReadinessData] = useState<MissionReadinessResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadReadiness = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchMissionReadiness(expeditionId)
      setReadinessData(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load mission readiness audit data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReadiness()
  }, [expeditionId])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-[#02457A]" />
          <p className="text-sm font-medium text-slate-700">Executing Deterministic 7-Pillar Mission Readiness Audit...</p>
          <p className="text-xs text-slate-400 mt-1">Verifying personnel, packing manifests, carrier capacity, station stock, vessel readiness, and safety telemetry.</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !readinessData) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900">Readiness Audit Failed to Execute</h3>
          <p className="text-xs text-red-700 mt-1 max-w-lg mx-auto">{error || 'Unable to retrieve readiness telemetry.'}</p>
          <Button variant="secondary" size="sm" onClick={loadReadiness} className="mt-4" iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry Audit
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isReady = readinessData.overallStatus === 'READY'

  return (
    <div className="space-y-6">
      {/* 1. OVERALL READINESS VERDICT HERO BANNER */}
      <div
        className={`rounded-xl border p-5 transition-all shadow-sm ${
          isReady
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-900 shadow-emerald-500/5'
            : 'bg-amber-950/20 border-amber-500/40 text-amber-950 shadow-amber-500/5'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isReady
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              }`}
            >
              {isReady ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900/10 dark:bg-white/10">
                  Mission Readiness Engine
                </span>
                <Badge variant={isReady ? 'operational' : 'critical'} size="sm" withDot>
                  {readinessData.overallStatus === 'READY' ? 'LAUNCH CLEARANCE GRANTED' : 'DEPLOYMENT HOLD (NOT READY)'}
                </Badge>
                {readinessData.evaluatedAt && (
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {readinessData.evaluatedAt}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {isReady ? 'Mission Cleared for Polar Deployment' : 'Critical Readiness Blockers Identified'}
              </h2>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                {readinessData.readinessSummary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-2xs font-mono text-xs">
              <div className="text-center px-2 border-r border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{readinessData.totalChecks}</span>
              </div>
              <div className="text-center px-2 border-r border-slate-200 dark:border-slate-800 text-emerald-600">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Passed</span>
                <span className="font-bold text-sm">{readinessData.passedChecks}</span>
              </div>
              <div className="text-center px-2 border-r border-slate-200 dark:border-slate-800 text-amber-600">
                <span className="text-[10px] uppercase font-bold text-amber-500 block">Warn</span>
                <span className="font-bold text-sm">{readinessData.warningChecks}</span>
              </div>
              <div className="text-center px-2 text-rose-600">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">Failed</span>
                <span className="font-bold text-sm">{readinessData.failedChecks}</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="xs"
              onClick={loadReadiness}
              iconLeft={<RefreshCw className="w-3 h-3" />}
            >
              Re-Audit
            </Button>
          </div>
        </div>
      </div>

      {/* 2. SEVEN PILLAR CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {readinessData.pillars.map((pillar: ReadinessPillarResult) => {
          const Icon = PILLAR_ICONS[pillar.category] || ShieldAlert
          const isPassed = pillar.status === 'PASSED'
          const isWarning = pillar.status === 'WARNING'
          const isFailed = pillar.status === 'FAILED'

          const badgeVariant = isPassed ? 'operational' : isWarning ? 'warning' : 'critical'

          return (
            <Card
              key={pillar.category}
              className={`flex flex-col justify-between border transition-all ${
                isFailed
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                  : isWarning
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isFailed
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                        Pillar #{pillar.category}
                      </span>
                      <CardTitle className="text-sm font-bold text-slate-900">
                        {pillar.title}
                      </CardTitle>
                    </div>
                  </div>

                  <Badge variant={badgeVariant} size="sm" withDot>
                    {pillar.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-1 text-xs">
                <p className="text-slate-600 leading-relaxed font-sans">{pillar.summary}</p>

                {/* Critical Blockers */}
                {pillar.blockers.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Actionable Operational Blocker(s):</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 font-medium">
                      {pillar.blockers.map((b, idx) => (
                        <li key={idx} className="leading-snug">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {pillar.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Operational Advisory / Warning:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 font-medium">
                      {pillar.warnings.map((w, idx) => (
                        <li key={idx} className="leading-snug">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Metrics / Breakdown Details */}
                {pillar.details && Object.keys(pillar.details).length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-500">
                    {Object.entries(pillar.details).map(([k, v]) => {
                      if (typeof v === 'object' || v === null) return null
                      return (
                        <span key={k} className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-medium">
                          {k.replace(/_/g, ' ')}: <strong className="text-slate-900">{String(v)}</strong>
                        </span>
                      )
                    })}
                  </div>
                )}

                {isPassed && pillar.blockers.length === 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Deterministic criteria 100% satisfied</span>
                  </div>
                )}

                {/* Actionable Link to Module */}
                {PILLAR_ACTION_CONFIG[pillar.category] && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const config = PILLAR_ACTION_CONFIG[pillar.category]
                        if (onNavigateTab) {
                          onNavigateTab(config.tabKey)
                        } else {
                          navigate(`/expeditions/${expeditionId}?tab=${config.tabKey}`)
                        }
                      }}
                      className={`text-xs font-bold font-mono px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isFailed
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          : isWarning
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <span>{PILLAR_ACTION_CONFIG[pillar.category].label}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                    {isFailed && (
                      <span className="text-[10px] font-mono text-rose-600 font-bold uppercase">
                        Action Required
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
