'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AppUser, UserPermissions } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, ToggleLeft, ToggleRight, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

const PERMISSION_KEYS = [
  { key: 'setup_management', label: 'Setup Management' },
  { key: 'parking_system', label: 'Parking System' },
  { key: 'surveillance_logs', label: 'Surveillance Logs' },
  { key: 'cctv_audit', label: 'CCTV Audit' },
  { key: 'guard_attendance', label: 'Guard Attendance' },
  { key: 'incident_reports', label: 'Incident Reports' },
  { key: 'reports', label: 'Reports' },
]

const defaultPerms = () =>
  Object.fromEntries(PERMISSION_KEYS.map(p => [p.key, false])) as Record<string, boolean>

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<(AppUser & { user_permissions: UserPermissions[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingPerms, setEditingPerms] = useState<string | null>(null)
  const [perms, setPerms] = useState<Record<string, boolean>>(defaultPerms())
  const [savingPerms, setSavingPerms] = useState(false)
  const [form, setForm] = useState({
    name: '', username: '', password: '', role: 'guard',
    permissions: defaultPerms(),
  })

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard')
  }, [user])

  async function fetchUsers() {
    const supabase = createClient()
    const { data } = await supabase
      .from('app_users').select('*, user_permissions(*)')
      .order('created_at')
    setUsers((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  function toggleFormPerm(key: string) {
    setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }))
  }

  async function createUser() {
    if (!form.name || !form.username || !form.password) {
      toast.error('Name, username, and password are required')
      return
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }

    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, username: form.username, password: form.password, role: form.role, permissions: form.permissions }),
    })

    const data = await res.json()
    if (!res.ok) toast.error(data.error || 'Failed to create user')
    else {
      toast.success('User created')
      setShowForm(false)
      setForm({ name: '', username: '', password: '', role: 'guard', permissions: defaultPerms() })
      fetchUsers()
    }
    setSaving(false)
  }

  async function savePermissions(userId: string) {
    setSavingPerms(true)
    const supabase = createClient()
    const { error } = await supabase.from('user_permissions').upsert({ user_id: userId, ...perms }, { onConflict: 'user_id' })
    if (error) toast.error('Failed to save')
    else { toast.success('Permissions updated'); setEditingPerms(null); fetchUsers() }
    setSavingPerms(false)
  }

  function openPermissions(u: AppUser & { user_permissions: UserPermissions[] }) {
    const existing = u.user_permissions?.[0] ?? {}
    const p = defaultPerms()
    PERMISSION_KEYS.forEach(pk => { p[pk.key] = (existing as any)[pk.key] ?? false })
    setPerms(p)
    setEditingPerms(u.id)
  }

  if (user?.role !== 'admin') return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{users.length} users</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{u.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{u.username} · <span className="capitalize">{u.role}</span></p>
                </div>
                {u.role !== 'admin' && (
                  <button onClick={() => openPermissions(u)} className="btn-secondary text-xs py-1.5">
                    Edit Access
                  </button>
                )}
              </div>

              {u.role !== 'admin' && (
                <div className="flex flex-wrap gap-2">
                  {PERMISSION_KEYS.map(pk => {
                    const has = (u.user_permissions?.[0] as any)?.[pk.key]
                    return (
                      <span key={pk.key} className={has ? 'badge-blue' : 'badge-gray'}>
                        {pk.label}
                      </span>
                    )
                  })}
                </div>
              )}
              {u.role === 'admin' && (
                <span className="badge-green">Full Access</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal — with permissions */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New User</h2>
            <div className="space-y-4">
              <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
              <div className="form-group"><label>Username *</label><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })} placeholder="username (no spaces)" /></div>
              <div className="form-group"><label>Password *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" /></div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="guard">Guard</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">System Access</p>
                <div className="space-y-2">
                  {PERMISSION_KEYS.map(pk => (
                    <div key={pk.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{pk.label}</span>
                      <button
                        onClick={() => toggleFormPerm(pk.key)}
                        className={form.permissions[pk.key] ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}
                      >
                        {form.permissions[pk.key]
                          ? <ToggleRight className="w-8 h-8" />
                          : <ToggleLeft className="w-8 h-8" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={createUser} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingPerms && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit Access</h2>
            <div className="space-y-1">
              {PERMISSION_KEYS.map(pk => (
                <div key={pk.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{pk.label}</span>
                  <button
                    onClick={() => setPerms(p => ({ ...p, [pk.key]: !p[pk.key] }))}
                    className={perms[pk.key] ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}
                  >
                    {perms[pk.key] ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingPerms(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => savePermissions(editingPerms)} disabled={savingPerms} className="btn-primary flex-1 justify-center">
                {savingPerms ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}