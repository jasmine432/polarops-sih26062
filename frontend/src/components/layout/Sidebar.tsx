import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Compass,
  Map,
  Package,
  Boxes,
  Users,
  ShieldAlert,
  CloudSnow,
  Bell,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Radio,
  X,
  Anchor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOperational, isAuthorizedForMissionControl, type UserRole } from '@/context/OperationalContext'

interface NavItem {
  name: string
  path: string
  icon: React.ElementType
  badge?: string | number
  badgeVariant?: 'critical' | 'warning' | 'neutral'
}

interface NavSection {
  title: string
  items: NavItem[]
}

export const Sidebar: React.FC = () => {
  const {
    currentRole,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    unreadAlertCount,
  } = useOperational()
  const location = useLocation()

  const isAdmin = isAuthorizedForMissionControl(currentRole)

  // Determine allowed paths for each role based on institutional RBAC specifications
  const getAllowedPathsForRole = (role: UserRole): string[] => {
    switch (role) {
      case 'ADMIN':
        return [
          '/dashboard',
          '/mission-control',
          '/map',
          '/expeditions',
          '/cargo',
          '/inventory',
          '/personnel',
          '/weather',
          '/emergency',
          '/alerts',
          '/reports',
        ]
      case 'PHC':
        return ['/dashboard', '/map', '/expeditions', '/inventory', '/personnel', '/weather', '/alerts', '/reports']
      case 'DOCTOR':
        return ['/dashboard', '/map', '/personnel', '/inventory', '/weather', '/emergency', '/alerts']
      default:
        return [
          '/dashboard',
          '/mission-control',
          '/map',
          '/expeditions',
          '/cargo',
          '/inventory',
          '/personnel',
          '/weather',
          '/emergency',
          '/alerts',
          '/reports',
        ]
    }
  }

  const allowedPaths = getAllowedPathsForRole(currentRole)

  const rawNavSections: NavSection[] = [
    {
      title: 'OPERATIONAL LOGISTICS',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        ...(isAdmin ? [{ name: 'Mission Control', path: '/mission-control', icon: ShieldAlert }] : []),
        { name: 'Expedition Map', path: '/map', icon: Map },
        { name: 'Expeditions', path: '/expeditions', icon: Compass },
        { name: 'Cargo & Logistics', path: '/cargo', icon: Package },
        { name: 'Inventory', path: '/inventory', icon: Boxes },
        { name: 'Personnel', path: '/personnel', icon: Users },
      ],
    },
    {
      title: 'MISSION SAFETY',
      items: [
        { name: 'Stations & Weather', path: '/weather', icon: CloudSnow },
        {
          name: 'Emergency Response',
          path: '/emergency',
          icon: ShieldAlert,
        },
        {
          name: 'Alerts',
          path: '/alerts',
          icon: Bell,
          badge: unreadAlertCount > 0 ? unreadAlertCount : 3,
          badgeVariant: 'critical',
        },
      ],
    },
    {
      title: 'COMPLIANCE & AUDIT',
      items: [
        { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
      ],
    },
  ]

  // Filter sections and items based on role permissions
  const navSections: NavSection[] = rawNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowedPaths.includes(item.path)),
    }))
    .filter((section) => section.items.length > 0)

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#2C6A74] dark:bg-[#070B0D] text-white select-none border-r border-[#1F545D] dark:border-[#263238] transition-colors duration-200">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1F545D]/80 dark:border-[#263238] shrink-0 bg-[#255D67] dark:bg-[#070B0D]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#1F545D] dark:bg-[#11191D] border border-[#5DA9B0]/40 dark:border-[#263238] flex items-center justify-center text-white shrink-0 shadow-xs">
            {/* Mission Polar mountain / anchor icon */}
            <svg className="w-5 h-5 text-[#AEE3E0] dark:text-[#F5F7F8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 transition-opacity duration-200">
              <div className="flex items-center gap-0.5">
                <span className="font-bold text-base tracking-tight text-white dark:text-[#F5F7F8] font-sans">
                  Polar
                </span>
                <span className="font-bold text-base tracking-tight text-[#AEE3E0] dark:text-[#FFD21C] font-sans">
                  Ops
                </span>
              </div>
              <p className="text-[10px] text-[#D0EFEF] dark:text-[#CBD5E1] truncate leading-tight font-normal">
                Expedition Operations Platform
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-1.5 text-[#D0EFEF] dark:text-[#CBD5E1] hover:text-white rounded hover:bg-[#1F545D] dark:hover:bg-[#11191D] cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-3">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!sidebarCollapsed && (
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#AEE3E0] dark:text-[#94A3B8] px-3 pt-1 pb-0.5 font-mono select-none">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={({ isActive: active }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group relative',
                        active
                          ? 'bg-[#447F98] dark:bg-[#11191D] text-white dark:text-[#F8FAFC] shadow-xs font-semibold dark:border-l-4 dark:border-l-[#FFD21C] dark:rounded-r-lg dark:rounded-l-none'
                          : 'text-[#D0EFEF] dark:text-[#CBD5E1] hover:bg-[#447F98]/40 dark:hover:bg-[#11191D] hover:text-white dark:hover:text-[#F8FAFC]'
                      )
                    }
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-white dark:text-[#FFD21C]' : 'text-[#D0EFEF] dark:text-[#CBD5E1] group-hover:text-white dark:group-hover:text-[#F8FAFC]'
                      )}
                    />
                    {!sidebarCollapsed && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}

                    {!sidebarCollapsed && item.badge && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 dark:bg-[#FF3038] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Antarctica Radar Illustration & Quote */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-[#1F545D]/80 dark:border-[#263238] bg-[#255D67]/30 dark:bg-[#070B0D] relative overflow-hidden shrink-0">
          <div className="relative z-10 space-y-2">
            {/* Subtle yellow marker line */}
            <div className="w-6 h-0.5 bg-[#FFD21C] hidden dark:block mb-1" />

            {/* Subtle polar radar circle with Antarctica continent outline */}
            <div className="w-28 h-28 relative opacity-85 dark:opacity-30">
              <svg className="w-full h-full text-[#AEE3E0] dark:text-[#94A3B8]" viewBox="0 0 120 120" fill="none">
                {/* Concentric Polar Grid Rings */}
                <circle cx="60" cy="60" r="55" stroke="#5DA9B0" className="dark:stroke-[#263238]" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
                <circle cx="60" cy="60" r="38" stroke="#447F98" className="dark:stroke-[#263238]" strokeWidth="0.75" opacity="0.5" />
                <circle cx="60" cy="60" r="22" stroke="#5DA9B0" className="dark:stroke-[#263238]" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.4" />
                
                {/* Radial Crosshairs */}
                <line x1="60" y1="5" x2="60" y2="115" stroke="#5DA9B0" className="dark:stroke-[#263238]" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.4" />
                <line x1="5" y1="60" x2="115" y2="60" stroke="#5DA9B0" className="dark:stroke-[#263238]" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.4" />

                {/* Polar Coordinate Nodes */}
                <circle cx="60" cy="5" r="2" fill="#AEE3E0" className="dark:fill-[#CBD5E1]" />
                <circle cx="60" cy="115" r="2" fill="#AEE3E0" className="dark:fill-[#CBD5E1]" />
                <circle cx="5" cy="60" r="2" fill="#AEE3E0" className="dark:fill-[#CBD5E1]" />
                <circle cx="115" cy="60" r="2" fill="#AEE3E0" className="dark:fill-[#CBD5E1]" />

                {/* Antarctica Continent Silhouette */}
                <path
                  d="M 55 42 C 68 38, 80 44, 86 54 C 92 64, 88 76, 78 82 C 68 88, 52 86, 44 80 C 34 74, 30 64, 32 56 C 34 50, 42 46, 50 44 Z"
                  fill="#AEE3E0"
                  className="dark:fill-[#263238]"
                  opacity="0.85"
                />
                {/* Antarctic Peninsula Extension */}
                <path
                  d="M 44 48 C 38 40, 34 32, 37 30 C 40 28, 43 36, 47 44 Z"
                  fill="#AEE3E0"
                  className="dark:fill-[#263238]"
                  opacity="0.85"
                />

                {/* Live Station Indicators */}
                <circle cx="58" cy="46" r="2" fill="#18A96B" className="dark:fill-[#16C784]" />
                <circle cx="78" cy="62" r="2" fill="#18A96B" className="dark:fill-[#16C784]" />
              </svg>
            </div>
            <p className="text-xs uppercase tracking-wider text-[#D0EFEF] dark:text-[#CBD5E1] font-semibold leading-tight select-none">
              EXPLORING<br />A SAFER<br />TOMORROW.
            </p>
          </div>
        </div>
      )}

      {/* Collapse toggle button */}
      <div className="p-2 border-t border-[#1F545D] dark:border-[#263238] bg-[#1F545D]/60 dark:bg-[#070B0D] flex items-center justify-between">
        {!sidebarCollapsed && (
          <span className="text-[10px] text-[#D0EFEF] dark:text-[#94A3B8] px-2 font-mono">PolarOps v1.2.0</span>
        )}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 text-[#D0EFEF] dark:text-[#CBD5E1] hover:text-white rounded hover:bg-[#447F98]/50 dark:hover:bg-[#11191D] transition-colors ml-auto cursor-pointer"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed top-0 bottom-0 left-0 z-30 transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 ease-in-out lg:hidden shadow-2xl',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
