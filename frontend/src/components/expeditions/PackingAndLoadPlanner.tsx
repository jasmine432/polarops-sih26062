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
  Modal,
  EmptyState,
} from '@/components/ui'
import {
  Package,
  Boxes,
  Users,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react'
import { useOperational } from '@/context/OperationalContext'
import {
  PackingItem,
  TeamLoadSummary,
  CargoCapacitySummary,
  PackingPriority,
  PackingStatus,
  fetchTeamLoadSummary,
  fetchCargoCapacity,
  createExpeditionPackingItem,
  updateExpeditionPackingItem,
  deleteExpeditionPackingItem,
  updateCargoCapacity,
} from '@/services/expeditionService'

interface PackingAndLoadPlannerProps {
  expeditionId: string
  expeditionName: string
  station: string
}

export const PackingAndLoadPlanner: React.FC<PackingAndLoadPlannerProps> = ({
  expeditionId,
  expeditionName,
  station,
}) => {
  const { currentRole } = useOperational()
  const canEdit = currentRole === 'ADMIN' || currentRole === 'PHC'

  const [teamLoad, setTeamLoad] = useState<TeamLoadSummary | null>(null)
  const [capacity, setCapacity] = useState<CargoCapacitySummary | null>(null)
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Item Modal State (Create / Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null)
  const [itemFormData, setItemFormData] = useState({
    itemName: '',
    category: 'Protective Clothing',
    quantity: '1',
    unit: 'pcs',
    unitWeightKg: '1.0',
    priority: 'NORMAL' as PackingPriority,
    status: 'PLANNED' as PackingStatus,
    sourceReason: '',
  })
  const [itemFormErrors, setItemFormErrors] = useState<Record<string, string>>({})
  const [isSubmittingItem, setIsSubmittingItem] = useState(false)

  // Capacity Modal State
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false)
  const [capacityFormData, setCapacityFormData] = useState({
    maxCapacityKg: '2000',
    allocatedCargoKg: '0',
    notes: '',
  })
  const [capacityFormErrors, setCapacityFormErrors] = useState<Record<string, string>>({})
  const [isSubmittingCapacity, setIsSubmittingCapacity] = useState(false)

  // Load Data from Backend
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [loadRes, capRes] = await Promise.all([
        fetchTeamLoadSummary(expeditionId),
        fetchCargoCapacity(expeditionId),
      ])
      setTeamLoad(loadRes)
      setCapacity(capRes)

      // Set default selected personnel if not set
      if (!selectedPersonnelId && loadRes.personnel_breakdown.length > 0) {
        setSelectedPersonnelId(loadRes.personnel_breakdown[0].personnel_id)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load packing and capacity data.')
    } finally {
      setIsLoading(false)
    }
  }, [expeditionId, selectedPersonnelId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Selected Personnel details & items
  const selectedPersonSummary = useMemo(() => {
    if (!teamLoad) return null
    return (
      teamLoad.personnel_breakdown.find(
        (p) =>
          p.personnel_id.toLowerCase() === selectedPersonnelId.toLowerCase() ||
          p.personnel_id.replace(/-/g, '').toLowerCase() === selectedPersonnelId.replace(/-/g, '').toLowerCase()
      ) || teamLoad.personnel_breakdown[0] || null
    )
  }, [teamLoad, selectedPersonnelId])

  // Open Create Item Modal
  const handleOpenCreateModal = () => {
    if (!selectedPersonSummary) return
    setEditingItem(null)
    setItemFormData({
      itemName: '',
      category: 'Protective Clothing',
      quantity: '1',
      unit: 'pcs',
      unitWeightKg: '1.0',
      priority: 'NORMAL',
      status: 'PLANNED',
      sourceReason: '',
    })
    setItemFormErrors({})
    setIsItemModalOpen(true)
  }

  // Open Edit Item Modal
  const handleOpenEditModal = (item: PackingItem) => {
    setEditingItem(item)
    setItemFormData({
      itemName: item.item_name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit || 'pcs',
      unitWeightKg: item.unit_weight_kg.toString(),
      priority: item.priority,
      status: item.status,
      sourceReason: item.source_reason || '',
    })
    setItemFormErrors({})
    setIsItemModalOpen(true)
  }

  // Validate Item Form
  const validateItemForm = () => {
    const errors: Record<string, string> = {}
    if (!itemFormData.itemName.trim()) {
      errors.itemName = 'Item name is required.'
    }
    const qty = parseInt(itemFormData.quantity, 10)
    if (isNaN(qty) || qty < 0) {
      errors.quantity = 'Quantity must be 0 or greater.'
    }
    const wt = parseFloat(itemFormData.unitWeightKg)
    if (isNaN(wt) || wt < 0) {
      errors.unitWeightKg = 'Unit weight must be 0.0 kg or greater.'
    }
    setItemFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit Item (Create or Update)
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateItemForm() || !selectedPersonSummary) return

    setIsSubmittingItem(true)
    try {
      const qty = parseInt(itemFormData.quantity, 10)
      const wt = parseFloat(itemFormData.unitWeightKg)

      if (editingItem) {
        await updateExpeditionPackingItem(expeditionId, editingItem.id, {
          itemName: itemFormData.itemName.trim(),
          category: itemFormData.category.trim(),
          quantity: qty,
          unit: itemFormData.unit.trim(),
          unitWeightKg: wt,
          priority: itemFormData.priority,
          status: itemFormData.status,
          sourceReason: itemFormData.sourceReason.trim() || undefined,
        })
      } else {
        await createExpeditionPackingItem(expeditionId, {
          personnelId: selectedPersonSummary.personnel_id,
          personnelName: selectedPersonSummary.personnel_name,
          personnelRole: selectedPersonSummary.personnel_role || undefined,
          itemName: itemFormData.itemName.trim(),
          category: itemFormData.category.trim(),
          quantity: qty,
          unit: itemFormData.unit.trim(),
          unitWeightKg: wt,
          priority: itemFormData.priority,
          status: itemFormData.status,
          sourceReason: itemFormData.sourceReason.trim() || undefined,
        })
      }
      setIsItemModalOpen(false)
      await loadData()
    } catch (err: any) {
      setItemFormErrors({ submit: err?.message || 'Failed to save packing item.' })
    } finally {
      setIsSubmittingItem(false)
    }
  }

  // Delete Item
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to remove this packing item?')) return
    try {
      await deleteExpeditionPackingItem(expeditionId, itemId)
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete packing item.')
    }
  }

  // Open Capacity Modal
  const handleOpenCapacityModal = () => {
    if (!capacity) return
    setCapacityFormData({
      maxCapacityKg: capacity.maximum_capacity_kg.toString(),
      allocatedCargoKg: capacity.allocated_cargo_weight_kg.toString(),
      notes: capacity.notes || '',
    })
    setCapacityFormErrors({})
    setIsCapacityModalOpen(true)
  }

  // Submit Capacity Modal
  const handleSubmitCapacity = async (e: React.FormEvent) => {
    e.preventDefault()
    const maxCap = parseFloat(capacityFormData.maxCapacityKg)
    const alloc = parseFloat(capacityFormData.allocatedCargoKg)
    const errors: Record<string, string> = {}

    if (isNaN(maxCap) || maxCap <= 0) {
      errors.maxCapacityKg = 'Maximum capacity must be greater than 0 kg.'
    }
    if (isNaN(alloc) || alloc < 0) {
      errors.allocatedCargoKg = 'Allocated cargo weight cannot be negative.'
    }
    if (Object.keys(errors).length > 0) {
      setCapacityFormErrors(errors)
      return
    }

    setIsSubmittingCapacity(true)
    try {
      await updateCargoCapacity(expeditionId, {
        maxCapacityKg: maxCap,
        allocatedCargoKg: alloc,
        notes: capacityFormData.notes.trim() || undefined,
      })
      setIsCapacityModalOpen(false)
      await loadData()
    } catch (err: any) {
      setCapacityFormErrors({ submit: err?.message || 'Failed to update capacity.' })
    } finally {
      setIsSubmittingCapacity(false)
    }
  }

  if (isLoading && !teamLoad) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#02457A] animate-spin" />
        <p className="text-xs font-mono text-slate-600 font-medium">
          Calculating individual packing loads & team cargo margins...
        </p>
      </div>
    )
  }

  if (error && !teamLoad) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="xs" onClick={loadData} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isOverCapacity = capacity?.status === 'OVER_CAPACITY'
  const utilizationPct = capacity?.capacity_utilization_pct || 0

  return (
    <div className="space-y-6">
      {/* 1. TOP CARGO CAPACITY & TEAM LOAD HERO BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Team Personal Load */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Team Personal Load</span>
            <Scale className="w-4 h-4 text-[#02457A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {teamLoad?.total_team_load_kg.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between font-mono">
            <span>{teamLoad?.total_items_count} line items ({teamLoad?.total_quantity} units)</span>
            <span className="text-[#02457A] font-bold">{teamLoad?.personnel_with_packing_lists_count}/{teamLoad?.total_personnel_count} active</span>
          </div>
        </div>

        {/* Card 2: Cargo Capacity Status */}
        <div
          className={`border rounded-lg p-4 shadow-xs transition-colors ${
            isOverCapacity
              ? 'bg-rose-50/80 border-rose-300 text-rose-950'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase font-mono">
            <span className={isOverCapacity ? 'text-rose-800' : 'text-slate-500'}>
              Cargo Capacity Margin
            </span>
            <Badge variant={isOverCapacity ? 'critical' : 'operational'} size="sm" withDot>
              {capacity?.status === 'OVER_CAPACITY' ? 'OVER CAPACITY' : 'WITHIN CAPACITY'}
            </Badge>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono">
                {capacity?.total_planned_weight_kg.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono ml-1">
                / {capacity?.maximum_capacity_kg.toFixed(0)} kg
              </span>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleOpenCapacityModal}
                className="text-[11px] h-6 px-2 text-[#02457A] hover:bg-slate-100"
                iconLeft={<Sliders className="w-3 h-3" />}
              >
                Adjust Limit
              </Button>
            )}
          </div>

          {/* Capacity Progress Bar */}
          <div className="mt-2 space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  isOverCapacity ? 'bg-rose-500' : utilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, utilizationPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono font-semibold">
              <span className={isOverCapacity ? 'text-rose-700' : 'text-slate-600'}>
                {utilizationPct.toFixed(1)}% Capacity Utilized
              </span>
              <span className={isOverCapacity ? 'text-rose-800 font-bold' : 'text-slate-500'}>
                {isOverCapacity
                  ? `Exceeded by +${capacity?.over_capacity_kg.toFixed(1)} kg`
                  : `${capacity?.remaining_capacity_kg.toFixed(1)} kg margin`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Priority Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Cargo Priority Distribution</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-rose-700 block font-mono">Critical</span>
              <span className="text-xs font-bold font-mono text-rose-950">
                {capacity?.critical_weight_kg.toFixed(1)} kg
              </span>
            </div>

            <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-amber-700 block font-mono">High</span>
              <span className="text-xs font-bold font-mono text-amber-950">
                {capacity?.high_weight_kg.toFixed(1)} kg
              </span>
            </div>

            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-600 block font-mono">Normal</span>
              <span className="text-xs font-bold font-mono text-slate-900">
                {capacity?.normal_weight_kg.toFixed(1)} kg
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-2 font-mono text-right">
            Allocated Heavy Cargo: {capacity?.allocated_cargo_weight_kg.toFixed(0)} kg
          </div>
        </div>
      </div>

      {/* 2. MAIN SECTION: INDIVIDUAL PACKING PLAN */}
      <Card>
        <CardHeader className="py-3 px-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
                Individual Packing Requirements
              </CardTitle>
              <Badge variant="neutral" size="sm" mono>
                Deterministic (Qty × Wt)
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-slate-500">
              Assigned gear, survival kits, instruments, and personal payload per expedition member
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Personnel Dropdown Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-slate-500 font-bold hidden sm:inline">Person:</span>
              <select
                value={selectedPersonnelId}
                onChange={(e) => setSelectedPersonnelId(e.target.value)}
                className="bg-white border border-slate-300 text-xs font-semibold rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#02457A] text-slate-900 cursor-pointer shadow-2xs max-w-[240px]"
              >
                {teamLoad?.personnel_breakdown.map((p) => (
                  <option key={p.personnel_id} value={p.personnel_id}>
                    {p.personnel_name} ({p.total_weight_kg.toFixed(1)} kg)
                  </option>
                ))}
              </select>
            </div>

            {canEdit && (
              <Button
                variant="primary"
                size="xs"
                onClick={handleOpenCreateModal}
                iconLeft={<Plus className="w-3.5 h-3.5" />}
              >
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Active Person Info Strip */}
          {selectedPersonSummary && (
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#001B48] text-white flex items-center justify-center font-bold font-mono text-xs shadow-2xs">
                  {selectedPersonSummary.personnel_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedPersonSummary.personnel_name}</span>
                    <span className="font-mono text-[10px] text-slate-500 px-1.5 py-0.2 bg-slate-200 rounded">
                      {selectedPersonSummary.personnel_id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {selectedPersonSummary.personnel_role || 'Expedition Member'} · {selectedPersonSummary.organization || 'NCPOR'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Assigned Items</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {selectedPersonSummary.total_items_count} items ({selectedPersonSummary.total_quantity} pcs)
                  </span>
                </div>

                <div className="pl-3 border-l border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Personal Load</span>
                  <span className="font-mono font-bold text-[#02457A] text-sm">
                    {selectedPersonSummary.total_weight_kg.toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Packing Items Table */}
          {selectedPersonSummary && selectedPersonSummary.items.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60 text-[11px]">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Item & Equipment Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Wt</TableHead>
                    <TableHead className="text-right">Total Wt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source / Reason</TableHead>
                    {canEdit && <TableHead className="w-20 text-center">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPersonSummary.items.map((item, idx) => {
                    const prioVariant =
                      item.priority === 'CRITICAL'
                        ? 'critical'
                        : item.priority === 'HIGH'
                        ? 'warning'
                        : 'neutral'

                    const statusVariant =
                      item.status === 'LOADED' || item.status === 'INSPECTED'
                        ? 'operational'
                        : item.status === 'PACKED'
                        ? 'info'
                        : 'neutral'

                    return (
                      <TableRow key={item.id} className="text-xs hover:bg-slate-50/80">
                        <TableCell className="font-mono text-slate-400 text-[11px]">{idx + 1}</TableCell>
                        <TableCell className="font-bold text-slate-900">{item.item_name}</TableCell>
                        <TableCell className="text-slate-700">{item.category}</TableCell>
                        <TableCell>
                          <Badge variant={prioVariant} size="sm">
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-900">
                          {item.quantity} {item.unit || 'pcs'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-600">
                          {Number(item.unit_weight_kg).toFixed(2)} kg
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-[#02457A]">
                          {Number(item.total_weight_kg).toFixed(2)} kg
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant} size="sm">
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-[11px] max-w-xs truncate">
                          {item.source_reason || '—'}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-[#02457A] transition-colors"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}

                  {/* Summary Row */}
                  <TableRow className="bg-slate-100/70 font-bold border-t-2 border-slate-300">
                    <TableCell colSpan={4} className="text-slate-900 font-mono text-xs uppercase">
                      Total Personal Load ({selectedPersonSummary.personnel_name})
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-900">
                      {selectedPersonSummary.total_quantity} pcs
                    </TableCell>
                    <TableCell className="text-right text-slate-500 font-mono text-[11px]">—</TableCell>
                    <TableCell className="text-right font-mono text-[#02457A] text-sm font-bold">
                      {selectedPersonSummary.total_weight_kg.toFixed(2)} kg
                    </TableCell>
                    <TableCell colSpan={canEdit ? 3 : 2} className="text-right text-[11px] text-slate-500 font-mono font-normal">
                      Deterministic calculation: Quantity × Unit Weight
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-10">
              <EmptyState
                icon={<Package className="w-6 h-6 text-slate-400" />}
                title="No Packing Items Assigned"
                description={`No individual packing items recorded for ${selectedPersonSummary?.personnel_name || 'this member'}.`}
                action={
                  canEdit ? (
                    <Button variant="primary" size="sm" onClick={handleOpenCreateModal} iconLeft={<Plus className="w-3.5 h-3.5" />}>
                      Add First Packing Item
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. TEAM LOAD BREAKDOWN & ROSTER MATRIX */}
      <Card>
        <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
              Team Load Roster & Allocation Matrix
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500">
              Full expedition roster with individual personal payload contributions
            </CardDescription>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">
            Total Team Weight: <strong className="text-[#02457A]">{teamLoad?.total_team_load_kg.toFixed(1)} kg</strong>
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] bg-slate-50/60">
                  <TableHead>Member ID</TableHead>
                  <TableHead>Personnel Name</TableHead>
                  <TableHead>Role & Duty</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Personal Load</TableHead>
                  <TableHead className="text-right">% of Team Load</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamLoad?.personnel_breakdown.map((p) => {
                  const pct = teamLoad.total_team_load_kg > 0 ? (p.total_weight_kg / teamLoad.total_team_load_kg) * 100 : 0
                  const isSelected = p.personnel_id === selectedPersonnelId

                  return (
                    <TableRow
                      key={p.personnel_id}
                      className={`text-xs transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/50 font-semibold' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedPersonnelId(p.personnel_id)}
                    >
                      <TableCell mono className="font-bold text-slate-900 text-[11px]">
                        {p.personnel_id}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">{p.personnel_name}</TableCell>
                      <TableCell className="text-slate-700">{p.personnel_role || 'Member'}</TableCell>
                      <TableCell className="text-slate-600">{p.station || station}</TableCell>
                      <TableCell className="text-right font-mono">{p.total_items_count}</TableCell>
                      <TableCell className="text-right font-mono">{p.total_quantity}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-[#02457A]">
                        {p.total_weight_kg.toFixed(2)} kg
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {pct.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={isSelected ? 'secondary' : 'ghost'}
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPersonnelId(p.personnel_id)
                          }}
                          className="h-6 text-[10px]"
                        >
                          {isSelected ? 'Viewing' : 'Inspect'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 4. MODAL: ADD / EDIT PACKING ITEM */}
      {isItemModalOpen && (
        <Modal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          title={editingItem ? 'Edit Packing Item' : `Add Packing Item for ${selectedPersonSummary?.personnel_name}`}
        >
          <form onSubmit={handleSubmitItem} className="space-y-4 text-xs">
            {itemFormErrors.submit && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
                {itemFormErrors.submit}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Item / Equipment Name *</label>
              <input
                type="text"
                value={itemFormData.itemName}
                onChange={(e) => setItemFormData({ ...itemFormData, itemName: e.target.value })}
                placeholder="e.g. Polar Ice Core Sampling Auger"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#02457A] focus:outline-none"
              />
              {itemFormErrors.itemName && <span className="text-[11px] text-rose-600 mt-0.5 block">{itemFormErrors.itemName}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={itemFormData.category}
                  onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#02457A] focus:outline-none"
                >
                  <option value="Protective Clothing">Protective Clothing</option>
                  <option value="Scientific Instrumentation">Scientific Instrumentation</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Survival Equipment">Survival Equipment</option>
                  <option value="Communications">Communications</option>
                  <option value="Field Navigation">Field Navigation</option>
                  <option value="Field Gear">Field Gear</option>
                  <option value="Machinery Spares">Machinery Spares</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Personal Gear">Personal Gear</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cargo Priority</label>
                <select
                  value={itemFormData.priority}
                  onChange={(e) => setItemFormData({ ...itemFormData, priority: e.target.value as PackingPriority })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#02457A] focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Life Safety & Emergency)</option>
                  <option value="HIGH">HIGH (Mandatory Science & Polar Ops)</option>
                  <option value="NORMAL">NORMAL (Standard Field Gear)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={itemFormData.quantity}
                  onChange={(e) => setItemFormData({ ...itemFormData, quantity: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-[#02457A] focus:outline-none"
                />
                {itemFormErrors.quantity && <span className="text-[11px] text-rose-600 mt-0.5 block">{itemFormErrors.quantity}</span>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={itemFormData.unit}
                  onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                  placeholder="pcs / sets / kit"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#02457A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Wt (kg) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemFormData.unitWeightKg}
                  onChange={(e) => setItemFormData({ ...itemFormData, unitWeightKg: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-[#02457A] focus:outline-none"
                />
                {itemFormErrors.unitWeightKg && <span className="text-[11px] text-rose-600 mt-0.5 block">{itemFormErrors.unitWeightKg}</span>}
              </div>
            </div>

            {/* Calculated Weight Preview */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-slate-700 font-semibold">Total Item Weight:</span>
              <span className="font-bold text-[#02457A] text-sm">
                {(
                  (parseInt(itemFormData.quantity, 10) || 0) *
                  (parseFloat(itemFormData.unitWeightKg) || 0)
                ).toFixed(2)}{' '}
                kg
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Packing Status</label>
                <select
                  value={itemFormData.status}
                  onChange={(e) => setItemFormData({ ...itemFormData, status: e.target.value as PackingStatus })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#02457A] focus:outline-none"
                >
                  <option value="PLANNED">PLANNED (On Packing List)</option>
                  <option value="PACKED">PACKED (In Storage Container)</option>
                  <option value="INSPECTED">INSPECTED (Safety Verified)</option>
                  <option value="LOADED">LOADED (On Vessel / Vehicle)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Source / Operational Reason</label>
                <input
                  type="text"
                  value={itemFormData.sourceReason}
                  onChange={(e) => setItemFormData({ ...itemFormData, sourceReason: e.target.value })}
                  placeholder="e.g. Field protocol mandate"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#02457A] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsItemModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmittingItem}>
                {isSubmittingItem ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. MODAL: ADJUST CARGO CAPACITY */}
      {isCapacityModalOpen && (
        <Modal
          isOpen={isCapacityModalOpen}
          onClose={() => setIsCapacityModalOpen(false)}
          title={`Adjust Cargo Capacity Limits (${expeditionId})`}
        >
          <form onSubmit={handleSubmitCapacity} className="space-y-4 text-xs">
            {capacityFormErrors.submit && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
                {capacityFormErrors.submit}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Maximum Payload Capacity (kg) *</label>
              <input
                type="number"
                min="1"
                step="10"
                value={capacityFormData.maxCapacityKg}
                onChange={(e) => setCapacityFormData({ ...capacityFormData, maxCapacityKg: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-[#02457A] focus:outline-none"
              />
              {capacityFormErrors.maxCapacityKg && (
                <span className="text-[11px] text-rose-600 mt-0.5 block">{capacityFormErrors.maxCapacityKg}</span>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Allocated Heavy Cargo Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="10"
                value={capacityFormData.allocatedCargoKg}
                onChange={(e) => setCapacityFormData({ ...capacityFormData, allocatedCargoKg: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-[#02457A] focus:outline-none"
              />
              {capacityFormErrors.allocatedCargoKg && (
                <span className="text-[11px] text-rose-600 mt-0.5 block">{capacityFormErrors.allocatedCargoKg}</span>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Capacity Notes & Constraints</label>
              <textarea
                rows={2}
                value={capacityFormData.notes}
                onChange={(e) => setCapacityFormData({ ...capacityFormData, notes: e.target.value })}
                placeholder="e.g. Basler BT-67 turbo airlift cargo bay limit"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-[#02457A] focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCapacityModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmittingCapacity}>
                {isSubmittingCapacity ? 'Saving...' : 'Update Capacity Limits'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
