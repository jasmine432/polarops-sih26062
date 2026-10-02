import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronRight,
  Menu,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOperational } from '@/context/OperationalContext'
import { Badge } from '@/components/ui/Badge'

export const Header: React.FC = () => {
  const {
    currentRole,
    currentUser,
    logout,
    sidebarCollapsed,
    setMobileSidebarOpen,
    setSearchModalOpen,
    unreadAlertCount,
    theme,
    toggleTheme,
  } = useOperational()

  const location = useLocation()
  const navigate = useNavigate()
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleLogout = () => {
    setRoleMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-20 bg-[#2C6A74] dark:bg-[#070B0D] text-white border-b border-[#1F545D] dark:border-[#263238] transition-all duration-200 shadow-sm',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      )}
    >
      {/* Main Header Bar */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Search bar */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 text-[#D0EFEF] dark:text-[#CBD5E1] hover:text-white rounded-lg border border-[#3E808C] dark:border-[#263238] hover:bg-[#1F545D] dark:hover:bg-[#11191D] transition-colors cursor-pointer"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Search bar matching reference */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full max-w-md flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#D0EFEF] dark:text-[#CBD5E1] bg-[#1F545D] dark:bg-[#0D1316] hover:bg-[#1A4B54] dark:hover:bg-[#11191D] hover:text-white dark:hover:text-[#F8FAFC] border border-[#3E808C]/70 dark:border-[#263238] rounded-lg shadow-2xs transition-colors text-left cursor-pointer"
            title="Search expeditions, stations, cargo, personnel... (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#AEE3E0] dark:text-[#F8FAFC] shrink-0" />
            <span className="truncate">Search expeditions, stations, cargo, personnel...</span>
          </button>
        </div>

        {/* Right Actions: Theme Toggle + Season Chip + Station Chip + Alerts + User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 text-xs">
          {/* Theme Toggle (☀️ / 🌙) styled like capsule control */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1F545D] dark:bg-[#0D1316] hover:bg-[#1A4B54] dark:hover:bg-[#11191D] border border-[#3E808C]/70 dark:border-[#263238] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-[#FFD21C]" />
                  <span className="w-3 h-3 rounded-full bg-[#FFD21C]" />
                  <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span className="w-3 h-3 rounded-full bg-white" />
                </div>
              )}
            </button>
          </div>

          {/* Mission Season Chip */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1F545D]/60 dark:bg-[#0D1316] border border-[#3E808C]/50 dark:border-[#263238]">
            <svg className="w-4 h-4 text-white dark:text-[#F8FAFC] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
            </svg>
            <div className="text-left leading-tight">
              <div className="font-bold text-white dark:text-[#F8FAFC] text-[11px]">44th ISEA</div>
              <div className="text-[10px] text-[#D0EFEF] dark:text-[#CBD5E1]">2026–27 | Active Season</div>
            </div>
          </div>

          {/* Live Station Weather Chip */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1F545D]/60 dark:bg-[#0D1316] border border-[#3E808C]/50 dark:border-[#263238]">
            <MapPin className="w-3.5 h-3.5 text-[#AEE3E0] dark:text-[#F8FAFC] shrink-0" />
            <div className="text-left leading-tight">
              <div className="font-bold text-white dark:text-[#F8FAFC] text-[11px]">Maitri Station</div>
              <div className="text-[10px] text-[#D0EFEF] dark:text-[#CBD5E1] font-mono">-18.4°C | Clear</div>
            </div>
          </div>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-[#D0EFEF] dark:text-[#F8FAFC] hover:text-white bg-[#1F545D] dark:bg-[#0D1316] hover:bg-[#1A4B54] dark:hover:bg-[#11191D] rounded-lg border border-[#3E808C]/70 dark:border-[#263238] transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 dark:bg-[#FF3038] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadAlertCount > 0 ? unreadAlertCount : 3}
              </span>
            </button>

            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-80 sm:w-88 bg-white dark:bg-[#0D1316] text-slate-800 dark:text-[#F8FAFC] rounded-xl border border-slate-200 dark:border-[#263238] shadow-2xl overflow-hidden font-sans animate-in fade-in duration-100">
                  <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#101619] border-b border-slate-200 dark:border-[#263238] flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                      Operational Dispatch Notices
                    </span>
                    <Badge variant="critical" size="sm">
                      3 Active
                    </Badge>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-[#263238] text-xs max-h-72 overflow-y-auto">
                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-[#11191D] transition-colors">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#CBD5E1] mb-1">
                        <span className="font-bold text-rose-600 dark:text-[#FF3038] uppercase">
                          High Wind Advisory
                        </span>
                        <span>2h ago</span>
                      </div>
                      <p className="text-slate-800 dark:text-[#CBD5E1] leading-snug">
                        Wind speed expected to exceed 50 kts across Schirmacher Oasis in next 6 hours.
                      </p>
                    </div>
                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-[#11191D] transition-colors">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#CBD5E1] mb-1">
                        <span className="font-bold text-amber-600 dark:text-[#FFD21C] uppercase">
                          Cargo Delay
                        </span>
                        <span>5h ago</span>
                      </div>
                      <p className="text-slate-800 dark:text-[#CBD5E1] leading-snug">
                        Container AM-327 delayed at port due to storm surge conditions.
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-[#101619] border-t border-slate-200 dark:border-[#263238] text-center">
                    <Link
                      to="/alerts"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-semibold text-[#2C6A74] dark:text-[#28B6FF] hover:underline"
                    >
                      View All Alerts & Warnings →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile / Persona Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-[#1F545D] dark:bg-[#0D1316] hover:bg-[#1A4B54] dark:hover:bg-[#11191D] border border-[#3E808C]/70 dark:border-[#263238] rounded-lg shadow-2xs transition-colors cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full bg-[#5DA9B0] dark:bg-[#11191D] border border-[#AEE3E0] dark:border-[#263238] flex items-center justify-center text-white dark:text-[#F8FAFC] shrink-0 font-bold text-xs shadow-xs">
                {currentUser?.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-bold text-white dark:text-[#F8FAFC]">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] text-[#D0EFEF] dark:text-[#CBD5E1] font-normal">
                  {currentRole}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#AEE3E0] dark:text-[#CBD5E1]" />
            </button>

            {roleMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-64 bg-white dark:bg-[#0D1316] text-slate-800 dark:text-[#F8FAFC] rounded-xl border border-slate-200 dark:border-[#263238] shadow-2xl py-1 font-sans text-xs animate-in fade-in duration-100">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-[#263238] bg-slate-50 dark:bg-[#101619]">
                    <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">{currentUser?.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#CBD5E1] font-mono mt-0.5">{currentUser?.id} · {currentRole}</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#CBD5E1] mt-0.5">{currentUser?.station}</div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-[#263238] mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-rose-600 dark:text-[#FF3038] hover:bg-rose-50 dark:hover:bg-[#11191D] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
