import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useOperational, type UserRole } from '@/context/OperationalContext'
import { LoginPage } from '@/pages/LoginPage'
import { MapPage } from '@/pages/MapPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { MissionControlPage } from '@/pages/MissionControlPage'
import { ExpeditionsPage } from '@/pages/ExpeditionsPage'
import { ExpeditionDetailPage } from '@/pages/ExpeditionDetailPage'
import { CargoPage } from '@/pages/CargoPage'
import { CargoDetailPage } from '@/pages/CargoDetailPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { InventoryDetailPage } from '@/pages/InventoryDetailPage'
import { PersonnelPage } from '@/pages/PersonnelPage'
import { PersonnelDetailPage } from '@/pages/PersonnelDetailPage'
import { EmergencyPage } from '@/pages/EmergencyPage'
import { EmergencyDetailPage } from '@/pages/EmergencyDetailPage'
import { WeatherPage } from '@/pages/WeatherPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { ReportsPage } from '@/pages/ReportsPage'

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useOperational()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <AppShell />
}

const RoleProtected: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { currentRole } = useOperational()
  return allowedRoles.includes(currentRole) ? <>{children}</> : <Navigate to="/dashboard" replace />
}

const ADMIN_ONLY: UserRole[] = ['ADMIN']
const PHC_ACCESS: UserRole[] = ['ADMIN', 'PHC']
const DOCTOR_ACCESS: UserRole[] = ['ADMIN', 'PHC', 'DOCTOR']

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'map',
        element: <MapPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'mission-control',
        element: <RoleProtected allowedRoles={ADMIN_ONLY}><MissionControlPage /></RoleProtected>,
      },
      {
        path: 'expeditions',
        element: <RoleProtected allowedRoles={PHC_ACCESS}><ExpeditionsPage /></RoleProtected>,
      },
      {
        path: 'expeditions/:id',
        element: <RoleProtected allowedRoles={PHC_ACCESS}><ExpeditionDetailPage /></RoleProtected>,
      },
      {
        path: 'cargo',
        element: <RoleProtected allowedRoles={ADMIN_ONLY}><CargoPage /></RoleProtected>,
      },
      {
        path: 'cargo/:id',
        element: <RoleProtected allowedRoles={ADMIN_ONLY}><CargoDetailPage /></RoleProtected>,
      },
      {
        path: 'inventory',
        element: <RoleProtected allowedRoles={DOCTOR_ACCESS}><InventoryPage /></RoleProtected>,
      },
      {
        path: 'inventory/:id',
        element: <RoleProtected allowedRoles={DOCTOR_ACCESS}><InventoryDetailPage /></RoleProtected>,
      },
      {
        path: 'personnel',
        element: <RoleProtected allowedRoles={DOCTOR_ACCESS}><PersonnelPage /></RoleProtected>,
      },
      {
        path: 'personnel/:id',
        element: <RoleProtected allowedRoles={DOCTOR_ACCESS}><PersonnelDetailPage /></RoleProtected>,
      },
      {
        path: 'emergency',
        element: <RoleProtected allowedRoles={DOCTOR_ACCESS}><EmergencyPage /></RoleProtected>,
      },
      {
        path: 'emergency/:id',
        element: <RoleProtected allowedRoles={DOCTOR_ACCESS}><EmergencyDetailPage /></RoleProtected>,
      },
      {
        path: 'weather',
        element: <WeatherPage />,
      },
      {
        path: 'alerts',
        element: <AlertsPage />,
      },
      {
        path: 'reports',
        element: <RoleProtected allowedRoles={PHC_ACCESS}><ReportsPage /></RoleProtected>,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
])
