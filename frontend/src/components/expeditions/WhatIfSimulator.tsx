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

  // Simulation execution state
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [simulationResult, setSimulationResult] = useState<WhatIfSimulationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastExecutedAt, setLastExecutedAt] = useState<string | null>(null)

  // Quick preset loader
  const applyPreset = (
    dur: string,
    cap: string,
    delay: number,
    reduction: number
  ) => {
    setDurationOverride(dur)
    setCapacityOverride(cap)
    setDelayedDays(delay)
    setStockReductionPct(reduction)
  }

  const handleReset = () => {
    setDurationOverride('')
    setCapacityOverride('')
    setDelayedDays(0)
    setStockReductionPct(0)
    setSimulationResult(null)
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
      delayed_resupply_days: delayedDays,
      initial_stock_reduction_pct: stockReductionPct,
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
      {/* 1. DISCLAIMER & SYSTEM BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0 mt-0.5">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-sky-400 tracking-wider uppercase">
                Phase 3.6 Evaluation Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Simulation Only
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Zero DB Mutation
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100 tracking-tight mt-1">
              What-If Mission Scenario Evaluator
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-0.5 leading-relaxed">
              Stress-test hypothetical perturbations in mission duration, payload capacity limits, resupply transit delays, and starting stockpile reductions.
              Results are strictly ephemeral with <strong>no operational data modified</strong> and <strong>no automated orders dispatched</strong>.
            </p>
          </div>
        </div>

        {lastExecutedAt && (
          <div className="shrink-0 text-right bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-2 text-[11px] font-mono">
            <span className="text-slate-400 block uppercase">Last Computed</span>
            <span className="text-sky-300 font-bold">{lastExecutedAt}</span>
          </div>
        )}
      </div>

      {/* 2. PARAMETERS CONFIGURATION & PRESETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Parameter Controls */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#02457A]" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Hypothetical Scenario Controls
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isRunning}
                className="text-xs text-slate-500 hover:text-slate-900 h-8 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Controls
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Parameter 1: Mission Duration Override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Mission Duration Override
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-normal">
                      Days (&gt;= 1)
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Leave empty for base window"
                    value={durationOverride}
                    onChange={(e) => setDurationOverride(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#02457A]"
                  />
                  <p className="text-[10px] text-slate-500">
                    Overrides scheduled campaign duration to evaluate prolonged field exposure.
                  </p>
                </div>

                {/* Parameter 2: Cargo Capacity Override */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      Cargo Capacity Override
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-normal">
                      Kilograms (kg)
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    placeholder="Leave empty for current vessel/plan"
                    value={capacityOverride}
                    onChange={(e) => setCapacityOverride(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#02457A]"
                  />
                  <p className="text-[10px] text-slate-500">
                    Restricts or expands maximum allowable cargo payload weight.
                  </p>
                </div>
              </div>

              {/* Parameter 3: Resupply Delay Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    Resupply Delay
                  </label>
                  <span className="font-mono text-xs font-bold text-[#02457A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    +{delayedDays} Days
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={delayedDays}
                  onChange={(e) => setDelayedDays(parseInt(e.target.value, 10))}
                  className="w-full accent-[#02457A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0 days (On Schedule)</span>
                  <span>14 days</span>
                  <span>30 days</span>
                  <span>60 days (Severe Blizzards)</span>
                </div>
              </div>

              {/* Parameter 4: Initial Stock Reduction Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                    Starting Stockpile Reduction
                  </label>
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    -{stockReductionPct}% Available
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={stockReductionPct}
                  onChange={(e) => setStockReductionPct(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0% (Full Stock)</span>
                  <span>25% Depletion</span>
                  <span>50% Depletion</span>
                  <span>100% (Empty Depot)</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  onClick={() => executeSimulation()}
                  disabled={isRunning}
                  className="bg-[#02457A] hover:bg-[#001B48] text-white px-5 py-2 text-xs font-bold rounded-md shadow-xs gap-2"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  {isRunning ? 'Calculating Simulation...' : 'Run Simulation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Scenario Presets & Safety Principles */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Stress Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {[
                {
                  title: 'Baseline State',
                  desc: 'Operational parameters as registered in database',
                  action: () => applyPreset('', '', 0, 0),
                },
                {
                  title: 'Weather Delay (+14 Days)',
                  desc: 'Delayed resupply convoy due to severe sea ice',
                  action: () => applyPreset('', '', 14, 0),
                },
                {
                  title: 'Depleted Stock (-30%)',
                  desc: 'Station inventory reduced by winter usage',
                  action: () => applyPreset('', '', 0, 30),
                },
                {
                  title: 'Extended Mission (+60 Days)',
                  desc: 'Mission prolonged through polar night',
                  action: () => applyPreset('180', '', 10, 20),
                },
                {
                  title: 'Strict Cargo Cap (3,000 kg)',
                  desc: 'Helicopter/Air-drop strict load restriction',
                  action: () => applyPreset('', '3000', 0, 0),
                },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={p.action}
                  className="w-full text-left p-2.5 rounded border border-slate-200 hover:border-[#02457A] hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#02457A]">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {p.desc}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Safety Notice Card */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#02457A]">
              <Info className="w-4 h-4" />
              <span>Human-in-the-Loop Protocol</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              This evaluator provides decision support for expedition commanders. It does not replace the 7-pillar Readiness Audit and never automatically dispatches purchase requisitions or re-routes vessels.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SIMULATION ERROR NOTIFICATION */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Simulation Computation Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* 4. SIMULATION RESULTS */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Executive Overview Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Readiness Status */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
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
                    NOT READY (BLOCKERS DETECTED)
                  </Badge>
                )}
              </div>

              <div className="text-[11px] text-slate-500 mt-2 font-mono">
                {simulationResult.blockers.length} scenario blocker(s) identified
              </div>
            </div>

            {/* 2. Mission Duration */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                Mission Duration
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {simulationResult.simulated_state.duration_days}
                </span>
                <span className="text-xs text-slate-500 font-medium">days</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Baseline: {simulationResult.current_state.duration_days} days
              </div>
            </div>

            {/* 3. Cargo Payload & Utilization */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
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
                {simulationResult.simulated_state.planned_load_kg.toLocaleString()} kg / {simulationResult.simulated_state.cargo_capacity_kg.toLocaleString()} kg
              </div>
            </div>

            {/* 4. Risk Counters */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                Supply Risks
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div>
                  <span className={`text-xl font-bold font-mono ${simulationResult.simulated_state.inventory_risk_count > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {simulationResult.simulated_state.inventory_risk_count}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Inventory Shortages</span>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className={`text-xl font-bold font-mono ${simulationResult.simulated_state.delayed_resupply_count > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {simulationResult.simulated_state.delayed_resupply_count}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Delayed Shipments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary Strip */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-slate-900 uppercase tracking-wider font-mono">
              <Info className="w-3.5 h-3.5 text-[#02457A]" />
              Hypothetical Scenario Impact Summary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {simulationResult.impact_summary.map((summary, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-white border border-slate-200 rounded p-2 text-slate-700 font-mono flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#02457A]" />
                  <span>{summary}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Blockers (if any) */}
          {simulationResult.blockers.length > 0 && (
            <div className="p-4 bg-red-50/80 border border-red-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-900 uppercase font-mono">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Simulation Blockers Detected ({simulationResult.blockers.length})</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-xs text-red-800">
                {simulationResult.blockers.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Side by Side Comparison: Current State vs Simulated State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-bold text-slate-700 uppercase font-mono">
                  Current Operational State (Database Baseline)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Mission Window Duration</span>
                  <span className="font-bold text-slate-800">{simulationResult.current_state.duration_days} days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Planned Cargo Weight</span>
                  <span className="font-bold text-slate-800">{simulationResult.current_state.planned_load_kg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Max Cargo Capacity</span>
                  <span className="font-bold text-slate-800">{simulationResult.current_state.cargo_capacity_kg.toLocaleString()} kg</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-2 border-b border-slate-100 bg-blue-50/30">
                <CardTitle className="text-xs font-bold text-[#02457A] uppercase font-mono flex items-center justify-between">
                  <span>Simulated Outcome</span>
                  <span className="text-[10px] font-normal text-slate-500">Ephemeral</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Simulated Duration</span>
                  <span className="font-bold text-slate-900">{simulationResult.simulated_state.duration_days} days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Simulated Capacity Limit</span>
                  <span className="font-bold text-slate-900">{simulationResult.simulated_state.cargo_capacity_kg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Remaining Free Payload</span>
                  <span className="font-bold text-emerald-700">{simulationResult.simulated_state.remaining_capacity_kg.toLocaleString()} kg</span>
                </div>
                {simulationResult.simulated_state.over_capacity_kg > 0 && (
                  <div className="flex justify-between py-1 border-b border-red-100 text-red-700 font-bold">
                    <span>Capacity Overage</span>
                    <span>+{simulationResult.simulated_state.over_capacity_kg.toLocaleString()} kg (OVERLOAD)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables: Inventory Risks & Delayed Resupply */}
          <div className="space-y-4">
            {/* Inventory Simulation Table */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#02457A]" />
                  <CardTitle className="text-xs font-bold text-slate-900 uppercase font-mono">
                    Station Inventory Stockpile Simulation ({simulationResult.inventory.length} items evaluated)
                  </CardTitle>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Stock Reduction Applied: -{simulationResult.scenario.initial_stock_reduction_pct}%
                </span>
              </CardHeader>
              <CardContent className="pt-0 p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Item Name</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Location</th>
                      <th className="px-4 py-2.5 text-right">Current Stock</th>
                      <th className="px-4 py-2.5 text-right">Simulated Stock</th>
                      <th className="px-4 py-2.5 text-right">Minimum Safe Stock</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {simulationResult.inventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                          No station inventory records found.
                        </td>
                      </tr>
                    ) : (
                      simulationResult.inventory.map((inv) => (
                        <tr
                          key={inv.inventory_id}
                          className={inv.shortage ? 'bg-red-50/50' : 'hover:bg-slate-50'}
                        >
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-800">
                            {inv.item_name}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{inv.category}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-[11px]">{inv.location}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700">
                            {inv.current_stock} {inv.unit}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-bold ${inv.shortage ? 'text-red-700' : 'text-slate-900'}`}>
                            {inv.simulated_stock} {inv.unit}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-500">
                            {inv.minimum_stock} {inv.unit}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {inv.shortage ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 text-red-600" />
                                SHORTAGE RISK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <CardTitle className="text-xs font-bold text-slate-900 uppercase font-mono">
                      Hypothetically Delayed Resupply Deliveries (+{simulationResult.scenario.delayed_resupply_days} Days)
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-0 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                      <tr>
                        <th className="px-4 py-2.5">Item Name</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Resupply Quantity</th>
                        <th className="px-4 py-2.5">Original Target ETA</th>
                        <th className="px-4 py-2.5 text-right">Simulated Added Delay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {simulationResult.delayed_resupply.map((item) => (
                        <tr key={item.resupply_item_id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-800">
                            {item.item_name}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-800 font-bold">
                            {item.resupply_quantity}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {item.original_eta || 'Unscheduled'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">
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
