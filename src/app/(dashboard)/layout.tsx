'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AuthUser } from '@/types'
import { AuthContext, useAuthState } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Car, Shield, Video, Camera,
  AlertTriangle, FileText, Settings, LogOut, Menu, X,
  UserCircle, Moon, Sun, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: null },
  { href: '/guards', label: 'Guard Management', icon: Shield, key: 'guard_attendance' },
  { href: '/parking', label: 'Parking', icon: Car, key: 'parking_system' },
  { href: '/setup', label: 'Setup Management', icon: Settings, key: 'setup_management' },
  { href: '/surveillance', label: 'Surveillance', icon: Video, key: 'surveillance_logs' },
  { href: '/cctv', label: 'CCTV Audit', icon: Camera, key: 'cctv_audit' },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle, key: 'incident_reports' },
  { href: '/reports', label: 'Reports', icon: FileText, key: 'reports' },
  { href: '/users', label: 'User Management', icon: Users, key: '__admin' },
]

function canAccess(user: AuthUser | null, key: string | null): boolean {
  if (!user) return false
  if (key === null) return true
  if (user.role === 'admin') return true
  if (key === '__admin') return false
  if (!user.permissions) return false
  return user.permissions[key as keyof typeof user.permissions] === true
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authState = useAuthState()
  const { user, loading, logout } = authState
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    const isDark = saved === 'true'
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

function toggleDark() {
  const next = !darkMode
  setDarkMode(next)
  localStorage.setItem('darkMode', String(next))
  document.documentElement.classList.toggle('dark', next)
}
  async function handleLogout() {
    await logout()
    toast.success('Logged out successfully')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const visibleNav = NAV_ITEMS.filter(item => canAccess(user, item.key))

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Security System</p>
          <p className="text-xs text-gray-500 truncate">{user.name}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleNav.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn('sidebar-link', active && 'active')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <Link href="/profile" onClick={() => setSidebarOpen(false)} className="sidebar-link">
          <UserCircle className="w-4 h-4" />
          <span>Profile</span>
        </Link>
        <button onClick={toggleDark} className="sidebar-link w-full">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:text-red-600">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )

  return (
    <AuthContext.Provider value={authState}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col w-60 flex-shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-64 z-50">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile top bar */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Security</span>
            </div>
            <button onClick={toggleDark} className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  )
}