'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Guard, Attendance } from '@/types'
import { format } from 'date-fns'
import { formatDateTime } from '@/lib/utils'
import {
  Calendar, ChevronLeft, ChevronRight, Loader2, Save,
  Clock, UserCheck, UserX, Coffee, FileText, Search,
  Plus, Pencil, X, CheckCircle, BarChart2
} from 'lucide-react'
import toast from 'react-hot-toast'

type AttendanceStatus = 'present' | 'absent' | 'day_off' | 'leave' | 'sick_leave' | 'on_job_training' | 'training' | 'holiday'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; activeColor: string }> = {
  present:         { label: 'Present',         color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400', activeColor: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 ring-1 ring-green-500' },
  absent:          { label: 'Absent',          color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400', activeColor: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 ring-1 ring-red-500' },
  day_off:         { label: 'Day Off',         color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400', activeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500' },
  leave:           { label: 'Leave',           color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400', activeColor: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500' },
  sick_leave:      { label: 'Sick Leave',      color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400', activeColor: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 ring-1 ring-orange-500' },
  on_job_training: { label: 'On-Job Training', color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400', activeColor: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 ring-1 ring-purple-500' },
  training:        { label: 'Training',        color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400', activeColor: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500' },
  holiday:         { label: 'Holiday',         color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400', activeColor: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 ring-1 ring-teal-500' },
}

export default function AttendancePage() {
  const [guards, setGuards] = useState<Guard[]>([])
  const [attendance, setAttendance] = useState<Record<string, Partial<Attendance>>>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'daily' | 'manual' | 'history' | 'summary'>('daily')
  const [checkoutGuardId, setCheckoutGuardId] = useState<string | null>(null)

  const [manualForm, setManualForm] = useState({
    guard_id: '', date: '', status: 'present' as AttendanceStatus,
    shift: 'day', location: '', remarks: '', check_in_time: '', check_out_time: ''
  })
  const [savingManual, setSavingManual] = useState(false)

  const [history, setHistory] = useState<(Attendance & { guard?: Guard })[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyGuard, setHistoryGuard] = useState('')
  const [historyMonth, setHistoryMonth] = useState(format(new Date(), 'yyyy-MM'))

  const [summary, setSummary] = useState<{ guard: Guard; stats: Record<string, number>; total: number }[]>([])
  const [summaryMonth, setSummaryMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [summaryLoading, setSummaryLoading] = useState(false)

  async function fetchData() {
    setLoading(true)
    const supabase = createClient()
    const [guardsRes, attendanceRes] = await Promise.all([
      supabase.from('guards').select('*').eq('status', 'active').order('name'),
      supabase.from('attendance').select('*').eq('date', date),
    ])
    setGuards(guardsRes.data ?? [])
    const attMap: Record<string, Partial<Attendance>> = {}
    for (const a of attendanceRes.data ?? []) attMap[a.guard_id] = a
    setAttendance(attMap)
    setLoading(false)
  }

  async function fetchHistory() {
    setHistoryLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('attendance')
      .select('*, guards(name, id_number)')
      .gte('date', historyMonth + '-01')
      .lte('date', historyMonth + '-31')
      .order('date', { ascending: false })
    if (historyGuard) query = query.eq('guard_id', historyGuard)
    const { data } = await query
    setHistory((data as any) ?? [])
    setHistoryLoading(false)
  }

  async function fetchSummary() {
    setSummaryLoading(true)
    const supabase = createClient()
    const [guardsRes, attRes] = await Promise.all([
      supabase.from('guards').select('*').eq('status', 'active').order('name'),
      supabase.from('attendance')
        .select('guard_id, status')
        .gte('date', summaryMonth + '-01')
        .lte('date', summaryMonth + '-31'),
    ])
    const allGuards: Guard[] = guardsRes.data ?? []
    const records: { guard_id: string; status: string }[] = attRes.data ?? []
    const built = allGuards.map(g => {
      const mine = records.filter(r => r.guard_id === g.id)
      const stats: Record<string, number> = {}
      for (const r of mine) stats[r.status] = (stats[r.status] ?? 0) + 1
      return { guard: g, stats, total: mine.length }
    })
    setSummary(built)
    setSummaryLoading(false)
  }

  useEffect(() => { fetchData() }, [date])
  useEffect(() => { if (tab === 'history') fetchHistory() }, [tab, historyMonth, historyGuard])
  useEffect(() => { if (tab === 'summary') fetchSummary() }, [tab, summaryMonth])

  function updateField(guardId: string, field: string, value: string) {
    setAttendance(prev => ({
      ...prev,
      [guardId]: { ...prev[guardId], guard_id: guardId, date, [field]: value },
    }))
  }

  async function saveAttendance() {
    setSaving(true)
    const supabase = createClient()
    const records = Object.values(attendance).filter(a => a.status)
    if (records.length === 0) { toast.error('Mark at least one guard'); setSaving(false); return }
    const upserts = records.map(a => ({
      guard_id: a.guard_id!,
      date,
      status: a.status!,
      shift: a.shift ?? 'day',
      location: a.location ?? null,
      remarks: a.remarks ?? null,
      check_in_time: a.check_in_time ?? null,
      check_out_time: a.check_out_time ?? null,
    }))
    const { error } = await supabase.from('attendance').upsert(upserts, { onConflict: 'guard_id,date' })
    if (error) toast.error('Failed to save')
    else toast.success(`Saved ${upserts.length} record(s)`)
    setSaving(false)
  }

  async function checkOut(guardId: string) {
    const supabase = createClient()
    const now = new Date().toISOString()
    const existing = attendance[guardId]
    if (!existing?.id) { toast.error('Save attendance first before checking out'); return }
    const { error } = await supabase
      .from('attendance')
      .update({ check_out_time: now })
      .eq('id', existing.id)
    if (error) toast.error('Failed to check out')
    else {
      toast.success('Checked out')
      setAttendance(prev => ({ ...prev, [guardId]: { ...prev[guardId], check_out_time: now } }))
      setCheckoutGuardId(null)
    }
  }

  async function saveManual() {
    if (!manualForm.guard_id || !manualForm.date || !manualForm.status) {
      toast.error('Guard, date and status are required')
      return
    }
    setSavingManual(true)
    const supabase = createClient()
    const payload: any = {
      guard_id: manualForm.guard_id,
      date: manualForm.date,
      status: manualForm.status,
      shift: manualForm.shift,
      location: manualForm.location || null,
      remarks: manualForm.remarks || null,
      check_in_time: manualForm.check_in_time ? new Date(manualForm.date + 'T' + manualForm.check_in_time).toISOString() : null,
      check_out_time: manualForm.check_out_time ? new Date(manualForm.date + 'T' + manualForm.check_out_time).toISOString() : null,
    }
    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'guard_id,date' })
    if (error) toast.error('Failed to save')
    else {
      toast.success('Manual attendance saved')
      setManualForm({ guard_id: '', date: '', status: 'present', shift: 'day', location: '', remarks: '', check_in_time: '', check_out_time: '' })
    }
    setSavingManual(false)
  }

  const filtered = guards.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  const todayStats = {
    present: Object.values(attendance).filter(a => a.status === 'present').length,
    absent:  Object.values(attendance).filter(a => a.status === 'absent').length,
    leave:   Object.values(attendance).filter(a => ['leave', 'sick_leave'].includes(a.status ?? '')).length,
    dayOff:  Object.values(attendance).filter(a => a.status === 'day_off').length,
  }

  function changeDate(days: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().split('T')[0])
  }

  function getStatusSelectClass(status: string | undefined) {
    if (!status) return ''
    const map: Record<string, string> = {
      present:         'ring-1 ring-green-500 text-green-700 dark:text-green-400',
      absent:          'ring-1 ring-red-500 text-red-700 dark:text-red-400',
      day_off:         'ring-1 ring-blue-500 text-blue-700 dark:text-blue-400',
      leave:           'ring-1 ring-yellow-500 text-yellow-700 dark:text-yellow-400',
      sick_leave:      'ring-1 ring-orange-500 text-orange-700 dark:text-orange-400',
      on_job_training: 'ring-1 ring-purple-500 text-purple-700 dark:text-purple-400',
      training:        'ring-1 ring-indigo-500 text-indigo-700 dark:text-indigo-400',
      holiday:         'ring-1 ring-teal-500 text-teal-700 dark:text-teal-400',
    }
    return map[status] ?? ''
  }

  function getHistoryBadgeClass(status: string) {
    const map: Record<string, string> = {
      present:         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      absent:          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      day_off:         'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      leave:           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      sick_leave:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      on_job_training: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      training:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      holiday:         'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    }
    return map[status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Records kept for 2 months</p>
        </div>
        {tab === 'daily' && (
          <button onClick={saveAttendance} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5 w-fit flex-wrap">
        {[
          { key: 'daily',   label: 'Daily Entry',      icon: Calendar   },
          { key: 'manual',  label: 'Manual Entry',     icon: Plus       },
          { key: 'history', label: 'History',          icon: FileText   },
          { key: 'summary', label: 'Monthly Summary',  icon: BarChart2  },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Daily Entry Tab ── */}
      {tab === 'daily' && (
        <>
          <div className="card mb-4 p-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => changeDate(-1)} className="btn-secondary p-2">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
              </div>
              <button onClick={() => changeDate(1)} className="btn-secondary p-2">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setDate(new Date().toISOString().split('T')[0])} className="btn-secondary">
                Today
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Present', count: todayStats.present, color: 'text-green-600 dark:text-green-400' },
                { label: 'Absent',  count: todayStats.absent,  color: 'text-red-600 dark:text-red-400'   },
                { label: 'Leave',   count: todayStats.leave,   color: 'text-yellow-600 dark:text-yellow-400' },
                { label: 'Day Off', count: todayStats.dayOff,  color: 'text-blue-600 dark:text-blue-400' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={`text-xl font-bold ${s.color}`}>{s.count}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-3 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search guard..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(guard => {
                const att = attendance[guard.id] ?? {}
                const checkedIn  = !!att.check_in_time
                const checkedOut = !!att.check_out_time

                return (
                  <div key={guard.id} className={`card p-4 border-l-4 ${
                    att.status === 'present'         ? 'border-l-green-500' :
                    att.status === 'absent'          ? 'border-l-red-500'   :
                    att.status === 'day_off'         ? 'border-l-blue-500'  :
                    att.status === 'leave'           ? 'border-l-yellow-500':
                    att.status === 'sick_leave'      ? 'border-l-orange-500':
                    att.status === 'on_job_training' ? 'border-l-purple-500':
                    att.status === 'training'        ? 'border-l-indigo-500':
                    att.status === 'holiday'         ? 'border-l-teal-500'  :
                    'border-l-transparent'
                  }`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{guard.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{guard.id_number ?? 'No ID'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {att.status === 'present' && (
                            <>
                              {checkedIn && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  In: {format(new Date(att.check_in_time!), 'HH:mm')}
                                </span>
                              )}
                              {checkedOut && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  Out: {format(new Date(att.check_out_time!), 'HH:mm')}
                                </span>
                              )}
                              {!checkedOut && att.id && (
                                <button
                                  onClick={() => setCheckoutGuardId(guard.id)}
                                  className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-lg font-medium"
                                >
                                  Check Out
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Status dropdown */}
                        <select
                          value={att.status ?? ''}
                          onChange={e => updateField(guard.id, 'status', e.target.value)}
                          className={`text-sm py-1.5 font-medium col-span-2 sm:col-span-1 ${getStatusSelectClass(att.status)}`}
                        >
                          <option value="">— Mark status —</option>
                          {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                          ))}
                        </select>

                        <select
                          value={att.shift ?? 'day'}
                          onChange={e => updateField(guard.id, 'shift', e.target.value)}
                          className="text-sm py-1.5"
                        >
                          <option value="day">Day Shift</option>
                          <option value="night">Night Shift</option>
                        </select>

                        <input
                          placeholder="Location"
                          value={att.location ?? ''}
                          onChange={e => updateField(guard.id, 'location', e.target.value)}
                          className="text-sm py-1.5"
                        />

                        <input
                          type="time"
                          title="Check-in time"
                          value={att.check_in_time ? format(new Date(att.check_in_time), 'HH:mm') : ''}
                          onChange={e => {
                            const val = e.target.value
                            if (val) {
                              const dt = new Date(date + 'T' + val)
                              updateField(guard.id, 'check_in_time', dt.toISOString())
                            }
                          }}
                          className="text-sm py-1.5"
                        />

                        <input
                          placeholder="Remarks"
                          value={att.remarks ?? ''}
                          onChange={e => updateField(guard.id, 'remarks', e.target.value)}
                          className="text-sm py-1.5 col-span-2 sm:col-span-1"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Manual Entry Tab ── */}
      {tab === 'manual' && (
        <div className="card p-6 max-w-lg">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Add / Edit Attendance Manually</h2>
          <div className="space-y-4">
            <div className="form-group">
              <label>Guard *</label>
              <select value={manualForm.guard_id} onChange={e => setManualForm({ ...manualForm, guard_id: e.target.value })}>
                <option value="">Select guard</option>
                {guards.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={manualForm.date} onChange={e => setManualForm({ ...manualForm, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Status *</label>
              <select value={manualForm.status} onChange={e => setManualForm({ ...manualForm, status: e.target.value as AttendanceStatus })}>
                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group mb-0">
                <label>Check-in Time</label>
                <input type="time" value={manualForm.check_in_time} onChange={e => setManualForm({ ...manualForm, check_in_time: e.target.value })} />
              </div>
              <div className="form-group mb-0">
                <label>Check-out Time</label>
                <input type="time" value={manualForm.check_out_time} onChange={e => setManualForm({ ...manualForm, check_out_time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Shift</label>
              <select value={manualForm.shift} onChange={e => setManualForm({ ...manualForm, shift: e.target.value })}>
                <option value="day">Day</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input value={manualForm.location} onChange={e => setManualForm({ ...manualForm, location: e.target.value })} placeholder="Post location" />
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <textarea rows={2} value={manualForm.remarks} onChange={e => setManualForm({ ...manualForm, remarks: e.target.value })} className="resize-none" />
            </div>
            <button onClick={saveManual} disabled={savingManual} className="btn-primary w-full justify-center">
              {savingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Manual Entry
            </button>
          </div>
        </div>
      )}

      {/* ── History Tab ── */}
      {tab === 'history' && (
        <>
          <div className="card p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group mb-0">
                <label>Month</label>
                <input type="month" value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} />
              </div>
              <div className="form-group mb-0">
                <label>Filter by Guard (optional)</label>
                <select value={historyGuard} onChange={e => setHistoryGuard(e.target.value)}>
                  <option value="">All Guards</option>
                  {guards.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Guard</th>
                      <th>Status</th>
                      <th>Shift</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Location</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-gray-400">No records found</td></tr>
                    ) : history.map(h => (
                      <tr key={h.id}>
                        <td className="font-medium text-gray-900 dark:text-white">{h.date}</td>
                        <td className="text-gray-700 dark:text-gray-300">{(h as any).guards?.name ?? '—'}</td>
                        <td>
                          <span className={`badge text-xs font-medium px-2 py-1 rounded-lg capitalize ${getHistoryBadgeClass(h.status)}`}>
                            {h.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-gray-600 dark:text-gray-400 capitalize">{h.shift ?? '—'}</td>
                        <td className="text-gray-600 dark:text-gray-400 text-sm">
                          {h.check_in_time ? format(new Date(h.check_in_time), 'HH:mm') : '—'}
                        </td>
                        <td className="text-gray-600 dark:text-gray-400 text-sm">
                          {h.check_out_time ? format(new Date(h.check_out_time), 'HH:mm') : '—'}
                        </td>
                        <td className="text-gray-600 dark:text-gray-400">{h.location ?? '—'}</td>
                        <td className="text-gray-500 dark:text-gray-400 text-sm">{h.remarks ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Monthly Summary Tab ── */}
      {tab === 'summary' && (
        <>
          <div className="card p-4 mb-4">
            <div className="form-group mb-0">
              <label>Select Month</label>
              <input type="month" value={summaryMonth} onChange={e => setSummaryMonth(e.target.value)} className="max-w-xs" />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: 'Present',         color: 'bg-green-500'  },
              { label: 'On-Job Training', color: 'bg-purple-500' },
              { label: 'Training',        color: 'bg-indigo-500' },
              { label: 'Day Off',         color: 'bg-blue-400'   },
              { label: 'Leave',           color: 'bg-yellow-400' },
              { label: 'Sick Leave',      color: 'bg-orange-400' },
              { label: 'Holiday',         color: 'bg-teal-400'   },
              { label: 'Absent',          color: 'bg-red-400'    },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className={`w-3 h-3 rounded-sm ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>

          {summaryLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : summary.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No guards found</div>
          ) : (
            <div className="space-y-3">
              {summary.map(({ guard, stats, total }) => {
                const present  = stats['present']         ?? 0
                const absent   = stats['absent']          ?? 0
                const dayOff   = stats['day_off']         ?? 0
                const leave    = stats['leave']           ?? 0
                const sick     = stats['sick_leave']      ?? 0
                const ojt      = stats['on_job_training'] ?? 0
                const training = stats['training']        ?? 0
                const holiday  = stats['holiday']         ?? 0
                const workDays = present + ojt + training

                return (
                  <div key={guard.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{guard.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {guard.id_number ?? 'No ID'} · {total} record{total !== 1 ? 's' : ''} logged
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{workDays}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">days worked</p>
                      </div>
                    </div>

                    {/* Proportional colour bar */}
                    {total > 0 && (
                      <div className="flex h-2.5 rounded-full overflow-hidden gap-px mb-3">
                        {present  > 0 && <div className="bg-green-500"  style={{ flex: present  }} title={`Present: ${present}`}          />}
                        {ojt      > 0 && <div className="bg-purple-500" style={{ flex: ojt      }} title={`On-Job Training: ${ojt}`}       />}
                        {training > 0 && <div className="bg-indigo-500" style={{ flex: training }} title={`Training: ${training}`}         />}
                        {dayOff   > 0 && <div className="bg-blue-400"   style={{ flex: dayOff   }} title={`Day Off: ${dayOff}`}            />}
                        {leave    > 0 && <div className="bg-yellow-400" style={{ flex: leave    }} title={`Leave: ${leave}`}               />}
                        {sick     > 0 && <div className="bg-orange-400" style={{ flex: sick     }} title={`Sick Leave: ${sick}`}           />}
                        {holiday  > 0 && <div className="bg-teal-400"   style={{ flex: holiday  }} title={`Holiday: ${holiday}`}           />}
                        {absent   > 0 && <div className="bg-red-400"    style={{ flex: absent   }} title={`Absent: ${absent}`}             />}
                      </div>
                    )}
                    {total === 0 && (
                      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-3" />
                    )}

                    {/* Stat chips — only show non-zero */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Present',         val: present,  color: 'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400'  },
                        { label: 'Absent',          val: absent,   color: 'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400'    },
                        { label: 'Day Off',         val: dayOff,   color: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400'   },
                        { label: 'Leave',           val: leave,    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
                        { label: 'Sick Leave',      val: sick,     color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
                        { label: 'On-Job Training', val: ojt,      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
                        { label: 'Training',        val: training, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
                        { label: 'Holiday',         val: holiday,  color: 'bg-teal-100   dark:bg-teal-900/30   text-teal-700   dark:text-teal-400'   },
                      ]
                        .filter(s => s.val > 0)
                        .map(s => (
                          <span key={s.label} className={`text-xs font-medium px-2 py-1 rounded-lg ${s.color}`}>
                            {s.label}: {s.val}
                          </span>
                        ))}
                      {total === 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">No records this month</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Checkout Modal ── */}
      {checkoutGuardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Confirm Check Out</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Check out <strong>{guards.find(g => g.id === checkoutGuardId)?.name}</strong> at {format(new Date(), 'HH:mm')}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCheckoutGuardId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => checkOut(checkoutGuardId)} className="btn-primary flex-1 justify-center">
                <CheckCircle className="w-4 h-4" /> Check Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}