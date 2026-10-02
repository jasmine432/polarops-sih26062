import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Modal } from '@/components/ui/Modal'
import { useOperational } from '@/context/OperationalContext'
import { Search, Compass, Package, Users, ShieldAlert, CloudSnow, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

import { PolarOpsAssistant } from '@/components/chat/PolarOpsAssistant'

export const AppShell: React.FC = () => {
  const { sidebarCollapsed, searchModalOpen, setSearchModalOpen } = useOperational()
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchModalOpen])

  const quickLinks = [
    { title: 'Expedition Map & Weather', path: '/map', icon: Compass, desc: 'Real-time Antarctic map & active cargo telemetry' },
    { title: 'Expeditions', path: '/expeditions', icon: Compass, desc: 'Active 44th ISEA and Arctic missions' },
    { title: 'Cargo Manifests', path: '/cargo', icon: Package, desc: 'MV Vasily Golovnin cargo & TEU manifests' },
    { title: 'Station Inventory', path: '/inventory', icon: Package, desc: 'Jet A-1 fuel reserves & life support' },
    { title: 'Wintering Personnel', path: '/personnel', icon: Users, desc: 'Scientist and logistics officer rosters' },
    { title: 'Emergency / SAR', path: '/emergency', icon: ShieldAlert, desc: 'MEDEVAC coordinates & whiteout lock' },
    { title: 'Weather & Telemetry', path: '/weather', icon: CloudSnow, desc: 'Maitri and Bharati live met stations' },
  ]

  const filteredLinks = quickLinks.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectRoute = (path: string) => {
    setSearchModalOpen(false)
    setSearchQuery('')
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-[#D6EBF3] dark:bg-[#050708] polar-grid-texture flex flex-col font-sans antialiased text-[#173B46] dark:text-[#F5F7F8] transition-colors duration-200 overflow-x-hidden min-w-0 max-w-full">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-200 min-w-0 max-w-full overflow-x-hidden',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        {/* Sticky Top Header */}
        <Header />

        {/* Content Outlet */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-28 sm:pb-8 max-w-[1680px] w-full mx-auto min-w-0">
          <Outlet />
        </main>

        {/* Subtle Operational Footer Marker matching reference */}
        <footer className="py-2.5 px-6 sm:px-8 border-t border-transparent dark:border-[#1B2529]/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-[#94A3B8] font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="hidden dark:inline-block w-2.5 h-0.5 bg-[#FFD21C]" />
            <span>POLAR OPERATIONS PLATFORM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden dark:inline-block w-2.5 h-0.5 bg-[#FFD21C]" />
            <span className="tracking-wider uppercase">FOR A SAFER, MORE RESILIENT TOMORROW</span>
          </div>
        </footer>
      </div>

      {/* Global Command / Quick Search Modal */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Expedition Operations Command Bar"
        description="Search containers, personnel, stations, or navigate modules"
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#CBD5E1] absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a station name, container ID (e.g. TEU-9402), or personnel..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0A0E10] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FFD21C]/30 focus:border-[#FFD21C] focus:bg-white dark:focus:bg-[#0A0E10] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#94A3B8] tracking-wider px-1 font-mono">
              Modules & Quick Jump
            </div>
            <div className="divide-y divide-slate-100 dark:divide-[#263238] max-h-60 overflow-y-auto">
              {filteredLinks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-[#94A3B8]">
                  No matching operational modules found.
                </div>
              ) : (
                filteredLinks.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleSelectRoute(item.path)}
                      className="w-full px-2.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#11191D] rounded-md transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-md bg-[#02457A]/10 dark:bg-[#11191D] text-[#02457A] dark:text-[#FFD21C] group-hover:bg-[#02457A] group-hover:text-white dark:group-hover:bg-[#FFD21C] dark:group-hover:text-[#050708] transition-colors border border-transparent dark:border-[#263238]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#CBD5E1] font-normal">{item.desc}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8] group-hover:text-[#018ABE] dark:group-hover:text-[#FFD21C] shrink-0 transition-colors" />
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#263238] flex items-center justify-between text-[11px] text-slate-400 dark:text-[#94A3B8]">
            <span>Press ESC to close</span>
            <span className="font-mono">NCPOR Operational Search v1.2</span>
          </div>
        </div>
      </Modal>

      {/* Grounded In-App Operational AI Assistant */}
      <PolarOpsAssistant />
    </div>
  )
}
