'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ParkingRecord } from '@/types'
import { formatDateTime, isOverstay } from '@/lib/utils'
import { Plus, Search, Car, LogOut, Loader2, AlertTriangle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { differenceInMinutes, format } from 'date-fns'

function calcDurationDetailed(entry: string, exit: string | null) {
  const end = exit ? new Date(exit) : new Date()
  const mins = differenceInMinutes(end, new Date(entry))
  const hrs = Math.floor(mins / 60)
  const remaining = mins % 60
  if (hrs === 0) return `${mins} min`
  return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`
}

export default function ParkingPage() {
  const [records, setRecords] = useState<ParkingRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [form, setForm] = useState({
    plate_number: '', vehicle_model: '', color: '', parking_slot: '', remarks: '',
  })

  async function fetchRecords() {
    const supabase = createClient()
    let query = supabase.from('parking_records').select('*').order('entry_time', { ascending: false })
    if (filter === 'active') query = query.is('exit_time', null)
    else {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      query = query.gte('entry_time', today.toISOString())
    }
    const { data } = await query.limit(100)
    setRecords(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [filter])

  async function addVehicle() {
    if (!form.plate_number.trim()) { toast.error('Plate number is required'); return }
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from('parking_records').insert({
      plate_number: form.plate_number.toUpperCase().trim(),
      vehicle_model: form.vehicle_model || null,
      color: form.color || null,
      parking_slot: form.parking_slot || null,
      remarks: form.remarks || null,
      entry_time: new Date().toISOString(),
    })

    if (error) toast.error('Failed to record vehicle')
    else {
      toast.success(`${form.plate_number.toUpperCase()} recorded`)
      setShowForm(false)
      setForm({ plate_number: '', vehicle_model: '', color: '', parking_slot: '', remarks: '' })
      fetchRecords()
    }
    setSaving(false)
  }

  async function checkOut(record: ParkingRecord) {
    if (!confirm(`Check out ${record.plate_number}?`)) return
    const supabase = createClient()
    const exitTime = new Date().toISOString()
    const mins = differenceInMinutes(new Date(exitTime), new Date(record.entry_time))
    const hrs = Math.floor(mins / 60)
    const rem = mins % 60
    const display = hrs > 0 ? (rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`) : `${mins}m`

    const { error } = await supabase.from('parking_records').update({
      exit_time: exitTime,
      duration_minutes: mins,
      total_duration_display: display,
    }).eq('id', record.id)

    if (error) toast.error('Failed to check out')
    else { toast.success(`${record.plate_number} checked out — ${display}`); fetchRecords() }
  }

  const filtered = records.filter(r =>
    r.plate_number.toLowerCase().includes(search.toLowerCase()) ||
    r.vehicle_model?.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = records.filter(r => !r.exit_time).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Parking Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{activeCount} vehicles currently parked</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Vehicle Entry
        </button>
      </div>

      <div className="card mb-4 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search plate number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('active')} className={filter === 'active' ? 'btn-primary' : 'btn-secondary'}>Active</button>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}>Today All</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Vehicle</th>
                  <th>Slot</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Total Duration</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No vehicles found</td></tr>
                ) : filtered.map(record => {
                  const overstay = !record.exit_time && isOverstay(record.entry_time)
                  return (
                    <tr key={record.id}>
                      <td className="font-semibold font-mono text-gray-900 dark:text-white">{record.plate_number}</td>
                      <td className="text-gray-600 dark:text-gray-400">
                        <div className="font-medium">{record.vehicle_model ?? '—'}</div>
                        {record.color && <div className="text-xs text-gray-400">{record.color}</div>}
                      </td>
                      <td className="text-gray-500 dark:text-gray-400">{record.parking_slot ?? '—'}</td>
                      <td className="text-sm">
                        <div className="text-gray-700 dark:text-gray-300 font-medium">{format(new Date(record.entry_time), 'dd MMM')}</div>
                        <div className="text-green-600 dark:text-green-400 font-mono text-xs">{format(new Date(record.entry_time), 'HH:mm')}</div>
                      </td>
                      <td className="text-sm">
                        {record.exit_time ? (
                          <>
                            <div className="text-gray-700 dark:text-gray-300 font-medium">{format(new Date(record.exit_time), 'dd MMM')}</div>
                            <div className="text-red-500 dark:text-red-400 font-mono text-xs">{format(new Date(record.exit_time), 'HH:mm')}</div>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">Still parked</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {record.exit_time
                              ? record.total_duration_display ?? calcDurationDetailed(record.entry_time, record.exit_time)
                              : calcDurationDetailed(record.entry_time, null)
                            }
                          </span>
                          {overstay && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" title="Overstay" />}
                        </div>
                      </td>
                      <td>
                        {record.exit_time ? (
                          <span className="badge-gray">Exited</span>
                        ) : overstay ? (
                          <span className="badge-yellow">Overstay</span>
                        ) : (
                          <span className="badge-green">Parked</span>
                        )}
                      </td>
                      <td>
                        {!record.exit_time && (
                          <button onClick={() => checkOut(record)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium">
                            <LogOut className="w-3.5 h-3.5" /> Exit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Vehicle Entry</h2>
            <div className="space-y-4">
              <div className="form-group"><label>Plate Number *</label><input placeholder="e.g. ABC 1234" value={form.plate_number} onChange={e => setForm({ ...form, plate_number: e.target.value.toUpperCase() })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group"><label>Vehicle Model</label><input placeholder="e.g. Toyota Vios" value={form.vehicle_model} onChange={e => setForm({ ...form, vehicle_model: e.target.value })} /></div>
                <div className="form-group"><label>Color</label><input placeholder="e.g. Silver" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Parking Slot</label><input placeholder="e.g. A-12 (optional)" value={form.parking_slot} onChange={e => setForm({ ...form, parking_slot: e.target.value })} /></div>
              <div className="form-group"><label>Remarks</label><input placeholder="Optional notes" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={addVehicle} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
                Record Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}