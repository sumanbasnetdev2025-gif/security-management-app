'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/upload'
import { Incident } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Plus, AlertTriangle, Loader2, Search, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

const INCIDENT_TYPES = [
  'Theft', 'Trespassing', 'Vandalism', 'Assault', 'Suspicious Activity',
  'Fire', 'Medical Emergency', 'Vehicle Accident', 'Crowd Disturbance', 'Other'
]

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState<1 | 2 | null>(null)
  const [form, setForm] = useState({
    incident_type: '',
    location: '',
    incident_datetime: new Date().toISOString().slice(0, 16),
    description: '',
    action_taken: '',
    photo_url: null as string | null,
    photo_url_2: null as string | null,
  })

  async function fetchIncidents() {
    const supabase = createClient()
    const { data } = await supabase
      .from('incidents').select('*')
      .order('incident_datetime', { ascending: false }).limit(100)
    setIncidents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchIncidents() }, [])

  async function handlePhotoUpload(num: 1 | 2, file: File) {
    setUploadingPhoto(num)
    const url = await uploadImage(file, 'incidents')
    if (url) {
      setForm(prev => ({ ...prev, [num === 1 ? 'photo_url' : 'photo_url_2']: url }))
      toast.success('Photo uploaded')
    } else {
      toast.error('Upload failed')
    }
    setUploadingPhoto(null)
  }

  async function saveIncident() {
    if (!form.incident_type || !form.location || !form.description) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from('incidents').insert({
      incident_type: form.incident_type,
      location: form.location,
      incident_datetime: new Date(form.incident_datetime).toISOString(),
      description: form.description,
      action_taken: form.action_taken || null,
      photo_url: form.photo_url,
      photo_url_2: form.photo_url_2,
    })

    if (error) toast.error('Failed to save incident')
    else {
      toast.success('Incident reported')
      setShowForm(false)
      setForm({ incident_type: '', location: '', incident_datetime: new Date().toISOString().slice(0, 16), description: '', action_taken: '', photo_url: null, photo_url_2: null })
      fetchIncidents()
    }
    setSaving(false)
  }

  const filtered = incidents.filter(i =>
    i.incident_type.toLowerCase().includes(search.toLowerCase()) ||
    i.location.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Incident Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{incidents.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Report Incident
        </button>
      </div>

      <div className="card mb-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No incidents found</div>
          ) : filtered.map(incident => (
            <div key={incident.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="badge-red">{incident.incident_type}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{incident.location}</span>
                    <span className="text-gray-400 text-xs ml-auto">{formatDateTime(incident.incident_datetime)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{incident.description}</p>
                  {incident.action_taken && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span className="font-medium">Action:</span> {incident.action_taken}
                    </p>
                  )}
                  {(incident.photo_url || incident.photo_url_2) && (
                    <div className="flex gap-2 mt-2">
                      {incident.photo_url && (
                        <a href={incident.photo_url} target="_blank" rel="noreferrer">
                          <img src={incident.photo_url} alt="Evidence 1" className="h-20 w-28 object-cover rounded-lg hover:opacity-90" />
                        </a>
                      )}
                      {incident.photo_url_2 && (
                        <a href={incident.photo_url_2} target="_blank" rel="noreferrer">
                          <img src={incident.photo_url_2} alt="Evidence 2" className="h-20 w-28 object-cover rounded-lg hover:opacity-90" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Report Incident</h2>
            <div className="space-y-4">
              <div className="form-group">
                <label>Incident Type *</label>
                <select value={form.incident_type} onChange={e => setForm({ ...form, incident_type: e.target.value })}>
                  <option value="">Select type</option>
                  {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input placeholder="Where did it happen?" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" value={form.incident_datetime} onChange={e => setForm({ ...form, incident_datetime: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea rows={3} placeholder="What happened?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="resize-none" />
              </div>
              <div className="form-group">
                <label>Action Taken</label>
                <textarea rows={2} placeholder="Action taken..." value={form.action_taken} onChange={e => setForm({ ...form, action_taken: e.target.value })} className="resize-none" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Evidence Photos (optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  {([1, 2] as const).map(num => {
                    const photoKey = num === 1 ? 'photo_url' : 'photo_url_2'
                    const photoUrl = form[photoKey]
                    return (
                      <div key={num}>
                        {photoUrl ? (
                          <div className="relative">
                            <img src={photoUrl} alt="" className="w-full h-28 object-cover rounded-lg" />
                            <button onClick={() => setForm(prev => ({ ...prev, [photoKey]: null }))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                            {uploadingPhoto === num ? (
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-400">Photo {num}</span>
                              </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handlePhotoUpload(num, e.target.files[0])} />
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={saveIncident} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}