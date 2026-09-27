import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  Boxes,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  Sparkles,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Clock,
  ExternalLink,
  Info,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import {
  InventoryItem,
  InventoryStatus,
  InventoryCategory,
} from '@/data/inventoryData'
import {
  InventoryForecastResult,
  requestInventoryForecast,
} from '@/services/inventoryForecastService'
import {
  fetchInventoryList,
  createInventoryItem,
  InventoryApiPayload,
} from '@/services/inventoryService'

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate()

  // Master inventory state from PostgreSQL Database
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [stationFilter, setStationFilter] = useState<string>('All')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // Forecast modal state
  const [forecastModalItem, setForecastModalItem] = useState<InventoryItem | null>(null)
  const [forecastResult, setForecastResult] = useState<InventoryForecastResult | null>(null)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [forecastError, setForecastError] = useState<string | null>(null)

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Vehicle & Machinery Spares' as InventoryCategory,
    quantity: '',
    unit: 'Units',
    location: 'Maitri Base - Heavy Workshop',
    minimum_stock: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Inventory data from PostgreSQL backend API
  const loadInventoryData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchInventoryList()
      setInventoryList(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory records from database.')
      setInventoryList([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInventoryData()
  }, [])

  // Forecast hook
  useEffect(() => {
    if (!forecastModalItem) return

    let isCurrentRequest = true
    setForecastResult(null)
    setForecastError(null)
    setForecastLoading(true)

    requestInventoryForecast(forecastModalItem)
      .then((result) => {
        if (isCurrentRequest) setForecastResult(result)
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          setForecastError(
            error instanceof Error ? error.message : 'Forecast service unavailable. Please try again.',
          )
        }
      })
      .finally(() => {
        if (isCurrentRequest) setForecastLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [forecastModalItem])

  // Form Validation
  const validateAddForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.item_name.trim()) {
      errors.item_name = 'Item nomenclature / name is required'
    } else if (formData.item_name.trim().length < 2) {
      errors.item_name = 'Item name must be at least 2 characters'
    }

    if (!formData.quantity.trim()) {
      errors.quantity = 'Initial stock quantity is required'
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      errors.quantity = 'Quantity must be a non-negative number'
    }

    if (!formData.minimum_stock.trim()) {
      errors.minimum_stock = 'Minimum safety threshold is required'
    } else if (isNaN(Number(formData.minimum_stock)) || Number(formData.minimum_stock) < 0) {
      errors.minimum_stock = 'Minimum threshold must be a non-negative number'
    }

    if (!formData.unit.trim()) {
      errors.unit = 'Unit of measurement is required'
    }

    if (!formData.location.trim()) {
      errors.location = 'Station storage location is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Add Item Submission
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAddForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    const payload: InventoryApiPayload = {
      item_name: formData.item_name.trim(),
      category: formData.category,
      quantity: parseInt(formData.quantity, 10) || 0,
      unit: formData.unit.trim(),
      location: formData.location.trim(),
      minimum_stock: parseInt(formData.minimum_stock, 10) || 0,
    }

    try {
      await createInventoryItem(payload)
      await loadInventoryData()
      setIsAddModalOpen(false)
      setFormData({
        item_name: '',
        category: 'Vehicle & Machinery Spares',
        quantity: '',
        unit: 'Units',
        location: 'Maitri Base - Heavy Workshop',
        minimum_stock: '',
      })
      setFormErrors({})
      setSubmitError(null)
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save inventory item in PostgreSQL database.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Inventory items
  const filteredItems = useMemo(() => {
    return inventoryList.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matches =
          item.id.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.station.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.storageLocation.toLowerCase().includes(q)
        if (!matches) return false
      }

      // Station filter
      if (stationFilter !== 'All' && item.station !== stationFilter) {
        return false
      }

      // Category filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [inventoryList, searchQuery, stationFilter, categoryFilter, statusFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setStationFilter('All')
    setCategoryFilter('All')
    setStatusFilter('All')
  }

  const isFiltered =
    searchQuery.trim() !== '' ||
    stationFilter !== 'All' ||
    categoryFilter !== 'All' ||
    statusFilter !== 'All'

  // Summary counts
  const criticalCount = inventoryList.filter((i) => i.status === 'Critical').length
  const lowStockCount = inventoryList.filter((i) => i.status === 'Low Stock').length
  const normalCount = inventoryList.filter((i) => i.status === 'Normal').length

  const getStatusBadgeVariant = (status: InventoryStatus) => {
    switch (status) {
      case 'Critical':
        return 'critical'
      case 'Low Stock':
        return 'warning'
      case 'Normal':
      default:
        return 'operational'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#02457A]" />
            Inventory Management & Strategic Reserves
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Station fuel tanks, life-support consumables, machinery spares, and ML demand forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadInventoryData}
            isLoading={isLoading}
            iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh inventory from PostgreSQL database"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSubmitError(null)
              setIsAddModalOpen(true)
            }}
            iconLeft={<Plus className="w-3.5 h-3.5" />}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* ERROR BANNER IF DATABASE CONNECTION FAILS */}
      {error && !isLoading && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-rose-900">Database Connection Error:</span>{' '}
              <span className="text-rose-800">{error}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={loadInventoryData}
            iconLeft={<RefreshCw className="w-3 h-3" />}
          >
            Retry Database Query
          </Button>
        </div>
      )}

      {/* 2. OPERATIONAL SUMMARY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Monitored Items</span>
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1 text-2xl font-bold font-sans text-slate-900">
            {isLoading ? '...' : inventoryList.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">PostgreSQL Tracked SKUs</div>
        </div>

        <div
          className={`bg-white border rounded-lg p-4 shadow-xs ${
            criticalCount > 0
              ? 'border-slate-200 border-l-4 border-l-rose-600 bg-rose-50/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Critical Deficits</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1 text-2xl font-bold font-sans text-rose-900">
            {isLoading ? '...' : criticalCount}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5 font-bold">Immediate Airlift Required</div>
        </div>

        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Low Stock Items</span>
            <Shield className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-sans text-amber-900">
            {isLoading ? '...' : lowStockCount}
          </div>
          <div className="text-[11px] text-amber-800 mt-0.5 font-semibold">Below Safety Buffer</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Normal Stock</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-sans text-slate-900">
            {isLoading ? '...' : normalCount}
          </div>
          <div className="text-[11px] text-emerald-800 mt-0.5 font-mono">Adequate Reserves</div>
        </div>
      </div>

      {/* 3. SEARCH & MULTI-FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory by Item ID, nomenclature, station, category, or storage location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] focus:bg-white placeholder:text-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Station Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 font-mono">Station:</span>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Stations</option>
                <option value="Maitri">Maitri Base</option>
                <option value="Bharati">Bharati Base</option>
                <option value="Himadri">Himadri (Arctic)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 font-mono">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Fuel & Energy">Fuel & Energy</option>
                <option value="Water & Life Support">Water & Life Support</option>
                <option value="Vehicle & Machinery Spares">Vehicle & Machinery Spares</option>
                <option value="Medical Supplies">Medical Supplies</option>
                <option value="Scientific Reagents">Scientific Reagents</option>
                <option value="Provisions & Rations">Provisions & Rations</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 font-mono">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Normal">Normal</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {isFiltered && (
              <Button variant="ghost" size="xs" onClick={clearFilters} iconLeft={<X className="w-3 h-3" />}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. INVENTORY DATA TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            Station Strategic Stock Roster
          </span>
          <span className="font-mono">
            {isLoading ? 'Connecting to database...' : `Showing ${filteredItems.length} of ${inventoryList.length} Items`}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3 shadow-xs">
            <Loader2 className="w-7 h-7 text-[#02457A] animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-700">Connecting to PostgreSQL database...</div>
            <p className="text-[11px] text-slate-400">Fetching live polar inventory stock records.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Boxes className="w-8 h-8 text-slate-400" />}
            title="No inventory items found"
            description={
              error
                ? `Unable to load inventory records: ${error}`
                : isFiltered
                ? "No items match the active filters or search keyword. Adjust criteria to view items."
                : "No inventory items are currently recorded in the database."
            }
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : error ? (
                <Button variant="secondary" size="sm" onClick={loadInventoryData} iconLeft={<RefreshCw className="w-3.5 h-3.5" />}>
                  Retry Query
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Minimum Stock</TableHead>
                <TableHead>Avg Daily Consumption</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => navigate(`/inventory/${item.id}`)}
                  className={`cursor-pointer transition-colors ${
                    item.status === 'Critical'
                      ? 'bg-rose-50/25 hover:bg-rose-50/50 border-l-2 border-l-rose-600'
                      : item.status === 'Low Stock'
                      ? 'bg-amber-50/15 hover:bg-amber-50/40 border-l-2 border-l-amber-500'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <TableCell mono className="font-semibold text-slate-900">
                    {item.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 max-w-[220px]">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.storageLocation}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 text-xs">
                    {item.station}
                  </TableCell>
                  <TableCell mono className="text-slate-600 text-xs">
                    {item.unit}
                  </TableCell>
                  <TableCell mono className="font-bold text-slate-900 text-xs">
                    {item.currentStock.toLocaleString()}
                  </TableCell>
                  <TableCell mono className="text-slate-500 text-xs">
                    {item.minimumStock.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-600 text-[11px] font-mono">
                    {item.dailyConsumptionDisplay}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold tabular-nums ${
                          item.daysRemaining <= 15
                            ? 'text-rose-700'
                            : item.daysRemaining <= 30
                            ? 'text-amber-800'
                            : 'text-slate-800'
                        }`}
                      >
                        {item.daysRemaining}d
                      </span>
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${
                            item.daysRemaining <= 15
                              ? 'bg-rose-600'
                              : item.daysRemaining <= 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, (item.daysRemaining / 90) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)} size="sm" withDot>
                      {item.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell mono className="text-slate-500 text-[11px]">
                    {item.lastUpdated.split(' ')[0]}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setForecastModalItem(item)}
                        iconLeft={<Sparkles className="w-3 h-3 text-indigo-600" />}
                        title="View ML Forecast"
                      >
                        Forecast
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => navigate(`/inventory/${item.id}`)}
                        iconLeft={<Eye className="w-3 h-3" />}
                      >
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 5. ADD INVENTORY ITEM MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setFormErrors({})
          setSubmitError(null)
        }}
        title="Register Inventory Item"
        description="Add a new fuel tank, medical supply batch, or machinery spare to the PostgreSQL strategic stock ledger."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false)
                setFormErrors({})
                setSubmitError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddItem}
              isLoading={isSubmitting}
            >
              Save to Database
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddItem} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-850 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900">Failed to save item:</span>{' '}
                <span className="text-rose-800">{submitError}</span>
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
              Item Nomenclature / Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Synthetic Low-Viscosity Polar Hydraulic Fluid"
              value={formData.item_name}
              onChange={(e) => {
                setFormData({ ...formData, item_name: e.target.value })
                if (formErrors.item_name) setFormErrors({ ...formErrors, item_name: '' })
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                formErrors.item_name
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-[#02457A]'
              }`}
            />
            {formErrors.item_name && (
              <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.item_name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Inventory Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryCategory })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              >
                <option value="Fuel & Energy">Fuel & Energy</option>
                <option value="Water & Life Support">Water & Life Support</option>
                <option value="Vehicle & Machinery Spares">Vehicle & Machinery Spares</option>
                <option value="Medical Supplies">Medical Supplies</option>
                <option value="Scientific Reagents">Scientific Reagents</option>
                <option value="Provisions & Rations">Provisions & Rations</option>
              </select>
            </div>

            {/* Storage Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Station Storage Location <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Maitri Base - Fuel Tank Farm Alpha"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value })
                  if (formErrors.location) setFormErrors({ ...formErrors, location: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.location
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.location && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.location}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Initial Quantity */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Current Stock <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData({ ...formData, quantity: e.target.value })
                  if (formErrors.quantity) setFormErrors({ ...formErrors, quantity: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.quantity
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.quantity && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.quantity}</p>
              )}
            </div>

            {/* Minimum Safety Buffer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Minimum Stock Buffer <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 200"
                value={formData.minimum_stock}
                onChange={(e) => {
                  setFormData({ ...formData, minimum_stock: e.target.value })
                  if (formErrors.minimum_stock) setFormErrors({ ...formErrors, minimum_stock: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.minimum_stock
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.minimum_stock && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.minimum_stock}</p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Unit of Measure <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Liters, Units, kg, Boxes"
                value={formData.unit}
                onChange={(e) => {
                  setFormData({ ...formData, unit: e.target.value })
                  if (formErrors.unit) setFormErrors({ ...formErrors, unit: '' })
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 ${
                  formErrors.unit
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#02457A]'
                }`}
              />
              {formErrors.unit && (
                <p className="mt-1 text-[11px] text-rose-600 font-mono">{formErrors.unit}</p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* 6. ML FORECAST DETAIL MODAL (Quick View from table) */}
      {forecastModalItem && (
        <Modal
          isOpen={!!forecastModalItem}
          onClose={() => setForecastModalItem(null)}
          title="Inventory Demand Prediction (ML Forecast)"
          description={`${forecastModalItem.name} (${forecastModalItem.id}) · ${forecastModalItem.station} Base`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = forecastModalItem.id
                  setForecastModalItem(null)
                  navigate(`/inventory/${id}`)
                }}
                iconRight={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open Full Item Ledger
              </Button>
              <Button variant="primary" size="sm" onClick={() => setForecastModalItem(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded text-indigo-950 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">ML Demand Prediction</div>
                <p className="text-indigo-900 text-[11px] leading-relaxed">
                  Statistical demand projection based on seasonal consumption models, scheduled flight traverses, and station personnel headcounts.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
              <strong>Prototype operational inputs used.</strong>
              {forecastModalItem.prototypeForecastInputs.scenario === 'cold-start-demo' &&
                ' Synthetic zero-history demo; displayed monthly history is not sent as daily model input.'}
            </div>

            {forecastLoading && (
              <div role="status" className="p-4 bg-slate-50 border border-slate-200 rounded text-slate-600">
                Requesting inventory forecast...
              </div>
            )}

            {forecastError && (
              <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-800">
                {forecastError}
              </div>
            )}

            {forecastResult && (
              <div className="space-y-4">
                {!forecastResult.categoryInModelVocabulary && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                    Category “{forecastModalItem.category}” is outside the model training vocabulary and was passed through unchanged.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[11px] text-slate-500 uppercase font-medium">Predicted Requirement</span>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {forecastResult.data.predicted_requirement.toLocaleString()} {forecastModalItem.unit}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[11px] text-slate-500 uppercase font-medium">Current Stock On Hand</span>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {forecastResult.data.current_stock.toLocaleString()} {forecastModalItem.unit}
                    </div>
                  </div>

                  <div className="p-3 bg-[#0D1316] border border-[#263238] rounded-lg">
                    <span className="text-[11px] block uppercase font-mono font-bold tracking-wider text-[#A7B2B8]">
                      RECOMMENDED ADDITIONAL QUANTITY
                    </span>
                    <div className="text-xl font-bold font-mono mt-1 text-[#FFD21C]">
                      {forecastResult.data.recommended_additional_qty.toLocaleString()} {forecastModalItem.unit}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2 text-[11px] text-slate-700 font-mono">
                  <div><strong>Status:</strong> {forecastResult.data.status}</div>
                  <div><strong>Prediction source:</strong> {forecastResult.data.prediction_source}</div>
                  <div><strong>Model version:</strong> {forecastResult.data.model_version}</div>
                  <div className={forecastResult.data.low_confidence ? 'font-bold text-amber-800' : ''}>
                    <strong>Low confidence:</strong> {forecastResult.data.low_confidence ? 'Yes' : 'No'}
                  </div>
                  <div><strong>Recommendation:</strong> {forecastResult.data.recommendation}</div>
                </div>
              </div>
            )}

            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong>Non-Automated Safeguard:</strong> ML predictions do not automatically modify station stock ledgers. All replenishment allocations require Expedition Manager manual authorization.
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
