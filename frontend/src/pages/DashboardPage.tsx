import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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
  Compass,
  Package,
  Boxes,
  Users,
  ShieldAlert,
  RefreshCw,
  Clock,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Thermometer,
  Wind,
  Gauge,
  Radio,
  Eye,
  Check,
  Calendar,
  Plus,
  ArrowRight,
  Sun,
  Droplets,
  CloudSnow,
  MapPin,
  Flag,
  Sparkles,
  ShieldCheck,
  Ship,
  Zap,
  Activity,
  Sliders,
  Send,
  Building2,
  Lock,
} from 'lucide-react'
import { useOperational, isAuthorizedForMissionControl } from '@/context/OperationalContext'

// Types for Dashboard domain entities
interface Expedition {
  id: string
  name: string
  station: string
  type: string
  personnelCount: number
  departure: string
  expectedReturn: string
  progress: number
  status: 'On Track' | 'In Progress' | 'Planning' | 'Returning' | 'Completed'
  leader: string
}

interface CargoItem {
  id: string
  description: string
  destination: string
  priority: 'Critical' | 'High' | 'Standard'
  eta: string
  status: 'In Transit' | 'Delayed' | 'Received' | 'Port Customs'
  carrier: string
}

interface InventoryInsightItem {
  item: string
  station: string
  currentStock: string
  predictedRequirement: string
  recommendedAction: string
  status: 'Reorder Soon' | 'Sufficient' | 'Monitor'
}

interface IncidentItem {
  id: string
  location: string
  type: string
  severity: 'Critical' | 'Warning' | 'Advisory'
  time: string
  status: string
  assignedUnit: string
  personnelAffected: number
}

interface OperationalAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  relatedEntity: string
  acknowledged: boolean
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentRole, currentUser } = useOperational()
  const [lastUpdated] = useState('Monday, 22 September 2026 18:31 IST')

  // Modals / Inspection details
  const [selectedExpedition, setSelectedExpedition] = useState<Expedition | null>(null)
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null)

  // AI Human Authorization state in Inventory Dashboard
  const [aiVerified, setAiVerified] = useState(false)

  // 1. Expeditions Data
  const expeditions: Expedition[] = [
    {
      id: 'EXP-2026-014',
      name: 'ISEA 44 - Logistics & Base Resupply',
      station: 'Maitri & Bharati',
      type: 'Resupply',
      personnelCount: 58,
      departure: '2026-11-20',
      expectedReturn: '14 Feb 2027',
      progress: 70,
      status: 'On Track',
      leader: 'Dr. Alok Verma (NCPOR)',
    },
    {
      id: 'EXP-2026-015',
      name: 'Scientific Cryosphere & Ice Core Traverse',
      station: 'Himadri & Maitri',
      type: 'Research',
      personnelCount: 24,
      departure: '2026-08-15',
      expectedReturn: '28 Feb 2027',
      progress: 45,
      status: 'In Progress',
      leader: 'Dr. Priya Nambiar (NCPOR)',
    },
    {
      id: 'EXP-2026-016',
      name: 'Southern Ocean Paleoclimate Cruise',
      station: 'Prydz Bay Sector',
      type: 'Oceanography',
      personnelCount: 32,
      departure: '2026-12-05',
      expectedReturn: '10 Apr 2027',
      progress: 20,
      status: 'In Progress',
      leader: 'Dr. S. K. Roy (NIO / NCPOR)',
    },
  ]

  // 2. Cargo Data
  const cargoShipments: CargoItem[] = [
    {
      id: 'CRG-2026-001',
      description: 'Polar Fuel Drums (Jet A-1) & Generator Spares',
      destination: 'Maitri Base',
      priority: 'Critical',
      eta: '2026-11-28',
      status: 'In Transit',
      carrier: 'MV Vasily Golovnin',
    },
    {
      id: 'CRG-2026-002',
      description: 'Wintering Rations & Dehydrated Provisions',
      destination: 'Bharati Base',
      priority: 'High',
      eta: '2026-12-04',
      status: 'In Transit',
      carrier: 'MV Vasily Golovnin',
    },
    {
      id: 'CRG-2026-003',
      description: 'High-Altitude Atmospheric LIDAR Sensors',
      destination: 'Maitri Science Lab',
      priority: 'Critical',
      eta: '2026-10-15',
      status: 'Delayed',
      carrier: 'Cape Town Port Warehouse 4',
    },
    {
      id: 'CRG-2026-004',
      description: 'Medical Bay Emergency Plasma & Trauma Kits',
      destination: 'Maitri & Bharati',
      priority: 'High',
      eta: '2026-11-20',
      status: 'Received',
      carrier: 'Indian Air Force C-17 GlobeMaster',
    },
  ]

  // 3. Inventory Insights (AI-Powered) Data
  const inventoryInsights: InventoryInsightItem[] = [
    {
      item: 'Diesel / Jet A-1 Fuel (L)',
      station: 'Maitri Tank Farm',
      currentStock: '24,000',
      predictedRequirement: '96,000',
      recommendedAction: '+72,000',
      status: 'Reorder Soon',
    },
    {
      item: 'Fresh Food & Rations (kg)',
      station: 'Bharati Cold Store',
      currentStock: '2,300',
      predictedRequirement: '2,800',
      recommendedAction: '+500',
      status: 'Sufficient',
    },
    {
      item: 'Medical Supplies & Trauma Kits',
      station: 'Maitri Medical Bay',
      currentStock: '420',
      predictedRequirement: '600',
      recommendedAction: '+180',
      status: 'Monitor',
    },
    {
      item: 'Solar Batteries & Inverters',
      station: 'Bharati Power Plant',
      currentStock: '48',
      predictedRequirement: '60',
      recommendedAction: '+12',
      status: 'Sufficient',
    },
  ]

  // 4. Incidents Data
  const incidentsList: IncidentItem[] = [
    {
      id: 'INC-2026-001',
      location: 'Schirmacher Oasis · Route Bravo',
      type: 'Whiteout Storm & Snowcat Stall',
      severity: 'Critical',
      time: '2h ago',
      status: 'SAR Active',
      assignedUnit: 'Maitri SAR Snowcat Unit 02',
      personnelAffected: 4,
    },
    {
      id: 'INC-2026-002',
      location: 'Larsemann Hills · Coastal Sector',
      type: 'Crevasse Hazard on Sea Ice Route',
      severity: 'Warning',
      time: '6h ago',
      status: 'Route Diverted',
      assignedUnit: 'Bharati Recon Team',
      personnelAffected: 0,
    },
    {
      id: 'INC-2026-003',
      location: 'Cape Town Port Logistics',
      type: 'Container AM-327 Delay',
      severity: 'Advisory',
      time: '1d ago',
      status: 'Customs Cleared',
      assignedUnit: 'Logistics Desk Goa',
      personnelAffected: 0,
    },
  ]

  // 5. Operational Alerts Data
  const alerts: OperationalAlert[] = [
    {
      id: 'ALT-OPS-01',
      severity: 'critical',
      title: 'High Wind Advisory',
      message: 'Wind speed expected to exceed 50 kts in next 6 hours.',
      timestamp: '2h ago',
      relatedEntity: 'Maitri Station · Weather Watch',
      acknowledged: false,
    },
    {
      id: 'ALT-OPS-02',
      severity: 'warning',
      title: 'Cargo Delay',
      message: 'Container AM-327 delayed at port due to storm surge.',
      timestamp: '5h ago',
      relatedEntity: 'Cape Town Port Logistics',
      acknowledged: false,
    },
    {
      id: 'ALT-OPS-03',
      severity: 'info',
      title: 'Routine Check',
      message: 'Bharati station generators nominal.',
      timestamp: '1d ago',
      relatedEntity: 'Bharati Base Power Plant',
      acknowledged: false,
    },
  ]

  // Normalize the authenticated roles to the dashboard's existing role views.
  // The authentication layer uses ADMIN / PHC / DOCTOR, while this dashboard
  // was originally written for the older descriptive role names.
  const role: string =
    currentRole === 'ADMIN'
      ? 'Admin'
      : currentRole === 'PHC'
        ? 'Station Officer'
        : currentRole === 'DOCTOR'
          ? 'Emergency Coordinator'
          : 'Admin'

  // Header Title & Subtitle based on Role
  const getHeaderInfo = () => {
    switch (role) {
      case 'Admin':
        return {
          title: 'System Overview',
          greeting: `Good Morning, ${currentUser?.name ?? 'Director'}!`,
          subtitle: 'Comprehensive Operational Health & Strategic Telemetry Matrix · NCPOR Directorate',
        }
      case 'Expedition Coordinator':
      case 'Expedition Manager (NCPOR)':
        return {
          title: 'Expedition Operations',
          greeting: `Good Morning, ${currentUser?.name ?? 'Expedition Coordinator'}!`,
          subtitle: 'Active Mission Traverses, Field Personnel & Operational Timelines',
        }
      case 'Inventory Manager':
        return {
          title: 'Inventory & Demand Forecast',
          greeting: `Good Morning, ${currentUser?.name ?? 'Inventory Manager'}!`,
          subtitle: 'Multi-Station Supply Tracking, Stock Burn Rates & AI Replenishment Forecasting',
        }
      case 'Emergency Coordinator':
        return {
          title: 'Emergency Response',
          greeting: `Good Morning, ${currentUser?.name ?? 'Emergency Coordinator'}!`,
          subtitle: 'Incident Command, SAR Unit Dispatches, Weather Hazards & Crew Safety',
        }
      case 'Logistics Officer':
        return {
          title: 'Cargo & Logistics',
          greeting: `Good Morning, ${currentUser?.name ?? 'Logistics Officer'}!`,
          subtitle: 'Vessel Manifests, In-Transit Containers, Port Customs & Supply Chains',
        }
      case 'Station Officer':
      case 'Station Manager (Maitri)':
        return {
          title: 'Station Operations',
          greeting: `Good Morning, ${currentUser?.name ?? 'Station Officer'}!`,
          subtitle: 'Base Infrastructure, Life Support, Generator Power & Environmental Telemetry',
        }
      default:
        return {
          title: 'System Overview',
          greeting: `Good Morning, ${currentUser?.name ?? 'User'}!`,
          subtitle: 'Real-time insights for a safer, smarter and more sustainable Antarctic mission.',
        }
    }
  }

  const { title, greeting, subtitle } = getHeaderInfo()

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. DASHBOARD HEADER                                       */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-[#2C6A74] dark:text-[#AEE3E0] tracking-wide">
            {greeting}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173B46] dark:text-white tracking-tight leading-tight mt-0.5 font-sans">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-[#466A75] dark:text-[#D0EFEF] font-normal mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl shadow-2xs">
            <Calendar className="w-4 h-4 text-[#447F98] dark:text-[#AEE3E0]" />
            <div className="text-left text-xs font-bold text-[#173B46] dark:text-white leading-tight">
              Monday, 22 September 2026
              <div className="text-[10px] text-[#466A75] dark:text-[#D0EFEF] font-mono font-normal">
                18:31 IST
              </div>
            </div>
          </div>

          {/* Role specific primary CTA */}
          {role === 'Admin' && (
            <button
              type="button"
              onClick={() => navigate('/mission-control')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2C6A74] hover:bg-[#225760] active:bg-[#1A454C] text-white dark:bg-[#FFD21C] dark:hover:bg-[#FFC928] dark:text-[#050708] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-[#AEE3E0] dark:text-[#050708]" />
              <span>Mission Control</span>
            </button>
          )}

          {(role === 'Expedition Coordinator' || role === 'Expedition Manager (NCPOR)') && (
            <button
              type="button"
              onClick={() => navigate('/expeditions')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2C6A74] hover:bg-[#225760] active:bg-[#1A454C] text-white dark:bg-[#FFD21C] dark:hover:bg-[#FFC928] dark:text-[#050708] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Expedition</span>
            </button>
          )}

          {role === 'Inventory Manager' && (
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2C6A74] hover:bg-[#225760] active:bg-[#1A454C] text-white dark:bg-[#FFD21C] dark:hover:bg-[#FFC928] dark:text-[#050708] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              <span>Inventory Ledger</span>
            </button>
          )}

          {role === 'Emergency Coordinator' && (
            <button
              type="button"
              onClick={() => navigate('/emergency')}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white dark:bg-[#FF3038] dark:hover:bg-[#D92027] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Declare Incident</span>
            </button>
          )}

          {role === 'Logistics Officer' && (
            <button
              type="button"
              onClick={() => navigate('/cargo')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2C6A74] hover:bg-[#225760] active:bg-[#1A454C] text-white dark:bg-[#FFD21C] dark:hover:bg-[#FFC928] dark:text-[#050708] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Add Shipment</span>
            </button>
          )}

          {(role === 'Station Officer' || role === 'Station Manager (Maitri)') && (
            <button
              type="button"
              onClick={() => navigate('/weather')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2C6A74] hover:bg-[#225760] active:bg-[#1A454C] text-white dark:bg-[#FFD21C] dark:hover:bg-[#FFC928] dark:text-[#050708] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Radio className="w-4 h-4 text-[#AEE3E0] dark:text-[#050708]" />
              <span>Station Telemetry</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ROLE-TAILORED 6-KPI SUMMARY ROW                        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Render role-specific KPI cards */}
        {role === 'Inventory Manager' ? (
          <>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Total SKUs</span>
                <Boxes className="w-4 h-4 text-[#2C6A74] dark:text-[#AEE3E0]" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">128</div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● 94% Stock Health</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Low Stock Items</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">4</div>
              <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">● Reorder Required</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Critical Fuel Level</span>
                <Zap className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">24,000 <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">L</span></div>
              <div className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 font-semibold">● 20 Days Reserves</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">7-Day AI Demand</span>
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-300 mt-1">96,000 <span className="text-xs font-normal">L</span></div>
              <div className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold">● Model v2.4 (95% Conf)</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Replenishment Req</span>
                <Plus className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">+72,000 <span className="text-xs font-normal">L</span></div>
              <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">● Austral Air Bridge</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Storage Capacity</span>
                <Package className="w-4 h-4 text-[#447F98] dark:text-[#AEE3E0]" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">87%</div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Maitri & Bharati</div>
            </div>
          </>
        ) : role === 'Emergency Coordinator' ? (
          <>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Active Incidents</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">1 <span className="text-xs font-normal">High</span></div>
              <div className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 font-semibold">● SAR Unit Deployed</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Personnel Monitored</span>
                <Users className="w-4 h-4 text-[#2C6A74] dark:text-[#AEE3E0]" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">26</div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● 100% In Radio Comms</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">SAR Units Ready</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">3 / 3</div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Snowcats & Air SAR</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Weather Warnings</span>
                <Wind className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">1 Gale</div>
              <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">● 50 kts Sector 4</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Triage Status</span>
                <ShieldCheck className="w-4 h-4 text-[#447F98] dark:text-[#AEE3E0]" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">Nominal</div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● AIIMS Medbay Clear</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">OPCON State</span>
                <Radio className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">Level 1</div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Ready & Resilient</div>
            </div>
          </>
        ) : role === 'Logistics Officer' ? (
          <>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Cargo in Transit</span>
                <Package className="w-4 h-4 text-[#447F98] dark:text-[#AEE3E0]" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">34 <span className="text-xs font-normal">Containers</span></div>
              <div className="mt-1 text-[10px] text-[#447F98] dark:text-[#AEE3E0] font-semibold">● Enroute Southern Ocean</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Cargo Received</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">18 <span className="text-xs font-normal">Containers</span></div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Verified at Bases</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Delayed Shipments</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">1</div>
              <div className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 font-semibold">● Cape Town Port</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Active Vessel</span>
                <Ship className="w-4 h-4 text-[#2C6A74] dark:text-[#AEE3E0]" />
              </div>
              <div className="text-sm font-extrabold text-[#173B46] dark:text-white mt-2">MV Golovnin</div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● ETA: 28 Nov 2026</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Port Customs</span>
                <Building2 className="w-4 h-4 text-[#5DA9B0] dark:text-[#AEE3E0]" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">100%</div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● MoES Cleared</div>
            </div>
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase font-mono">Air Cargo Airlifts</span>
                <Flag className="w-4 h-4 text-[#447F98] dark:text-[#AEE3E0]" />
              </div>
              <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">2 Sorties</div>
              <div className="mt-1 text-[10px] text-[#447F98] dark:text-[#AEE3E0] font-semibold">● C-17 GlobeMaster</div>
            </div>
          </>
        ) : (
          <>
            {/* Admin / Expedition Coordinator / Station Officer standard high-contrast 6 KPIs */}
            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#5DA9B0] transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#2C6A74] dark:text-[#AEE3E0]">
                  <Flag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase tracking-wider font-mono">
                  Active Expeditions
                </div>
                <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">2</div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5F3F8] dark:border-[#3E808C] text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> On Track
                </span>
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">1 near completion</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#5DA9B0] transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#447F98] dark:text-[#AEE3E0]">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase tracking-wider font-mono">
                  Cargo in Transit
                </div>
                <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
                  34 <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">Containers</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5F3F8] dark:border-[#3E808C] text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-[#447F98] dark:text-[#AEE3E0]">
                  <span className="w-2 h-2 rounded-full bg-[#447F98]" /> Moving
                </span>
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">ETA updates live</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#5DA9B0] transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#5DA9B0] dark:text-[#AEE3E0]">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase tracking-wider font-mono">
                  Inventory Status
                </div>
                <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">87%</div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5F3F8] dark:border-[#3E808C] text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Monitor
                </span>
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">Critical items: 2</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#5DA9B0] transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#2C6A74] dark:text-[#AEE3E0]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase tracking-wider font-mono">
                  Personnel On Ground
                </div>
                <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
                  26 <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">At Stations</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5F3F8] dark:border-[#3E808C] text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> All Safe
                </span>
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">Wintering/Summer</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#5DA9B0] transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#447F98] dark:text-[#AEE3E0]">
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase tracking-wider font-mono">
                  Stations Online
                </div>
                <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
                  2/2 <span className="text-xs font-normal text-[#466A75] dark:text-[#D0EFEF]">Operational</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5F3F8] dark:border-[#3E808C] text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Nominal
                </span>
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">AWS Telemetry</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-rose-400 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#466A75] dark:text-[#D0EFEF] uppercase tracking-wider font-mono">
                  Active Alerts
                </div>
                <div className="text-2xl font-extrabold text-[#173B46] dark:text-white mt-1">
                  3 <span className="text-xs font-normal text-rose-600 dark:text-rose-400">1 High</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5F3F8] dark:border-[#3E808C] text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Action Required
                </span>
                <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">Dispatches</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. MIDDLE SECTION: TAILORED WIDGETS & MAP                 */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (8 Cols): Map or Operational Board */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <div>
              <h2 className="text-sm font-bold text-[#173B46] dark:text-white">
                Antarctica Map & Stations
              </h2>
              <div className="flex items-center gap-3 text-xs mt-1 font-mono">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-[#D0EFEF]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-[#D0EFEF]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Limited
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-[#D0EFEF]">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Offline
                </span>
              </div>
            </div>

            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline bg-[#E5F3F8] dark:bg-[#1F4A57] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span>View Full Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Map Graphic Canvas & Telemetry Sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-4 items-center">
            {/* Map Visual Container with high-definition Antarctica background & live radar overlay */}
            <div className="md:col-span-8 relative h-72 sm:h-80 bg-[#E2F1F8] dark:bg-[#173B46]/60 rounded-xl overflow-hidden border border-[#B9D9E1] dark:border-[#3E808C] flex items-center justify-center group shadow-inner">
              <img
                src="/images/antarctica_map.jpg"
                alt="Antarctica Polar Map"
                className="absolute inset-0 w-full h-full object-cover mix-blend-multiply dark:mix-blend-luminosity opacity-95 pointer-events-none transition-transform duration-700 group-hover:scale-105"
              />

              {/* Polar Coordinate Grid & Orbital Radar Rings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" fill="none">
                <circle cx="200" cy="150" r="135" stroke="#5DA9B0" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <circle cx="200" cy="150" r="95" stroke="#447F98" strokeWidth="0.8" opacity="0.5" />
                <circle cx="200" cy="150" r="55" stroke="#5DA9B0" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.4" />
                <line x1="200" y1="15" x2="200" y2="285" stroke="#5DA9B0" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
                <line x1="50" y1="150" x2="350" y2="150" stroke="#5DA9B0" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
                <circle cx="200" cy="15" r="2.5" fill="#447F98" />
                <circle cx="200" cy="285" r="2.5" fill="#447F98" />
                <circle cx="50" cy="150" r="2.5" fill="#447F98" />
                <circle cx="350" cy="150" r="2.5" fill="#447F98" />
              </svg>

              {/* Interactive Station Markers */}
              <div
                onClick={() => navigate('/weather')}
                className="absolute top-[26%] left-[53%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 cursor-pointer z-20 group/pin"
                title="Maitri Station (70°45'S, 11°44'E) - Operational"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
                </div>
                <span className="text-xs font-extrabold text-[#173B46] dark:text-white bg-white/90 dark:bg-[#173B46]/90 px-1.5 py-0.5 rounded shadow-xs border border-[#B9D9E1] dark:border-[#3E808C] backdrop-blur-xs font-sans tracking-tight">
                  Maitri
                </span>
              </div>

              <div
                onClick={() => navigate('/weather')}
                className="absolute top-[50%] left-[81%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 cursor-pointer z-20 group/pin"
                title="Bharati Station (69°24'S, 76°11'E) - Operational"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
                </div>
                <span className="text-xs font-extrabold text-[#173B46] dark:text-white bg-white/90 dark:bg-[#173B46]/90 px-1.5 py-0.5 rounded shadow-xs border border-[#B9D9E1] dark:border-[#3E808C] backdrop-blur-xs font-sans tracking-tight">
                  Bharati
                </span>
              </div>

              <div
                className="absolute top-[70%] left-[52%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20"
                title="International Polar Network & Relays"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#629BB5] border border-white dark:border-[#173B46] shadow-xs" />
                <span className="text-[11px] font-bold text-[#466A75] dark:text-[#D0EFEF] bg-white/80 dark:bg-[#173B46]/80 px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs">
                  Other Stations
                </span>
              </div>
            </div>

            {/* Telemetry Sidebar Details inside Map Card */}
            <div className="md:col-span-4 space-y-2.5">
              <div className="p-3 bg-[#E5F3F8] dark:bg-[#1F4A57] rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#2C6A74] flex items-center justify-center text-[#2C6A74] dark:text-[#AEE3E0] shadow-2xs">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#173B46] dark:text-white">2</div>
                  <div className="text-[11px] text-[#466A75] dark:text-[#D0EFEF]">Stations Operational</div>
                </div>
              </div>

              <div className="p-3 bg-[#E5F3F8] dark:bg-[#1F4A57] rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#2C6A74] flex items-center justify-center text-[#2C6A74] dark:text-[#AEE3E0] shadow-2xs">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#173B46] dark:text-white font-mono">-18.4°C</div>
                  <div className="text-[11px] text-[#466A75] dark:text-[#D0EFEF]">Maitri (Current)</div>
                </div>
              </div>

              <div className="p-3 bg-[#E5F3F8] dark:bg-[#1F4A57] rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#2C6A74] flex items-center justify-center text-[#2C6A74] dark:text-[#AEE3E0] shadow-2xs">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#173B46] dark:text-white font-mono">34 kts SE</div>
                  <div className="text-[11px] text-[#466A75] dark:text-[#D0EFEF]">Wind Speed</div>
                </div>
              </div>

              <div className="p-3 bg-[#E5F3F8] dark:bg-[#1F4A57] rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#2C6A74] flex items-center justify-center text-[#2C6A74] dark:text-[#AEE3E0] shadow-2xs">
                  <Radio className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#173B46] dark:text-white font-mono">IRIDIUM SBD 352 kbps</div>
                  <div className="text-[10px] text-[#466A75] dark:text-[#D0EFEF]">Last sync: 5 min ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right (4 Cols): Current Weather & Alerts */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Card 1: Current Weather - Maitri Station */}
          <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
              <h2 className="text-xs font-bold text-[#173B46] dark:text-white uppercase tracking-wider font-mono">
                Current Weather – Maitri Station
              </h2>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-[#1F4A57] px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="w-10 h-10 text-amber-500" />
                <div>
                  <div className="text-3xl font-extrabold text-[#173B46] dark:text-white font-mono">
                    -18.4°C
                  </div>
                  <div className="text-xs text-[#466A75] dark:text-[#D0EFEF] font-medium">
                    Clear Sky
                  </div>
                </div>
              </div>

              {/* 4 Mini Weather Stats */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="flex items-center gap-1.5 text-xs text-[#173B46] dark:text-white">
                  <Wind className="w-3.5 h-3.5 text-[#447F98] dark:text-[#AEE3E0]" />
                  <span className="font-bold font-mono text-[11px]">34 kts SE</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#173B46] dark:text-white">
                  <Droplets className="w-3.5 h-3.5 text-[#5DA9B0] dark:text-[#AEE3E0]" />
                  <span className="font-bold font-mono text-[11px]">62% Hum</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#173B46] dark:text-white">
                  <Gauge className="w-3.5 h-3.5 text-[#447F98] dark:text-[#AEE3E0]" />
                  <span className="font-bold font-mono text-[11px]">1012 hPa</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#173B46] dark:text-white">
                  <Eye className="w-3.5 h-3.5 text-[#5DA9B0] dark:text-[#AEE3E0]" />
                  <span className="font-bold font-mono text-[11px]">10 km Vis</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5F3F8] dark:border-[#3E808C] text-right">
              <Link
                to="/weather"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline"
              >
                <span>View Detailed Weather</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Recent Alerts */}
          <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
              <h2 className="text-xs font-bold text-[#173B46] dark:text-white uppercase tracking-wider font-mono">
                Recent Alerts
              </h2>
              <Link
                to="/alerts"
                className="text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-3 space-y-2.5 divide-y divide-[#E5F3F8] dark:divide-[#3E808C]/50">
              {alerts.map((alert) => (
                <div key={alert.id} className="pt-2.5 first:pt-0 flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {alert.severity === 'critical' && (
                      <div className="w-5 h-5 rounded bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {alert.severity === 'warning' && (
                      <div className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {alert.severity === 'info' && (
                      <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[#447F98] dark:text-[#AEE3E0]">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#173B46] dark:text-white truncate">
                        {alert.title}
                      </div>
                      <span className="text-[10px] text-[#466A75] dark:text-[#D0EFEF] font-mono">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#466A75] dark:text-[#D0EFEF] leading-tight mt-0.5">
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM SECTION: ACTIVE EXPEDITIONS & INVENTORY INSIGHTS*/}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Table: Active Expeditions */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <h2 className="text-sm font-bold text-[#173B46] dark:text-white">
              Active Expeditions & Traverses
            </h2>
            <Link
              to="/expeditions"
              className="text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E5F3F8] dark:border-[#3E808C] text-[11px] font-mono text-[#466A75] dark:text-[#D0EFEF] uppercase">
                  <th className="py-2.5 px-2">Expedition</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Progress</th>
                  <th className="py-2.5 px-2 text-right">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5F3F8] dark:divide-[#3E808C]/50">
                {expeditions.map((exp) => (
                  <tr
                    key={exp.id}
                    onClick={() => setSelectedExpedition(exp)}
                    className="hover:bg-[#E5F3F8]/50 dark:hover:bg-[#1F4A57]/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-2 font-bold text-[#173B46] dark:text-white">
                      {exp.name}
                    </td>
                    <td className="py-3 px-2 text-[#466A75] dark:text-[#D0EFEF]">
                      {exp.type}
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-[#D6EBF3] dark:bg-[#173B46] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#447F98] dark:bg-[#5DA9B0] rounded-full"
                            style={{ width: `${exp.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-[#173B46] dark:text-white">
                          {exp.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-[11px] text-[#466A75] dark:text-[#D0EFEF]">
                      {exp.expectedReturn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table / Widget: Inventory Insights (AI-Powered) or Role Specific */}
        <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5F3F8] dark:border-[#3E808C]">
            <h2 className="text-sm font-bold text-[#173B46] dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
              Inventory & AI Replenishment Forecast
            </h2>
            <Link
              to="/inventory"
              className="text-xs font-bold text-[#2C6A74] dark:text-[#AEE3E0] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E5F3F8] dark:border-[#3E808C] text-[11px] font-mono text-[#466A75] dark:text-[#D0EFEF] uppercase">
                  <th className="py-2.5 px-2">Item</th>
                  <th className="py-2.5 px-2">Current Stock</th>
                  <th className="py-2.5 px-2">AI 7-Day Req</th>
                  <th className="py-2.5 px-2">Action</th>
                  <th className="py-2.5 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5F3F8] dark:divide-[#3E808C]/50">
                {inventoryInsights.map((item, idx) => (
                  <tr
                    key={idx}
                    onClick={() => navigate('/inventory')}
                    className="hover:bg-[#E5F3F8]/50 dark:hover:bg-[#1F4A57]/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-2 font-bold text-[#173B46] dark:text-white">
                      {item.item}
                    </td>
                    <td className="py-3 px-2 font-mono text-[#173B46] dark:text-white">
                      {item.currentStock}
                    </td>
                    <td className="py-3 px-2 font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
                      {item.predictedRequirement}
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-[#2C6A74] dark:text-[#AEE3E0]">
                      {item.recommendedAction}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase ${
                          item.status === 'Reorder Soon'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                            : item.status === 'Sufficient'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-[#2C6A74] dark:bg-[#1F4A57] dark:text-[#AEE3E0]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'Reorder Soon'
                              ? 'bg-amber-500'
                              : item.status === 'Sufficient'
                              ? 'bg-emerald-500'
                              : 'bg-[#5DA9B0]'
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Decision Support Verification Footer */}
          <div className="mt-3 pt-2.5 border-t border-[#E5F3F8] dark:border-[#3E808C] flex items-center justify-between text-[11px] text-[#466A75] dark:text-[#D0EFEF]">
            <span className="italic">
              *Model: NCPOR-Demand-Predictor-v2.4 (Human review mandatory).
            </span>
            {aiVerified ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                <Check className="w-3.5 h-3.5" /> Reviewed & Confirmed
              </span>
            ) : (
              <Button
                variant="outline"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setAiVerified(true)
                }}
                iconLeft={<Check className="w-3 h-3" />}
              >
                Verify Forecast
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* INSPECTION MODAL: Expedition Details */}
      {selectedExpedition && (
        <Modal
          isOpen={!!selectedExpedition}
          onClose={() => setSelectedExpedition(null)}
          title={`Expedition Details: ${selectedExpedition.id}`}
          description={selectedExpedition.name}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = selectedExpedition.id
                  setSelectedExpedition(null)
                  navigate(`/expeditions/${id}`)
                }}
                iconRight={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open Full Campaign Dossier
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedExpedition(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-3 font-sans text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-[#1F4A57] border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg">
              <div>
                <span className="text-[#466A75] dark:text-[#D0EFEF] text-[11px]">Expedition Leader</span>
                <div className="font-semibold text-[#173B46] dark:text-white mt-0.5">{selectedExpedition.leader}</div>
              </div>
              <div>
                <span className="text-[#466A75] dark:text-[#D0EFEF] text-[11px]">Operational Stations</span>
                <div className="font-semibold text-[#173B46] dark:text-white mt-0.5">{selectedExpedition.station}</div>
              </div>
              <div>
                <span className="text-[#466A75] dark:text-[#D0EFEF] text-[11px]">Total Personnel</span>
                <div className="font-semibold text-[#173B46] dark:text-white mt-0.5 font-mono">
                  {selectedExpedition.personnelCount} Wintering / Summer Staff
                </div>
              </div>
              <div>
                <span className="text-[#466A75] dark:text-[#D0EFEF] text-[11px]">Mission Timeline</span>
                <div className="font-semibold text-[#173B46] dark:text-white mt-0.5 font-mono">
                  {selectedExpedition.departure} → {selectedExpedition.expectedReturn}
                </div>
              </div>
            </div>
            <p className="text-[#466A75] dark:text-[#D0EFEF] leading-relaxed">
              Approved under NCPOR Antarctic Annual Plan. All deployed scientists and technical personnel are AIIMS medical clearance certified and have completed polar survival drills at ITBP Auli.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}

