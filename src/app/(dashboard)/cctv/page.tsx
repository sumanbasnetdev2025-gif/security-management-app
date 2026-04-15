'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CCTVCamera } from '@/types'
import { formatDateTime, generateCameraId } from '@/lib/utils'
import { Plus, Camera, CheckCircle, XCircle, Wrench, Loader2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

type CameraStatus = 'working' | 'not_working' | 'under_maintenance'

const STATUS_CONFIG = {
  working: { label: 'Working', icon: CheckCircle, class: 'badge-green' },
  not_working: { label: 'Not Working', icon: XCircle, class: 'badge-red' },
  under_maintenance: { label: 'Maintenance', icon: Wrench, class: 'badge-yellow' },
}

export default function CCTVPage() {
  const [cameras, setCameras] = useState<CCTVCamera[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CCTVCamera | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    camera_name: '',
    location: '',
    status: 'working' as CameraStatus,
    notes: '',
    technician_name: '',
  })

  async function fetchCameras() {
    const supabase = createClient()
    const { data } = await supabase.from('cctv_cameras').select('*').order('camera_name')
    setCameras(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchCameras() }, [])

  function openNew() {
    const newId = generateCameraId(cameras.map(c => c.camera_name))
    setEditing(null)
    setForm({ camera_name: newId, location: '', status: 'working', notes: '', technician_name: '' })
    setShowForm(true)
  }

  function openEdit(cam: CCTVCamera) {
    setEditing(cam)
    setForm({
      camera_name: cam.camera_name,
      location: cam.location,
      status: cam.status,
      notes: cam.notes ?? '',
      technician_name: cam.technician_name ?? '',
    })
    setShowForm(true)
  }

  async function saveCamera() {
    if (!form.camera_name.trim() || !form.location.trim()) {
      toast.error('Camera name and location are required')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const payload = {
      camera_name: form.camera_name.toUpperCase().trim(),
      location: form.location,
      status: form.status,
      notes: form.notes || null,
      technician_name: form.technician_name || null,
      last_checked: new Date().toISOString(),
    }

    if (editing) {
      const { error } = await supabase.from('cctv_cameras').update(payload).eq('id', editing.id)
      if (error) toast.error('Failed to update camera')
      else { toast.success('Camera updated'); setShowForm(false); fetchCameras() }
    } else {
      const { error } = await supabase.from('cctv_cameras').insert(payload)
      if (error) toast.error(error.message.includes('unique') ? 'Camera name already exists' : 'Failed to add camera')
      else { toast.success('Camera added'); setShowForm(false); fetchCameras() }
    }

    setSaving(false)
  }

  const working = cameras.filter(c => c.status === 'working').length
  const total = cameras.length
  const percent = total > 0 ? Math.round((working / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">CCTV Audit</h1>
          <p className="text-gray-500 text-sm mt-1">
            {working}/{total} cameras working ({percent}%)
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Camera
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Working', count: cameras.filter(c => c.status === 'working').length, color: 'text-green-600' },
          { label: 'Not Working', count: cameras.filter(c => c.status === 'not_working').length, color: 'text-red-600' },
          { label: 'Maintenance', count: cameras.filter(c => c.status === 'under_maintenance').length, color: 'text-yellow-600' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Camera ID</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Last Checked</th>
                  <th>Technician</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cameras.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">No cameras added yet</td>
                  </tr>
                ) : (
                  cameras.map(cam => {
                    const cfg = STATUS_CONFIG[cam.status]
                    return (
                      <tr key={cam.id}>
                        <td className="font-mono font-semibold">{cam.camera_name}</td>
                        <td className="text-gray-600 dark:text-gray-400">{cam.location}</td>
                        <td><span className={cfg.class}>{cfg.label}</span></td>
                        <td className="text-gray-500 text-sm">{formatDateTime(cam.last_checked)}</td>
                        <td className="text-gray-500">{cam.technician_name ?? '—'}</td>
                        <td className="text-gray-500 text-sm max-w-xs truncate">{cam.notes ?? '—'}</td>
                        <td>
                          <button onClick={() => openEdit(cam)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editing ? 'Update Camera' : 'Add Camera'}
            </h2>
            <div className="space-y-4">
              <div className="form-group">
                <label>Camera ID *</label>
                <input value={form.camera_name} onChange={e => setForm({ ...form, camera_name: e.target.value.toUpperCase() })} placeholder="e.g. CT-0001" />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Entrance" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CameraStatus })}>
                  <option value="working">Working</option>
                  <option value="not_working">Not Working</option>
                  <option value="under_maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Technician Name</label>
                <input value={form.technician_name} onChange={e => setForm({ ...form, technician_name: e.target.value })} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={saveCamera} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Camera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}