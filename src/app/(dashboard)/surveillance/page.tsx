'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SurveillanceLog } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Plus, Eye, AlertTriangle, Loader2, Users, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'

type LogForm = {
  location: string
  log_time: string
  male_count: number
  female_count: number
  kids_count: number
  elderly_count: number
  suspicious_activity: boolean
  notes: string
}

const emptyForm = (): LogForm => ({
  location: '', log_time: new Date().toISOString().slice(0, 16),
  male_count: 0, female_count: 0, kids_count: 0, elderly_count: 0,
  suspicious_activity: false, notes: '',
})

export default function SurveillancePage() {
  const [logs, setLogs] = useState<SurveillanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLog, setEditingLog] = useState<SurveillanceLog | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<LogForm>(emptyForm())

  const total = form.male_count + form.female_count + form.kids_count + form.elderly_count

  async function fetchLogs() {
    const supabase = createClient()
    const { data } = await supabase
      .from('surveillance_logs').select('*')
      .order('log_time', { ascending: false }).limit(100)
    setLogs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  function openEdit(log: SurveillanceLog) {
    setEditingLog(log)
    setForm({
      location: log.location,
      log_time: new Date(log.log_time).toISOString().slice(0, 16),
      male_count: log.male_count,
      female_count: log.female_count,
      kids_count: log.kids_count,
      elderly_count: log.elderly_count,
      suspicious_activity: log.suspicious_activity,
      notes: log.notes ?? '',
    })
    setShowForm(true)
  }

  function openNew() {
    setEditingLog(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  async function saveLog() {
    if (!form.location.trim()) { toast.error('Location is required'); return }
    setSaving(true)
    const supabase = createClient()

    const payload = {
      location: form.location,
      log_time: new Date(form.log_time).toISOString(),
      total_persons: total,
      male_count: form.male_count,
      female_count: form.female_count,
      kids_count: form.kids_count,
      elderly_count: form.elderly_count,
      suspicious_activity: form.suspicious_activity,
      notes: form.notes || null,
    }

    if (editingLog) {
      const { error } = await supabase.from('surveillance_logs').update(payload).eq('id', editingLog.id)
      if (error) toast.error('Failed to update')
      else { toast.success('Log updated'); setShowForm(false); fetchLogs() }
    } else {
      const { error } = await supabase.from('surveillance_logs').insert(payload)
      if (error) toast.error('Failed to save')
      else { toast.success('Log saved'); setShowForm(false); fetchLogs() }
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Surveillance Logs</h1>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-4 h-4" /> New Log
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No surveillance logs yet</div>
          ) : logs.map(log => (
            <div key={log.id} className={`card p-5 ${log.suspicious_activity ? 'border-orange-300 dark:border-orange-700' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{log.location}</span>
                    {log.suspicious_activity && (
                      <span className="badge-yellow flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Suspicious
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDateTime(log.log_time)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">{log.total_persons}</span>
                  </div>
                  <button onClick={() => openEdit(log)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { label: 'Male', val: log.male_count },
                  { label: 'Female', val: log.female_count },
                  { label: 'Kids', val: log.kids_count },
                  { label: 'Elderly', val: log.elderly_count },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg py-2">
                    <div className="font-semibold text-gray-900 dark:text-white">{item.val}</div>
                    <div className="text-gray-500 dark:text-gray-400">{item.label}</div>
                  </div>
                ))}
              </div>
              {log.notes && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{log.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingLog ? 'Edit Log' : 'New Surveillance Log'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label>Location *</label>
                <input placeholder="e.g. Main Entrance" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="datetime-local" value={form.log_time} onChange={e => setForm({ ...form, log_time: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Person Count — Total: <span className="font-bold text-blue-600 dark:text-blue-400">{total}</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'male_count', label: 'Male' },
                    { key: 'female_count', label: 'Female' },
                    { key: 'kids_count', label: 'Kids' },
                    { key: 'elderly_count', label: 'Elderly' },
                  ].map(f => (
                    <div key={f.key} className="form-group mb-0">
                      <label>{f.label}</label>
                      <input
                        type="number" min={0}
                        value={(form as any)[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: Math.max(0, parseInt(e.target.value) || 0) })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="suspicious"
                  checked={form.suspicious_activity}
                  onChange={e => setForm({ ...form, suspicious_activity: e.target.checked })}
                  className="w-auto"
                />
                <label htmlFor="suspicious" className="mb-0 text-orange-600 dark:text-orange-400">
                  Mark as suspicious activity
                </label>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={saveLog} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingLog ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}