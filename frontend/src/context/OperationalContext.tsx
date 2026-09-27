import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  clearSession,
  getStoredSession,
  saveSession,
  type AuthenticatedUser,
  type AuthSession,
  type UserRole,
} from '@/services/authService'

export type { AuthenticatedUser as UserProfile, UserRole } from '@/services/authService'

export const isAuthorizedForMissionControl = (role: UserRole): boolean => {
  return role === 'ADMIN'
}

export type OpconLevel =
  | 'OPCON 3 - NORMAL OPERATIONS'
  | 'OPCON 2 - ELEVATED READINESS'
  | 'OPCON 1 - CRITICAL / EMERGENCY'
  | 'OPCON 1 - NORMAL'
  | 'OPCON 2 - CAUTION'
  | 'OPCON 3 - CRITICAL ALERT'

export type AppTheme = 'light' | 'dark'

export interface OperationalContextType {
  isAuthenticated: boolean
  currentUser: AuthenticatedUser | null
  login: (session: AuthSession) => void
  logout: () => void
  currentRole: UserRole
  opconLevel: OpconLevel
  setOpconLevel: (level: OpconLevel) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  searchModalOpen: boolean
  setSearchModalOpen: (open: boolean) => void
  unreadAlertCount: number
  decrementAlertCount: () => void
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void
}

const OperationalContext = createContext<OperationalContextType | undefined>(undefined)

export const OperationalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  const isAuthenticated = session !== null
  const currentUser = session?.user ?? null
  const currentRole: UserRole = currentUser?.role ?? 'ADMIN'

  const [opconLevel, setOpconLevel] = useState<OpconLevel>('OPCON 3 - NORMAL OPERATIONS')
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false)
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false)
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(3)

  // Initialize theme from localStorage ('polarops-theme')
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const savedTheme = localStorage.getItem('polarops-theme')
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme
      }
    } catch {
      // ignore
    }
    return 'light'
  })

  // Synchronize <html> class with theme
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('polarops-theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  const login = (newSession: AuthSession) => {
    saveSession(newSession)
    setSession(newSession)
  }

  const logout = () => {
    clearSession()
    setSession(null)
  }

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const decrementAlertCount = () => {
    setUnreadAlertCount((prev) => Math.max(0, prev - 1))
  }

  return (
    <OperationalContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        currentRole,
        opconLevel,
        setOpconLevel,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        searchModalOpen,
        setSearchModalOpen,
        unreadAlertCount,
        decrementAlertCount,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </OperationalContext.Provider>
  )
}

export const useOperational = () => {
  const context = useContext(OperationalContext)
  if (!context) {
    throw new Error('useOperational must be used within an OperationalProvider')
  }
  return context
}
