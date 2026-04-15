'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import {
  Shield, Car, Camera, AlertTriangle, Settings,
  CheckCircle, Video
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalGuards: number
  presentToday: number
  currentlyParked: number
  cameraWorking: number
  cameraTotal: number
  activeSetups: number
  todayIncidents: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      const [guards, attendance, parking, cameras, setups, incidents] = await Promise.all([
        supabase.from('guards').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('attendance').select('id', { count: 'exact' }).eq('date', today).eq('status', 'present'),
        supabase.from('parking_records').select('id', { count: 'exact' }).is('exit_time', null),
        supabase.from('cctv_cameras').select('id, status'),
        supabase.from('setups').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('incidents').select('id', { count: 'exact' }).gte('incident_datetime', today + 'T00:00:00'),
      ])

      const cameraData = cameras.data ?? []
      const working = cameraData.filter(c => c.status === 'working').length

      setStats({
        totalGuards: guards.count ?? 0,
        presentToday: attendance.count ?? 0,
        currentlyParked: parking.count ?? 0,
        cameraWorking: working,
        cameraTotal: cameraData.length,
        activeSetups: setups.count ?? 0,
        todayIncidents: incidents.count ?? 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const cameraPercent = stats && stats.cameraTotal > 0
    ? Math.round((stats.cameraWorking / stats.cameraTotal) * 100)
    : 0

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const cards = stats ? [
    {
      title: 'Guards on Duty',
      value: stats.totalGuards,
      sub: `${stats.presentToday} present today`,
      icon: Shield,
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/guards',
    },
    {
      title: 'Parked Vehicles',
      value: stats.currentlyParked,
      sub: 'Currently inside',
      icon: Car,
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600 dark:text-green-400',
      href: '/parking',
    },
    {
      title: 'Camera Status',
      value: `${cameraPercent}%`,
      sub: `${stats.cameraWorking} of ${stats.cameraTotal} working`,
      icon: Camera,
      iconBg: cameraPercent >= 80 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40',
      iconColor: cameraPercent >= 80 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      href: '/cctv',
    },
    {
      title: 'Active Setups',
      value: stats.activeSetups,
      sub: 'Currently active',
      icon: Settings,
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      href: '/setup',
    },
    {
      title: "Today's Incidents",
      value: stats.todayIncidents,
      sub: formatDate(new Date().toISOString()),
      icon: AlertTriangle,
      iconBg: stats.todayIncidents > 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-gray-100 dark:bg-gray-800',
      iconColor: stats.todayIncidents > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400',
      href: '/incidents',
    },
  ] : []

  const quickActions = [
    { label: 'Log Attendance', href: '/guards/attendance', icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
    { label: 'Vehicle Entry', href: '/parking', icon: Car, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'New Incident', href: '/incidents', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
    { label: 'Surveillance Log', href: '/surveillance', icon: Video, color: 'text-purple-600 dark:text-purple-400' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {formatDate(new Date().toISOString(), 'EEEE, dd MMMM yyyy')}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <Link key={card.title} href={card.href}>
                <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className={`inline-flex p-2 rounded-lg mb-3 ${card.iconBg}`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">
                    {card.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {card.sub}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="card-body grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-center group"
              >
                <Icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {action.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}