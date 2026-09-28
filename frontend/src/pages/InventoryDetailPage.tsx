import React, { useEffect, useState } from 'react'
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
  Boxes,
  ArrowLeft,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  MapPin,
  Shield,
  FileText,
  Activity,
  Plus,
  Minus,
  Edit,
  Info,
  ExternalLink,
} from 'lucide-react'
import {
  INITIAL_INVENTORY_ITEMS,
  InventoryItem,
  InventoryStatus,
  InventoryTransaction,
} from '@/data/inventoryData'
import {
  InventoryForecastResult,
  requestInventoryForecast,
} from '@/services/inventoryForecastService'
import { fetchInventoryList, logInventoryTransaction } from '@/services/inventoryService'

export const InventoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Find item from database
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY_ITEMS)

  useEffect(() => {
    fetchInventoryList()
      .then((data) => {
        if (data && data.length > 0) {
          setItems(data)
        }
      })
      .catch(() => {})
  }, [])

  const item = items.find((i) => i.id.toLowerCase() === id?.toLowerCase())

  // Transaction Log Modal State (Manual adjustment ONLY - ML does not auto-modify)
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false)
  const [txnType, setTxnType] = useState<InventoryTransaction['type']>('Consumption Drawdown')
  const [txnQty, setTxnQty] = useState('')
  const [txnOfficer, setTxnOfficer] = useState('Logistics Officer')
  const [txnDoc, setTxnDoc] = useState('')
  const [isSubmittingTxn, setIsSubmittingTxn] = useState(false)

  // Forecast Inspection Modal State
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false)
  const [forecastResult, setForecastResult] = useState<InventoryForecastResult | null>(null)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [forecastError, setForecastError] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return

    let isCurrentRequest = true
    setForecastResult(null)
    setForecastError(null)
    setForecastLoading(true)

    requestInventoryForecast(item)
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
  }, [item])

  if (!item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} iconLeft={<ArrowLeft className="w-4 h-4" />}>
            Back to Inventory
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Boxes className="w-8 h-8 text-slate-400" />}
              title="Inventory SKU Not Found"
              description={`No material line with identifier "${id}" exists in the station reserve database.`}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/inventory')}>
                  Return to Inventory Registry
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const [txnError, setTxnError] = useState<string | null>(null)

  // Handle manual transaction submission with PostgreSQL backend persistence
  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    const numQty = parseFloat(txnQty)
    if (isNaN(numQty) || numQty <= 0) return

    setIsSubmittingTxn(true)
    setTxnError(null)

    try {
      await logInventoryTransaction(item.id, {
        transactionType: txnType,
        quantity: Math.round(numQty),
        officer: txnOfficer.trim() || 'Logistics Officer',
        referenceDoc: txnDoc.trim() || `MANUAL-LOG-${Date.now()}`,
      })

      // Refetch live inventory from PostgreSQL database
      const freshData = await fetchInventoryList()
      if (freshData && freshData.length > 0) {
        setItems(freshData)
      }

      setIsTxnModalOpen(false)
      setTxnQty('')
      setTxnDoc('')
    } catch (err) {
      console.error('Failed to record transaction in database:', err)
      setTxnError(err instanceof Error ? err.message : 'Failed to record transaction in database.')
    } finally {
      setIsSubmittingTxn(false)
    }
  }

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
      {/* 1. TOP BREADCRUMB & BACK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/inventory" className="hover:text-[#02457A] font-medium flex items-center gap-1 transition-colors">
            <Boxes className="w-3.5 h-3.5 text-[#02457A]" />
            Inventory Reserves
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">{item.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => navigate('/inventory')}
            iconLeft={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            All Inventory
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsForecastModalOpen(true)}
            iconLeft={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
          >
            View Forecast
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={() => setIsTxnModalOpen(true)}
            iconLeft={<Plus className="w-3.5 h-3.5" />}
          >
            Log Stock Transaction
          </Button>
        </div>
      </div>

      {/* 2. HEADER */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#001B48] text-white tracking-wider">
                {item.id}
              </span>
              <Badge variant={getStatusBadgeVariant(item.status)} size="sm" withDot>
                {item.status.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">Category: <strong className="text-slate-700">{item.category}</strong></span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono">Station: <strong className="text-slate-700">{item.station} Base</strong></span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{item.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Storage Facility: <strong className="text-slate-800">{item.storageLocation}</strong></span>
              <span className="text-slate-300">·</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Audit: <strong className="text-slate-800 font-mono">{item.lastUpdated}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-right min-w-[130px]">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Current Stock</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {item.currentStock.toLocaleString()} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-right min-w-[130px]">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Days Remaining</div>
              <div
                className={`text-lg font-bold font-mono mt-0.5 ${
                  item.daysRemaining <= 15
                    ? 'text-rose-700'
                    : item.daysRemaining <= 30
                    ? 'text-amber-800'
                    : 'text-emerald-700'
                }`}
              >
                {item.daysRemaining} Days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Stock */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Current Stock Level</span>
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {item.currentStock.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">{item.unit}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Buffer: <strong className="text-slate-700">{Math.round((item.currentStock / item.minimumStock) * 100)}%</strong> of safety min</span>
          </div>
        </div>

        {/* Minimum Stock Safety Threshold */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Minimum Safety Stock</span>
            <Shield className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {item.minimumStock.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">{item.unit}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            <span>Mandatory Antarctic reserve floor</span>
          </div>
        </div>

        {/* Daily Consumption Rate */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Avg Daily Consumption</span>
            <Activity className="w-3.5 h-3.5 text-[#02457A]" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {item.averageDailyConsumption}{' '}
            <span className="text-xs font-normal text-slate-500">{item.unit}/day</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate font-mono">
            {item.dailyConsumptionDisplay}
          </div>
        </div>

        {/* Expected Requirement */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
            <span>Expected Requirement</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {item.expectedRequirement.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">{item.unit}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            <span>Austral seasonal budget quota</span>
          </div>
        </div>
      </div>

      {/* 4. INVENTORY FORECAST SECTION (ML DEMAND PREDICTION) */}
      <Card accent="info">
        <CardHeader className="py-3 px-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
                  Inventory Demand Prediction
                </CardTitle>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border border-indigo-200">
                  ML FORECAST
                </span>
              </div>
              <CardDescription className="text-[11px] text-slate-500">
                Statistical demand projection based on seasonal consumption models & expedition requirements
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 shadow-xs">
              {forecastResult
                ? `Model: ${forecastResult.data.model_version}`
                : forecastLoading
                ? 'Forecast loading'
                : forecastError
                ? 'Forecast unavailable'
                : 'Forecast pending'}
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setIsForecastModalOpen(true)}
              iconLeft={<ExternalLink className="w-3 h-3" />}
            >
              Inspect Model Detail
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4 text-xs">
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
            <strong>Prototype operational inputs used.</strong>
            {item.prototypeForecastInputs.scenario === 'cold-start-demo' &&
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
                  Category “{item.category}” is outside the model training vocabulary and was passed through unchanged.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[11px] text-slate-500 block uppercase font-mono font-bold">Predicted Requirement</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {forecastResult.data.predicted_requirement.toLocaleString()} {item.unit}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[11px] text-slate-500 block uppercase font-mono font-bold">Current Stock On Hand</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {forecastResult.data.current_stock.toLocaleString()} {item.unit}
                  </div>
                </div>

                <div className="p-3 bg-[#0D1316] border border-[#263238] rounded-lg">
                  <span className="text-[11px] block uppercase font-mono font-bold tracking-wider text-[#A7B2B8]">
                    RECOMMENDED ADDITIONAL QUANTITY
                  </span>
                  <div className="text-xl font-bold font-mono mt-1 text-[#FFD21C]">
                    {forecastResult.data.recommended_additional_qty.toLocaleString()} {item.unit}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-slate-600 font-mono text-[11px]">
                <div><strong className="text-slate-800">Status:</strong> {forecastResult.data.status}</div>
                <div><strong className="text-slate-800">Prediction source:</strong> {forecastResult.data.prediction_source}</div>
                <div><strong className="text-slate-800">Model version:</strong> {forecastResult.data.model_version}</div>
                <div className={forecastResult.data.low_confidence ? 'font-bold text-amber-800' : ''}>
                  <strong className="text-slate-800">Low confidence:</strong> {forecastResult.data.low_confidence ? 'Yes' : 'No'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700">
                <strong>Recommendation:</strong> {forecastResult.data.recommendation}
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-800">Advisory Note:</strong> Forecast results do not automatically alter physical stock registers. Replenishment allocations require Expedition Manager authorization.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. ITEM SPECIFICATIONS & CONSUMPTION HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Consumption History & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Consumption History Table */}
          <Card>
            <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200 flex flex-row items-center justify-between">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
                Historical Monthly Consumption Trend
              </CardTitle>
              <span className="text-[10px] font-mono text-slate-500">Past 6 Operating Periods</span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Total Consumed</TableHead>
                    <TableHead>Burn Rate Pattern</TableHead>
                    <TableHead>Operational Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.consumptionHistory.map((h, idx) => (
                    <TableRow key={idx}>
                      <TableCell mono className="font-bold text-slate-900">
                        {h.period}
                      </TableCell>
                      <TableCell mono className="font-semibold text-slate-900">
                        {h.consumption.toLocaleString()} {item.unit}
                      </TableCell>
                      <TableCell className="text-slate-700 text-xs">{h.burnRateDesc}</TableCell>
                      <TableCell className="text-slate-600 text-xs">{h.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Transactions Audit Table */}
          <Card>
            <CardHeader className="py-2.5 px-4 bg-slate-50/80 dark:bg-[#101619] border-b border-slate-200 dark:border-[#263238] flex flex-row items-center justify-between">
              <CardTitle className="text-xs text-slate-900 dark:text-[#F5F7F8] uppercase tracking-wider font-bold font-mono">
                Recent Physical Stock Transactions
              </CardTitle>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsTxnModalOpen(true)}
                iconLeft={<Plus className="w-3 h-3" />}
              >
                Log Entry
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="w-full min-w-[940px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] min-w-[95px] font-mono text-[11px]">TXN ID</TableHead>
                    <TableHead className="w-[135px] min-w-[130px] font-mono text-[11px]">Timestamp</TableHead>
                    <TableHead className="w-[195px] min-w-[185px] font-mono text-[11px]">Transaction Type</TableHead>
                    <TableHead className="w-[110px] min-w-[105px] font-mono text-[11px]">Delta</TableHead>
                    <TableHead className="w-[140px] min-w-[135px] font-mono text-[11px]">Balance After</TableHead>
                    <TableHead className="w-[170px] min-w-[160px] font-mono text-[11px]">Recorded By</TableHead>
                    <TableHead className="w-[150px] min-w-[140px] font-mono text-[11px]">Ref Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.recentTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell mono className="font-bold text-slate-900 dark:text-[#F5F7F8] whitespace-nowrap">
                        {t.id}
                      </TableCell>
                      <TableCell mono className="text-slate-600 dark:text-[#A7B2B8] text-[11px] whitespace-nowrap">
                        {t.timestamp}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold font-mono px-2.5 py-1 rounded border whitespace-nowrap ${
                            t.type === 'Intake Delivery'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#16C784] border-emerald-200 dark:border-emerald-800/60'
                              : t.type === 'Consumption Drawdown'
                              ? 'bg-slate-100 dark:bg-[#11191D] text-slate-800 dark:text-[#A7B2B8] border-slate-200 dark:border-[#263238]'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-[#FFD21C] border-amber-200 dark:border-amber-800/60'
                          }`}
                        >
                          {t.type}
                        </span>
                      </TableCell>
                      <TableCell
                        mono
                        className={`font-bold text-xs whitespace-nowrap ${
                          t.quantity > 0 ? 'text-emerald-700 dark:text-[#16C784]' : t.quantity < 0 ? 'text-rose-700 dark:text-[#FF3038]' : 'text-slate-600 dark:text-[#A7B2B8]'
                        }`}
                      >
                        {t.quantity > 0 ? `+${t.quantity.toLocaleString()}` : t.quantity.toLocaleString()}{' '}
                        {t.unit}
                      </TableCell>
                      <TableCell mono className="font-bold text-slate-900 dark:text-[#F5F7F8] whitespace-nowrap">
                        {t.balanceAfter.toLocaleString()} {t.unit}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-[#F5F7F8] text-xs font-medium leading-snug">
                        {t.officer}
                      </TableCell>
                      <TableCell mono className="text-slate-500 dark:text-[#A7B2B8] text-[11px] leading-snug">
                        {t.referenceDoc}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Specifications & Physical Storage */}
        <div className="space-y-6">
          {/* Specifications Card */}
          <Card>
            <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
                Material Specifications & Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {item.specifications}
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div>
                  <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Assigned Station</span>
                  <span className="font-semibold text-slate-900">{item.station} Base</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Unit of Issue</span>
                  <span className="font-mono font-semibold text-slate-900">{item.unit}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-mono font-bold uppercase">Physical Location</span>
                  <span className="font-semibold text-slate-900">{item.storageLocation}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Box */}
          <Card>
            <CardHeader className="py-2.5 px-4 bg-slate-50/80 border-b border-slate-200">
              <CardTitle className="text-xs text-slate-900 uppercase tracking-wider font-bold font-mono">
                Logistics Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => setIsTxnModalOpen(true)}
                iconLeft={<Plus className="w-3.5 h-3.5" />}
              >
                Log Physical Transaction
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setIsForecastModalOpen(true)}
                iconLeft={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              >
                View ML Demand Forecast
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 6. LOG TRANSACTION MODAL (Manual stock update) */}
      <Modal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        title={`Log Stock Transaction: ${item.name}`}
        description="Record physical intake delivery, scheduled consumption drawdown, or stock audit count."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsTxnModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleLogTransaction}
              isLoading={isSubmittingTxn}
            >
              Post Transaction
            </Button>
          </>
        }
      >
        <form onSubmit={handleLogTransaction} className="space-y-4 text-xs">
          {txnError && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-semibold">
              {txnError}
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
              Transaction Type
            </label>
            <select
              value={txnType}
              onChange={(e) => setTxnType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
            >
              <option value="Consumption Drawdown">Consumption Drawdown (Issue to Station)</option>
              <option value="Intake Delivery">Intake Delivery (Vessel / Air Cargo Intake)</option>
              <option value="Emergency Relocation">Emergency Relocation</option>
              <option value="Audit Verification">Audit Verification</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Quantity ({item.unit}) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                placeholder="e.g. 1200"
                value={txnQty}
                onChange={(e) => setTxnQty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Officer In Charge
              </label>
              <input
                type="text"
                placeholder="e.g. Er. Rajesh Nair"
                value={txnOfficer}
                onChange={(e) => setTxnOfficer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
              Reference Document / Job Card
            </label>
            <input
              type="text"
              placeholder="e.g. MAINT-GEN-2026-09 or MANIFEST-CRG-8821"
              value={txnDoc}
              onChange={(e) => setTxnDoc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#018ABE]/30 focus:border-[#02457A]"
            />
          </div>
        </form>
      </Modal>

      {/* 7. FORECAST INSPECTION MODAL */}
      <Modal
        isOpen={isForecastModalOpen}
        onClose={() => setIsForecastModalOpen(false)}
        title="ML Demand Prediction Forecast Details"
        description={`${item.name} (${item.id}) · ${item.station} Base`}
        size="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsForecastModalOpen(false)}>
            Close Forecast Window
          </Button>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg text-indigo-950 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold font-mono">ML Demand Prediction Engine</div>
              <p className="text-indigo-900 text-[11px] leading-relaxed mt-0.5">
                Structured inference model calculating multi-factor supply burn rates under severe sub-zero thermal extremes, wintering crew density, and scheduled air-link windows.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
            <strong>Prototype operational inputs used.</strong>
            {item.prototypeForecastInputs.scenario === 'cold-start-demo' &&
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 uppercase font-mono font-bold">
                Predicted Requirement
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {forecastResult ? `${forecastResult.data.predicted_requirement.toLocaleString()} ${item.unit}` : '—'}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                Live backend forecast
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 uppercase font-mono font-bold">
                Current Stock On Hand
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {forecastResult ? `${forecastResult.data.current_stock.toLocaleString()} ${item.unit}` : '—'}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                Physical station stock
              </span>
            </div>

            <div className="p-3 bg-[#0D1316] border border-[#263238] rounded-lg">
              <span className="text-[11px] block uppercase font-mono font-bold tracking-wider text-[#A7B2B8]">
                RECOMMENDED ADDITIONAL QUANTITY
              </span>
              <div className="text-xl font-bold font-mono mt-1 text-[#FFD21C]">
                {forecastResult
                  ? `${forecastResult.data.recommended_additional_qty.toLocaleString()} ${item.unit}`
                  : '—'}
              </div>
              <span className="text-[10px] font-mono mt-0.5 block text-[#A7B2B8]">
                Targeted for next freight dispatch
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[11px] text-slate-700 font-mono">
            <div><strong className="text-slate-900">Status:</strong> {forecastResult?.data.status ?? '—'}</div>
            <div><strong className="text-slate-900">Prediction Source:</strong> {forecastResult?.data.prediction_source ?? '—'}</div>
            <div><strong className="text-slate-900">Model Version:</strong> {forecastResult?.data.model_version ?? '—'}</div>
            <div><strong className="text-slate-900">Low Confidence:</strong> {forecastResult ? (forecastResult.data.low_confidence ? 'Yes' : 'No') : '—'}</div>
            <div><strong className="text-slate-900">Recommendation:</strong> {forecastResult?.data.recommendation ?? '—'}</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
