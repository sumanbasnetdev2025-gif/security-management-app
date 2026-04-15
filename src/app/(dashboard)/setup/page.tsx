'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/upload'
import { Setup } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Plus, Loader2, CheckCircle, MapPin, Phone, User, Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

type PhotoStage = 'before' | 'during' | 'after' | 'dismantle'

function PhotoUploadSection({
  stage, label, photos, onChange, disabled
}: {
  stage: PhotoStage
  label: string
  photos: (string | null)[]
  onChange: (index: number, url: string | null) => void
  disabled?: boolean
}) {
  const [uploading, setUploading] = useState<number | null>(null)

  async function handleFile(index: number, file: File) {
    setUploading(index)
    const url = await uploadImage(file, `setup/${stage}`)
    if (url) {
      onChange(index, url)
      toast.success('Photo uploaded')
    } else {
      toast.error('Upload failed')
    }
    setUploading(null)
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="relative">
            {photos[i] ? (
              <div className="relative">
                <img src={photos[i]!} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                {!disabled && (
                  <button
                    onClick={() => onChange(i, null)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading === i ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Photo {i + 1}</span>
                  </>
                )}
                {!disabled && (
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(i, e.target.files[0])}
                  />
                )}
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SetupPage() {
  const [setups, setSetups] = useState<Setup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [dismantleId, setDismantleId] = useState<string | null>(null)
  const [viewSetup, setViewSetup] = useState<Setup | null>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'active' | 'dismantled' | 'all'>('active')

  const [form, setForm] = useState({
    company_name: '', supervisor_name: '', supervisor_phone: '', location: '',
    setup_datetime: new Date().toISOString().slice(0, 16),
    before: [null, null, null] as (string | null)[],
    during: [null, null, null] as (string | null)[],
    after: [null, null, null] as (string | null)[],
  })

  const [dismantleForm, setDismantleForm] = useState({
    clearance_approved_by: '',
    photos: [null, null, null] as (string | null)[],
  })

  async function fetchSetups() {
    const supabase = createClient()
    let query = supabase.from('setups').select('*').order('setup_datetime', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setSetups((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchSetups() }, [filter])

  async function saveSetup() {
    if (!form.company_name || !form.supervisor_name || !form.location) {
      toast.error('Company name, supervisor, and location are required')
      return
    }
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from('setups').insert({
      company_name: form.company_name,
      supervisor_name: form.supervisor_name,
      supervisor_phone: form.supervisor_phone || null,
      location: form.location,
      setup_datetime: new Date(form.setup_datetime).toISOString(),
      status: 'active',
      photo_before_1: form.before[0],
      photo_before_2: form.before[1],
      photo_before_3: form.before[2],
      photo_during_1: form.during[0],
      photo_during_2: form.during[1],
      photo_during_3: form.during[2],
      photo_after_1: form.after[0],
      photo_after_2: form.after[1],
      photo_after_3: form.after[2],
    })

    if (error) toast.error('Failed to save')
    else {
      toast.success('Setup recorded')
      setShowForm(false)
      setForm({ company_name: '', supervisor_name: '', supervisor_phone: '', location: '', setup_datetime: new Date().toISOString().slice(0, 16), before: [null, null, null], during: [null, null, null], after: [null, null, null] })
      fetchSetups()
    }
    setSaving(false)
  }

  async function dismantleSetup(id: string) {
    if (!dismantleForm.clearance_approved_by.trim()) {
      toast.error('Enter who approved the clearance')
      return
    }
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from('setups').update({
      status: 'dismantled',
      dismantle_date: new Date().toISOString().split('T')[0],
      clearance_approved_by: dismantleForm.clearance_approved_by,
      photo_dismantle_1: dismantleForm.photos[0],
      photo_dismantle_2: dismantleForm.photos[1],
      photo_dismantle_3: dismantleForm.photos[2],
    }).eq('id', id)

    if (error) toast.error('Failed to update')
    else {
      toast.success('Marked as dismantled')
      setDismantleId(null)
      setDismantleForm({ clearance_approved_by: '', photos: [null, null, null] })
      fetchSetups()
    }
    setSaving(false)
  }

  function updatePhoto(stage: 'before' | 'during' | 'after', index: number, url: string | null) {
    setForm(prev => {
      const arr = [...prev[stage]]
      arr[index] = url
      return { ...prev, [stage]: arr }
    })
  }

  const allPhotos = (s: Setup) => [
    { label: 'Before Setup', urls: [s.photo_before_1, s.photo_before_2, s.photo_before_3] },
    { label: 'During Setup', urls: [s.photo_during_1, s.photo_during_2, s.photo_during_3] },
    { label: 'After Setup', urls: [s.photo_after_1, s.photo_after_2, s.photo_after_3] },
    { label: 'Dismantle', urls: [s.photo_dismantle_1, s.photo_dismantle_2, s.photo_dismantle_3] },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Setup Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{setups.length} records</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Setup
        </button>
      </div>

      <div className="card mb-4 p-4">
        <div className="flex gap-2">
          {(['active', 'dismantled', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'btn-primary' : 'btn-secondary'}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-3">
          {setups.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No setups found</div>
          ) : setups.map(setup => {
            const photoCount = allPhotos(setup).reduce((acc, s) => acc + s.urls.filter(Boolean).length, 0)
            return (
              <div key={setup.id} className="card p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{setup.company_name}</h3>
                      <span className={setup.status === 'active' ? 'badge-green' : 'badge-gray'}>
                        {setup.status}
                      </span>
                      {photoCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <ImageIcon className="w-3 h-3" /> {photoCount} photos
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDateTime(setup.setup_datetime)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewSetup(setup)} className="btn-secondary text-xs py-1.5">
                      View
                    </button>
                    {setup.status === 'active' && (
                      <button onClick={() => { setDismantleId(setup.id); setDismantleForm({ clearance_approved_by: '', photos: [null, null, null] }) }} className="btn-secondary text-xs py-1.5">
                        Dismantle
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />{setup.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <User className="w-3.5 h-3.5" />{setup.supervisor_name}
                  </div>
                  {setup.supervisor_phone && (
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <Phone className="w-3.5 h-3.5" />{setup.supervisor_phone}
                    </div>
                  )}
                </div>

                {setup.status === 'dismantled' && setup.clearance_approved_by && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Dismantled {setup.dismantle_date} · Approved by: {setup.clearance_approved_by}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New Setup Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">New Setup</h2>
            <div className="space-y-4">
              <div className="form-group"><label>Company Name *</label><input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
              <div className="form-group"><label>Supervisor Name *</label><input value={form.supervisor_name} onChange={e => setForm({ ...form, supervisor_name: e.target.value })} /></div>
              <div className="form-group"><label>Supervisor Phone</label><input value={form.supervisor_phone} onChange={e => setForm({ ...form, supervisor_phone: e.target.value })} /></div>
              <div className="form-group"><label>Location *</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div className="form-group"><label>Setup Date & Time</label><input type="datetime-local" value={form.setup_datetime} onChange={e => setForm({ ...form, setup_datetime: e.target.value })} /></div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Photos (optional, up to 3 each)</p>
                <PhotoUploadSection stage="before" label="Before Setup" photos={form.before} onChange={(i, url) => updatePhoto('before', i, url)} />
                <PhotoUploadSection stage="during" label="During Setup" photos={form.during} onChange={(i, url) => updatePhoto('during', i, url)} />
                <PhotoUploadSection stage="after" label="After Setup" photos={form.after} onChange={(i, url) => updatePhoto('after', i, url)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={saveSetup} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">{viewSetup.company_name}</h2>
              <button onClick={() => setViewSetup(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {allPhotos(viewSetup).map(section => {
                const hasPhotos = section.urls.some(Boolean)
                if (!hasPhotos) return null
                return (
                  <div key={section.label}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{section.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {section.urls.filter(Boolean).map((url, i) => (
                        <a key={i} href={url!} target="_blank" rel="noreferrer">
                          <img src={url!} alt="" className="w-full h-28 object-cover rounded-lg hover:opacity-90 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dismantle Modal */}
      {dismantleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Dismantle</h2>
            <div className="form-group">
              <label>Clearance Approved By *</label>
              <input placeholder="Approving officer name" value={dismantleForm.clearance_approved_by} onChange={e => setDismantleForm({ ...dismantleForm, clearance_approved_by: e.target.value })} />
            </div>
            <div className="mt-4">
              <PhotoUploadSection
                stage="dismantle"
                label="Dismantle Photos (optional)"
                photos={dismantleForm.photos}
                onChange={(i, url) => {
                  const p = [...dismantleForm.photos]; p[i] = url
                  setDismantleForm({ ...dismantleForm, photos: p as any })
                }}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDismantleId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => dismantleSetup(dismantleId)} disabled={saving} className="btn-danger flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}