import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Anchor,
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  ShieldCheck,
  BarChart3,
  Users,
  Share2,
  Building2,
  Sun,
  Moon,
  Lock as LockIcon,
  ChevronDown,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'
import { useOperational } from '@/context/OperationalContext'
import { authenticate, type UserRole } from '@/services/authService'
import { cn } from '@/lib/utils'

interface DemoUser {
  name: string
  id: string
  email: string
  role: UserRole
  displayRole: string
  station: string
}

const DEMO_USERS: DemoUser[] = [
  {
    name: 'Dr. Rajesh Sharma',
    id: 'NCPOR-DIR-4401',
    email: 'r.sharma@ncpor.gov.in',
    role: 'ADMIN',
    displayRole: 'Expedition Director (Goa)',
    station: 'Headquarters · Goa',
  },
  {
    name: 'Dr. Ananya Rao',
    id: 'NCPOR-PHC-210',
    email: 'a.rao@ncpor.gov.in',
    role: 'PHC',
    displayRole: 'Health Officer (Maitri)',
    station: 'Polar Health Centre · Maitri',
  },
  {
    name: 'Dr. Vivek Menon',
    id: 'NCPOR-DOC-317',
    email: 'v.menon@maitri.aq',
    role: 'DOCTOR',
    displayRole: 'Station Physician (Maitri)',
    station: 'Maitri Station · Schirmacher Oasis',
  },
]

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, theme, toggleTheme } = useOperational()

  const [identifier, setIdentifier] = useState(DEMO_USERS[0].email)
  const [password, setPassword] = useState('PolarOps2026!')
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitted, setForgotSubmitted] = useState(false)

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    const demo = DEMO_USERS.find((u) => u.role === role)
    if (demo) {
      setIdentifier(demo.email)
      setPassword('PolarOps2026!')
      setErrorMessage(null)
    }
  }

  const handleQuickDemoSelect = (user: DemoUser) => {
    setSelectedRole(user.role)
    setIdentifier(user.email)
    setPassword('PolarOps2026!')
    setErrorMessage(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Email Address or Employee ID.')
      return
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password or security token.')
      return
    }

    setIsLoading(true)

    try {
      const session = await authenticate(identifier.trim(), password)
      login(session)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotSubmitted(true)
    setTimeout(() => {
      setShowForgotModal(false)
      setForgotSubmitted(false)
      setForgotEmail('')
    }, 2000)
  }

  return (
    <div className="min-h-screen w-full bg-[#D6EBF3]/60 dark:bg-[#173B46] text-[#173B46] dark:text-[#FFFFFF] font-sans flex flex-col justify-between relative overflow-hidden select-none antialiased transition-colors duration-200">
      {/* ========================================================= */}
      {/* TOP HEADER: THEME TOGGLE & SSL ENCRYPTION BADGE           */}
      {/* ========================================================= */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          {/* Top Logo for mobile view */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2C6A74] flex items-center justify-center text-white shadow-xs">
              <Anchor className="w-5 h-5 text-[#AEE3E0]" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight tracking-tight">
                <span className="text-[#173B46] dark:text-white">Polar</span>
                <span className="text-[#447F98] dark:text-[#AEE3E0]">Ops</span>
              </div>
              <p className="text-[10px] text-[#466A75] dark:text-[#D0EFEF] font-medium">Expedition Operations Platform</p>
            </div>
          </div>
        </div>

        {/* Top Right Utilities */}
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#466A75] dark:text-[#D0EFEF] hover:text-[#173B46] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1F4A57] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-[#AEE3E0]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>
          <span className="text-[#B9D9E1] dark:text-[#3E808C] font-light">|</span>
          <div className="flex items-center gap-1.5 text-xs text-[#466A75] dark:text-[#D0EFEF] font-medium">
            <div className="w-4 h-4 rounded-sm bg-emerald-500 flex items-center justify-center text-white">
              <LockIcon className="w-2.5 h-2.5" />
            </div>
            <span className="text-[11px] text-[#466A75] dark:text-[#D0EFEF] font-medium">SSL Encrypted</span>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER: LEFT INFO & RIGHT LOGIN CARD             */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-12 py-4 sm:py-8 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 z-20 relative">
        {/* ========================================================= */}
        {/* BACKGROUND RADAR & ANTARCTICA GRAPHIC                     */}
        {/* ========================================================= */}
        <div className="absolute left-1/2 lg:left-[42%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none select-none z-0 opacity-80">
          <svg className="w-full h-full text-[#B9D9E1]" viewBox="0 0 600 600" fill="none">
            {/* Concentric orbital rings */}
            <circle cx="280" cy="320" r="100" stroke="#5DA9B0" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="280" cy="320" r="160" stroke="#447F98" strokeWidth="1" opacity="0.5" />
            <circle cx="280" cy="320" r="220" stroke="#5DA9B0" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <circle cx="280" cy="320" r="280" stroke="#447F98" strokeWidth="0.75" opacity="0.3" />

            {/* Orbit Node Dots */}
            <circle cx="280" cy="160" r="3.5" fill="#447F98" />
            <circle cx="440" cy="320" r="3.5" fill="#447F98" />
            <circle cx="390" cy="210" r="3" fill="#447F98" />
            <circle cx="120" cy="320" r="3" fill="#447F98" />
            <circle cx="280" cy="540" r="2.5" fill="#447F98" />
            <circle cx="200" cy="460" r="3.5" fill="#447F98" />
            <circle cx="420" cy="400" r="2.5" fill="#447F98" />

            {/* Antarctica Continent Silhouette */}
            <path
              d="M 285 240 C 330 230, 370 250, 395 285 C 420 320, 415 365, 385 400 C 350 435, 290 445, 245 425 C 200 405, 175 365, 170 330 C 165 300, 140 280, 150 255 C 160 230, 195 245, 225 235 C 245 228, 265 245, 285 240 Z"
              fill="#B9D9E1"
              opacity="0.9"
            />
            {/* Antarctic Peninsula extension */}
            <path
              d="M 210 240 C 185 210, 170 185, 180 175 C 190 165, 205 190, 220 220 Z"
              fill="#B9D9E1"
              opacity="0.9"
            />

            {/* Station Central Coordinates Marker */}
            <circle cx="280" cy="320" r="16" fill="#447F98" fillOpacity="0.15" />
            <circle cx="280" cy="320" r="8" fill="#447F98" />
            <circle cx="280" cy="320" r="3" fill="#FFFFFF" />
          </svg>
        </div>

        {/* ========================================================= */}
        {/* LEFT COLUMN: BRANDING, VALUE PROPS & PILLARS              */}
        {/* ========================================================= */}
        <section className="w-full lg:w-[48%] space-y-7 z-10">
          {/* Logo & Platform Name */}
          <div className="hidden lg:flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#2C6A74] dark:bg-[#1F4A57] border border-[#5DA9B0]/40 flex items-center justify-center text-white shadow-sm">
              <Anchor className="w-6 h-6 text-[#AEE3E0]" />
            </div>
            <div>
              <div className="font-bold text-2xl tracking-tight leading-none">
                <span className="text-[#173B46] dark:text-white">Polar</span>
                <span className="text-[#447F98] dark:text-[#AEE3E0]">Ops</span>
              </div>
              <p className="text-xs text-[#466A75] dark:text-[#D0EFEF] font-medium mt-1">Expedition Operations Platform</p>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#173B46] dark:text-[#FFFFFF] leading-[1.15]">
              Smarter Operations <br />
              for a <span className="text-[#2C6A74] dark:text-[#AEE3E0]">Safer Tomorrow.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#466A75] dark:text-[#D0EFEF] leading-relaxed max-w-lg font-normal">
              Integrated logistics, real-time telemetry, and AI-powered insights for India's Antarctic missions.
            </p>
          </div>

          {/* 4 Feature Items */}
          <div className="space-y-4 pt-1">
            {/* 1. Data-Driven Decisions */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#2C6A74] dark:text-[#AEE3E0] flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#173B46] dark:text-[#FFFFFF]">Data-Driven Decisions</div>
                <div className="text-xs text-[#466A75] dark:text-[#D0EFEF]">Real-time insights for better planning</div>
              </div>
            </div>

            {/* 2. Safer Expeditions */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#2C6A74] dark:text-[#AEE3E0] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#173B46] dark:text-[#FFFFFF]">Safer Expeditions</div>
                <div className="text-xs text-[#466A75] dark:text-[#D0EFEF]">Proactive monitoring and alerts</div>
              </div>
            </div>

            {/* 3. Unified Operations */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#2C6A74] dark:text-[#AEE3E0] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#173B46] dark:text-[#FFFFFF]">Unified Operations</div>
                <div className="text-xs text-[#466A75] dark:text-[#D0EFEF]">Expeditions, cargo, personnel and more</div>
              </div>
            </div>

            {/* 4. Sustainable Missions */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#2C6A74] dark:text-[#AEE3E0] flex items-center justify-center shrink-0 mt-0.5">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#173B46] dark:text-[#FFFFFF]">Sustainable Missions</div>
                <div className="text-xs text-[#466A75] dark:text-[#D0EFEF]">Efficient resource management</div>
              </div>
            </div>
          </div>

          {/* Quote at Bottom-Left */}
          <div className="pt-3">
            <div className="w-7 h-[3px] bg-[#2C6A74] dark:bg-[#AEE3E0] rounded-full mb-2.5" />
            <p className="text-sm italic text-[#466A75] dark:text-[#D0EFEF] font-medium leading-snug">
              &ldquo;Science today.<br />A safer tomorrow.&rdquo;
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: FLOATING LOGIN CARD & DEMO USERS            */}
        {/* ========================================================= */}
        <section className="w-full lg:w-[48%] max-w-[500px] z-10">
          <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl shadow-[0_12px_40px_-10px_rgba(44,106,116,0.12)] p-6 sm:p-8 space-y-5">
            {/* Card Header */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#447F98] dark:text-[#AEE3E0] font-mono">
                SECURE ACCESS GATEWAY
              </span>
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#173B46] dark:text-white tracking-tight">
                Welcome to <span className="text-[#2C6A74] dark:text-[#AEE3E0]">PolarOps</span>
              </h2>
              <p className="text-xs text-[#466A75] dark:text-[#D0EFEF] font-normal">
                Enter your official credentials or select an operational role to continue.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign-In Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* 1. Operational Role */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#173B46] dark:text-white">
                  Operational Role / Station Profile
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#466A75] dark:text-[#D0EFEF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedRole}
                    onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                    className="w-full pl-9 pr-9 py-2.5 bg-[#E5F3F8]/40 dark:bg-[#1F4A57] border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg text-xs text-[#173B46] dark:text-white font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-[#2C6A74]/20 focus:border-[#2C6A74] focus:bg-white dark:focus:bg-[#1F4A57] transition-colors cursor-pointer"
                  >
                    <option value="ADMIN">
                      Administrator (System Overview & Mission Control)
                    </option>
                    <option value="PHC">
                      Health Officer (Polar Health Centre · Maitri)
                    </option>
                    <option value="DOCTOR">
                      Station Physician (Maitri Station)
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#466A75] dark:text-[#D0EFEF] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 2. Email Address / Employee ID */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#173B46] dark:text-white">
                  Email Address or Employee ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#466A75] dark:text-[#D0EFEF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value)
                      setErrorMessage(null)
                    }}
                    placeholder="r.sharma@ncpor.gov.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#E5F3F8]/40 dark:bg-[#1F4A57] border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg text-xs text-[#173B46] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2C6A74]/20 focus:border-[#2C6A74] focus:bg-white dark:focus:bg-[#1F4A57] transition-colors font-sans"
                  />
                </div>
              </div>

              {/* 3. Password / Security Token */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#173B46] dark:text-white">
                    Password or Security Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-[#2C6A74] dark:text-[#AEE3E0] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#466A75] dark:text-[#D0EFEF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrorMessage(null)
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#E5F3F8]/40 dark:bg-[#1F4A57] border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg text-xs text-[#173B46] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2C6A74]/20 focus:border-[#2C6A74] focus:bg-white dark:focus:bg-[#1F4A57] transition-colors font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 text-[#466A75] dark:text-[#D0EFEF] hover:text-[#173B46] dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 rounded transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#466A75] dark:text-[#D0EFEF]" />}
                  </button>
                </div>
              </div>

              {/* 4. Trust device & Node ID */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#B9D9E1] text-[#2C6A74] focus:ring-[#2C6A74] accent-[#2C6A74]"
                  />
                  <span className="text-xs text-[#466A75] dark:text-[#D0EFEF] font-normal">
                    Trust this device for 30 days
                  </span>
                </label>
                <span className="text-[11px] font-mono text-[#466A75] dark:text-[#D0EFEF] font-medium">Node: IN-60A-OP-01</span>
              </div>

              {/* 5. Authorize Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-11 px-4 bg-[#2C6A74] hover:bg-[#225760] active:bg-[#1A454C] text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs hover:shadow-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authorizing Session...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize & Access Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* 6. OR SIGN IN AS A DEMO USER Separator */}
            <div className="relative flex items-center justify-center pt-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#B9D9E1] dark:border-[#3E808C]" />
              </div>
              <span className="relative px-3 bg-white dark:bg-[#2C6A74] text-[10px] font-bold font-mono uppercase tracking-wider text-[#466A75] dark:text-[#D0EFEF]">
                OR SIGN IN AS A DEMO USER
              </span>
            </div>

            {/* 7. Demo User Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              {DEMO_USERS.map((user) => {
                const isSelected = selectedRole === user.role && identifier === user.email
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickDemoSelect(user)}
                    className={cn(
                      'text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group cursor-pointer',
                      isSelected
                        ? 'bg-[#E5F3F8] dark:bg-[#1F4A57] border-[#2C6A74] dark:border-[#AEE3E0] shadow-2xs'
                        : 'bg-white dark:bg-[#2C6A74]/70 border-[#B9D9E1] dark:border-[#3E808C] hover:border-[#5DA9B0] hover:bg-[#E5F3F8]/50 dark:hover:bg-[#1F4A57]'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-[#E5F3F8] dark:bg-[#1F4A57] text-[#2C6A74] dark:text-[#AEE3E0] flex items-center justify-center shrink-0">
                        {user.role === 'ADMIN' ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : user.role === 'PHC' ? (
                          <User className="w-3.5 h-3.5" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#173B46] dark:text-white truncate">{user.name}</div>
                        <div className="text-[10px] text-[#466A75] dark:text-[#D0EFEF] truncate">{user.displayRole}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#2C6A74] dark:text-[#AEE3E0] shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ml-1.5" />
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* FOOTER: ABOUT, PRIVACY, SUPPORT, VERSION                  */}
      {/* ========================================================= */}
      <footer className="w-full px-6 sm:px-12 py-5 flex items-center justify-end z-20 text-xs text-[#466A75] dark:text-[#D0EFEF]">
        <div className="flex items-center gap-4 text-xs font-normal">
          <a href="#about" onClick={(e) => e.preventDefault()} className="hover:text-[#173B46] dark:hover:text-white transition-colors">
            About PolarOps
          </a>
          <span className="text-[#B9D9E1] dark:text-[#3E808C]">|</span>
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#173B46] dark:hover:text-white transition-colors">
            Privacy Policy
          </a>
          <span className="text-[#B9D9E1] dark:text-[#3E808C]">|</span>
          <a href="#support" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }} className="hover:text-[#173B46] dark:hover:text-white transition-colors">
            Support
          </a>
          <span className="text-[#B9D9E1] dark:text-[#3E808C]">|</span>
          <span className="text-[#466A75] dark:text-[#D0EFEF] font-mono">v1.0.0</span>
        </div>
      </footer>

      {/* Forgot Password / Access Reset Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#2C6A74] border border-[#B9D9E1] dark:border-[#3E808C] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#173B46] dark:text-white">
                  Expedition Access Recovery
                </h3>
                <p className="text-xs text-[#466A75] dark:text-[#D0EFEF] leading-relaxed font-normal">
                  Request a secondary mission security passcode via your verified NCPOR / MoES directory email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false)
                  setForgotSubmitted(false)
                }}
                className="p-1 text-[#466A75] dark:text-[#D0EFEF] hover:text-[#173B46] dark:hover:text-white rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Reset Instructions Dispatched
                </div>
                <p className="text-emerald-800 dark:text-emerald-400 text-[11px] leading-relaxed">
                  If an active personnel record exists for this identity, a secure token has been sent to the designated mailbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label htmlFor="recovery-email" className="block text-xs font-semibold text-[#173B46] dark:text-white">
                    Official NCPOR / Station Email
                  </label>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. officer@ncpor.gov.in"
                    className="w-full px-3 py-2 bg-[#E5F3F8]/40 dark:bg-[#1F4A57] border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg text-xs text-[#173B46] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2C6A74]/20 focus:border-[#2C6A74] focus:bg-white dark:focus:bg-[#1F4A57] font-sans"
                  />
                </div>

                <div className="p-3 bg-[#E5F3F8]/40 dark:bg-[#1F4A57]/60 border border-[#B9D9E1] dark:border-[#3E808C] rounded-lg text-[11px] text-[#466A75] dark:text-[#D0EFEF] leading-normal">
                  <strong className="text-[#173B46] dark:text-white">Station In-Field Personnel:</strong> For emergency field overrides or satellite token re-keying at Maitri or Bharati stations, contact the Joint Polar Operations Center (JPOC) emergency radio watch.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-[#B9D9E1] dark:border-[#3E808C] text-xs text-[#466A75] dark:text-[#D0EFEF] hover:bg-[#E5F3F8] dark:hover:bg-[#1F4A57] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#2C6A74] text-white text-xs hover:bg-[#225760] font-semibold cursor-pointer shadow-xs"
                  >
                    Dispatch Reset Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
