import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from '@/components/ui'
import {
  Cpu,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Boxes,
  Clock,
  Scale,
  ShieldAlert,
  Info,
  Sliders,
  TrendingDown,
  Truck,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import {
  runWhatIfSimulation,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse,
} from '@/services/expeditionService'

interface WhatIfSimulatorProps {
  expeditionId: string
  expeditionName?: string
  station?: string
}

// Format percent safely avoiding negative zero (-0, -0.0)
const formatSafePct = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0%'
  const clean = Math.abs(val) < 0.001 ? 0 : Math.round(val * 10) / 10
  return `${clean}%`
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  expeditionId,
  expeditionName,
  station,
}) => {
  // Input parameters
  const [durationOverride, setDurationOverride] = useState<string>('')
  const [capacityOverride, setCapacityOverride] = useState<string>('')
  const [delayedDays, setDelayedDays] = useState<number>(0)
  const [stockReductionPct, setStockReductionPct] = useState<number>(0)
  const [activePreset, setActivePreset] = useState<string>('baseline')

  // Simulation execution state
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [simulationResult, setSimulationResult] = useState<WhatIfSimulationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastExecutedAt, setLastExecutedAt] = useState<string | null>(null)

  // Quick preset loader
  const applyPreset = (
    presetKey: string,
    dur: string,
    cap: string,
    delay: number,
    reduction: number
  ) => {
    setActivePreset(presetKey)
    setDurationOverride(dur)
    setCapacityOverride(cap)
    setDelayedDays(delay)
    setStockReductionPct(reduction)
    executeSimulation({
      duration_days_override: dur.trim() ? parseInt(dur, 10) : null,
      cargo_capacity_override_kg: cap.trim() ? parseFloat(cap) : null,
      delayed_resupply_days: delay,
      initial_stock_reduction_pct: reduction,
    })
  }

  const handleReset = () => {
    setActivePreset('baseline')
    setDurationOverride('')
    setCapacityOverride('')
    setDelayedDays(0)
    setStockReductionPct(0)
    setError(null)
    executeSimulation({
      duration_days_override: null,
      cargo_capacity_override_kg: null,
      delayed_resupply_days: 0,
      initial_stock_reduction_pct: 0,
    })
  }

  const executeSimulation = async (customPayload?: WhatIfSimulationRequest) => {
    setIsRunning(true)
    setError(null)

    const payload: WhatIfSimulationRequest = customPayload || {
      duration_days_override: durationOverride.trim() ? parseInt(durationOverride, 10) : null,
      cargo_capacity_override_kg: capacityOverride.trim() ? parseFloat(capacityOverride) : null,
      delayed_resupply_days: Math.max(0, delayedDays),
      initial_stock_reduction_pct: Math.max(0, Math.min(100, stockReductionPct)),
    }

    try {
      const res = await runWhatIfSimulation(expeditionId, payload)
      setSimulationResult(res)
      setLastExecutedAt(new Date().toLocaleTimeString())
    } catch (err: any) {
      setError(err?.message || 'Failed to execute what-if simulation.')
    } finally {
      setIsRunning(false)
    }
  }

  // Load baseline on mount
  useEffect(() => {
    executeSimulation({
      duration_days_override: null,
      cargo_capacity_override_kg: null,
      delayed_resupply_days: 0,
      initial_stock_reduction_pct: 0,
    })
  }, [expeditionId])

  return (
    <div className="space-y-6">
      {/* 1. MISSION-CONTROL HEADER BANNER */}
      <div className="bg-[#001B48] border border-[#02457A] rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shrink-0">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-sky-300 tracking-wider uppercase bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                  WHAT-IF MISSION SIMULATOR
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                  DECISION SUPPORT
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 uppercase">
                  HUMAN-IN-THE-LOOP
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  ZERO DB MUTATION
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Hypothetical Scenario Stress-Test Engine
              </h2>
              <p className="text-xs text-sky-100/80 max-w-3xl leading-relaxed">
                Test hypothetical mission conditions without modifying live operational data. Evaluate impact on mission duration, cargo capacity constraints, resupply delays, and depot inventory depletion.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {lastExecutedAt && (
              <div className="text-right bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-[11px] font-mono">
                <span className="text-slate-400 block uppercase">Last Evaluated</span>
                <span className="text-sky-300 font-bold">{lastExecutedAt}</span>
              </div>
            )}
            <Button
              onClick={() => executeSimulation()}
              disabled={isRunning}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-bold rounded-lg shadow-sm gap-2 shrink-0 cursor-pointer"
            >
              <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Simulating...' : 'Run Simulation'}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. PARAMETERS CONFIGURATION & PRESETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 4 High-Visibility Scenario Controls */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#02457A]" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Scenario Parameters
                </CardTitle>
                <span className="text-[11px] text-slate-500 font-normal">
                  (Adjust any parameter and click Run Simulation)
                </span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleReset}
                disabled={isRunning}
                className="text-xs text-slate-600 hover:text-slate-900 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Controls 1 & 2: Duration & Cargo Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Control 1: Mission Duration */}
                <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#02457A]" />
                      MISSION DURATION
                    </label>
                    <span className="text-[10px] font-mono uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                      Days (&gt;= 1)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Override scheduled mission duration to evaluate extended winter exposure.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 180 (empty for baseline)"
                      value={durationOverride}
                      onChange={(e) => {
                        setActivePreset('custom')
                        setDurationOverride(e.target.value)
                      }}
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#02457A]"
                    />
                    <span className="text-xs font-mono text-slate-500 font-bold">days</span>
                  </div>
                </div>

                {/* Control 2: Cargo Capacity */}
                <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[#02457A]" />
                      CARGO CAPACITY
                    </label>
                    <span className="text-[10px] font-mono uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                      Kilograms (kg)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Maximum allowable cargo payload capacity limit for carrier or airdrop.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min={0}
                      step={50}
                      placeholder="e.g. 2500 (empty for baseline)"
                      value={capacityOverride}
                      onChange={(e) => {
                        setActivePreset('custom')
                        setCapacityOverride(e.target.value)
                      }}
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#02457A]"
                    />
                    <span className="text-xs font-mono text-slate-500 font-bold">kg</span>
                  </div>
                </div>
              </div>

              {/* Control 3: Resupply Delay Slider */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#02457A]" />
                      RESUPPLY DELAY
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Simulate delivery transit delay on approved and in-transit supply items.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#02457A] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 shadow-2xs">
                    +{Math.max(0, delayedDays)} Days Delay
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={delayedDays}
                  onChange={(e) => {
                    setActivePreset('custom')
                    setDelayedDays(parseInt(e.target.value, 10))
                  }}
                  className="w-full accent-[#02457A] cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0 days (On Schedule)</span>
                  <span>+14 days (Sea Ice Delay)</span>
                  <span>+30 days</span>
                  <span>+60 days (Severe Blizzard)</span>
                </div>
              </div>

              {/* Control 4: Starting Stock Reduction Slider */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-amber-600" />
                      STARTING STOCK REDUCTION
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hypothetical percentage reduction applied to initial station inventory.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 shadow-2xs">
                    {stockReductionPct <= 0 ? '0% (Nominal Stock)' : `-${formatSafePct(stockReductionPct)} Available`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={stockReductionPct}
                  onChange={(e) => {
                    setActivePreset('custom')
                    setStockReductionPct(parseFloat(e.target.value))
                  }}
                  className="w-full accent-amber-600 cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0% (Full Stock)</span>
                  <span>25% Depleted</span>
                  <span>50% Depleted</span>
                  <span>100% (Depot Empty)</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Calculations execute 100% in-memory without PostgreSQL writes.
                </span>
                <Button
                  onClick={() => executeSimulation()}
                  disabled={isRunning}
                  className="bg-[#02457A] hover:bg-[#001B48] text-white px-6 py-2.5 text-xs font-bold rounded-lg shadow-sm gap-2 cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  {isRunning ? 'Simulating...' : 'Run Simulation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Quick Stress Presets & Safety Protocol */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-2.5 border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Stress Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {[
                {
                  key: 'baseline',
                  title: 'Baseline State',
                  desc: 'Operational parameters as registered in database',
                  action: () => applyPreset('baseline', '', '', 0, 0),
                },
                {
                  key: 'weather_delay',
                  title: 'Weather Delay (+14 Days)',
                  desc: 'Delayed resupply convoy due to severe sea ice',
                  action: () => applyPreset('weather_delay', '', '', 14, 0),
                },
                {
                  key: 'depleted_stock',
                  title: 'Depleted Stock (-30%)',
                  desc: 'Station inventory reduced by winter usage',
                  action: () => applyPreset('depleted_stock', '', '', 0, 30),
                },
                {
                  key: 'extended_mission',
                  title: 'Extended Mission (+60 Days)',
                  desc: 'Mission prolonged through polar night (+10d delay, -20% stock)',
                  action: () => applyPreset('extended_mission', '180', '', 10, 20),
                },
                {
                  key: 'strict_cargo',
                  title: 'Strict Cargo Cap (3,000 kg)',
                  desc: 'Helicopter/Air-drop strict load restriction',
                  action: () => applyPreset('strict_cargo', '', '3000', 0, 0),
                },
              ].map((p) => {
                const isSelected = activePreset === p.key
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={p.action}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-[#02457A] bg-blue-50/80 shadow-xs ring-1 ring-[#02457A]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#02457A]' : 'text-slate-800 group-hover:text-[#02457A]'}`}>
                        {p.title}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono font-bold text-[#02457A] uppercase bg-blue-100 px-1.5 py-0.2 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {p.desc}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Human-in-the-Loop Protocol Notice */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-200 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sky-300 uppercase tracking-wider text-[11px] font-mono">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Human-in-the-Loop Protocol</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              The simulator provides decision support only. It does not modify operational data or automatically place orders. All results represent ephemeral scenario projections for command staff review.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SIMULATION ERROR NOTIFICATION */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Simulation Computation Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* 4. SIMULATION RESULTS DASHBOARD */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Notice Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900 font-mono">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>SIMULATION ONLY:</strong> No operational data was changed. No automated purchase orders or status transitions were performed.
              </span>
            </div>
            <span className="font-bold text-amber-800">EPHEMERAL RUN</span>
          </div>

          {/* Prominent Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Readiness Status */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                Simulated Readiness Status
              </div>
              <div className="mt-2 flex items-center gap-2">
                {simulationResult.simulated_state.readiness_status === 'READY' ? (
                  <Badge variant="operational" size="md" withDot>
                    READY FOR MISSION
                  </Badge>
                ) : (
                  <Badge variant="critical" size="md" withDot>
                    NOT READY ({simulationResult.blockers.length} BLOCKERS)
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-mono">
                {simulationResult.blockers.length === 0 ? 'Zero scenario blockers' : `${simulationResult.blockers.length} risk blocker(s) identified`}
              </div>
            </div>

            {/* Metric 2: Mission Duration */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                Mission Duration
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {simulationResult.simulated_state.duration_days}
                </span>
                <span className="text-xs text-slate-500 font-bold font-mono">days</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Database Baseline: {simulationResult.current_state.duration_days} days
              </div>
            </div>

            {/* Metric 3: Cargo Capacity & Utilization */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                Cargo Load &amp; Capacity
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {simulationResult.simulated_state.capacity_utilization_pct}%
                </span>
                <span className="text-xs text-slate-500 font-medium">utilization</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                {simulationResult.simulated_state.planned_load_kg.toLocaleString()} kg / {simulationResult.simulated_state.cargo_capacity_kg.toLocaleString()} kg limit
              </div>
            </div>

            {/* Metric 4: Supply & Delay Risks */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                Supply Risks &amp; Delays
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div>
                  <span className={`text-2xl font-bold font-mono ${simulationResult.simulated_state.inventory_risk_count > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {simulationResult.simulated_state.inventory_risk_count}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono font-bold">Shortages</span>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className={`text-2xl font-bold font-mono ${simulationResult.simulated_state.delayed_resupply_count > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {simulationResult.simulated_state.delayed_resupply_count}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono font-bold">Delayed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary Strip */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-slate-900 uppercase tracking-wider font-mono">
              <Info className="w-4 h-4 text-[#02457A]" />
              Hypothetical Scenario Impact Summary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {simulationResult.impact_summary.map((summary, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono flex items-center gap-2 shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-[#02457A] shrink-0" />
                  <span>{summary}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Blockers (if any) */}
          {simulationResult.blockers.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Simulation Blockers Detected ({simulationResult.blockers.length})</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-xs text-rose-800 font-medium">
                {simulationResult.blockers.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Side by Side Comparison: Current State vs Simulated Outcome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-2.5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-slate-800 uppercase font-mono">
                    CURRENT OPERATIONAL STATE
                  </CardTitle>
                  <span className="text-[10px] font-mono uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                    DATABASE BASELINE
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Mission Window Duration</span>
                  <span className="font-bold text-slate-800">{simulationResult.current_state.duration_days} days</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Planned Cargo Weight</span>
                  <span className="font-bold text-slate-800">{simulationResult.current_state.planned_load_kg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Max Carrier Capacity</span>
                  <span className="font-bold text-slate-800">{simulationResult.current_state.cargo_capacity_kg.toLocaleString()} kg</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sky-200 shadow-xs bg-sky-50/10">
              <CardHeader className="pb-2.5 border-b border-sky-100 bg-sky-50/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-[#02457A] uppercase font-mono">
                    SIMULATED OUTCOME
                  </CardTitle>
                  <span className="text-[10px] font-mono uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold border border-sky-200">
                    EPHEMERAL RESULT
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Simulated Duration</span>
                  <span className="font-bold text-slate-900">{simulationResult.simulated_state.duration_days} days</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Simulated Capacity Limit</span>
                  <span className="font-bold text-slate-900">{simulationResult.simulated_state.cargo_capacity_kg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Remaining Free Payload</span>
                  <span className="font-bold text-emerald-700">{simulationResult.simulated_state.remaining_capacity_kg.toLocaleString()} kg</span>
                </div>
                {simulationResult.simulated_state.over_capacity_kg > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-rose-100 text-rose-700 font-bold bg-rose-50/60 px-2 rounded">
                    <span>Capacity Overage</span>
                    <span>+{simulationResult.simulated_state.over_capacity_kg.toLocaleString()} kg (OVERLOAD)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables: High-Contrast Inventory Risks & Delayed Resupply */}
          <div className="space-y-4">
            {/* Inventory Simulation Table */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#02457A]" />
                  <CardTitle className="text-xs font-bold text-slate-900 uppercase font-mono">
                    Station Inventory Stockpile Simulation ({simulationResult.inventory.length} items evaluated)
                  </CardTitle>
                </div>
                <span className="text-[11px] font-mono text-slate-600 font-bold">
                  Stock Reduction Applied: {simulationResult.scenario.initial_stock_reduction_pct <= 0 ? '0% (Nominal)' : `-${formatSafePct(simulationResult.scenario.initial_stock_reduction_pct)}`}
                </span>
              </CardHeader>
              <CardContent className="pt-0 p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3 text-right">Current Stock</th>
                      <th className="px-4 py-3 text-right">Simulated Stock</th>
                      <th className="px-4 py-3 text-right">Minimum Safe Stock</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {simulationResult.inventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-500 font-sans">
                          No station inventory records found.
                        </td>
                      </tr>
                    ) : (
                      simulationResult.inventory.map((inv) => (
                        <tr
                          key={inv.inventory_id}
                          className={inv.shortage ? 'bg-rose-50/70 hover:bg-rose-50' : 'hover:bg-slate-50'}
                        >
                          <td className="px-4 py-3 font-sans font-bold text-slate-900">
                            {inv.item_name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{inv.category}</td>
                          <td className="px-4 py-3 text-slate-600 text-[11px]">{inv.location}</td>
                          <td className="px-4 py-3 text-right text-slate-800 font-semibold">
                            {inv.current_stock} {inv.unit}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${inv.shortage ? 'text-rose-700' : 'text-slate-900'}`}>
                            {inv.simulated_stock} {inv.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 font-semibold">
                            {inv.minimum_stock} {inv.unit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {inv.shortage ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                SHORTAGE RISK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                SAFE
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Delayed Resupply Items (if any affected) */}
            {simulationResult.delayed_resupply.length > 0 && (
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <CardTitle className="text-xs font-bold text-slate-900 uppercase font-mono">
                      Hypothetically Delayed Resupply Deliveries (+{simulationResult.scenario.delayed_resupply_days} Days)
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-0 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                      <tr>
                        <th className="px-4 py-3">Item Name</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Resupply Quantity</th>
                        <th className="px-4 py-3">Original Target ETA</th>
                        <th className="px-4 py-3 text-right">Simulated Added Delay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {simulationResult.delayed_resupply.map((item) => (
                        <tr key={item.resupply_item_id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-sans font-bold text-slate-900">
                            {item.item_name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 font-bold">
                            {item.resupply_quantity}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.original_eta || 'Unscheduled'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-800">
                            +{item.simulated_delay_days} days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default WhatIfSimulator
