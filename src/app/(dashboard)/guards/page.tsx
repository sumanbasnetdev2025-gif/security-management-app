'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Guard } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Phone, Badge, UserCheck, UserX, Pencil, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function GuardsPage() {
  const [guards, setGuards] = useState<Guard[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Guard | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', id_number: '', status: 'active' })

  async function fetchGuards() {
    const supabase = createClient()
    const { data } = await supabase
      .from('guards')
      .select('*')
      .order('name')
    setGuards(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchGuards() }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', phone: '', id_number: '', status: 'active' })
    setShowForm(true)
  }

  function openEdit(guard: Guard) {
    setEditing(guard)
    setForm({
      name: guard.name,
      phone: guard.phone ?? '',
      id_number: guard.id_number ?? '',
      status: guard.status,
    })
    setShowForm(true)
  }

  async function saveGuard() {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    const supabase = createClient()

    if (editing) {
      const { error } = await supabase
        .from('guards')
        .update({ name: form.name, phone: form.phone || null, id_number: form.id_number || null, status: form.status })
        .eq('id', editing.id)

      if (error) {
        toast.error('Failed to update guard')
      } else {
        toast.success('Guard updated')
        setShowForm(false)
        fetchGuards()
      }
    } else {
      const { error } = await supabase
        .from('guards')
        .insert({ name: form.name, phone: form.phone || null, id_number: form.id_number || null, status: form.status })

      if (error) {
        toast.error('Failed to add guard')
      } else {
        toast.success('Guard added')
        setShowForm(false)
        fetchGuards()
      }
    }

    setSaving(false)
  }

  const filtered = guards.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Guard Management</h1>
          <p className="text-gray-500 text-sm mt-1">{guards.length} guards total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/guards/attendance" className="btn-secondary">
            Attendance
          </Link>
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Guard
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search by name or ID number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID Number</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      {search ? 'No guards found' : 'No guards added yet'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(guard => (
                    <tr key={guard.id}>
                      <td className="font-medium">{guard.name}</td>
                      <td className="text-gray-500">{guard.id_number ?? '—'}</td>
                      <td className="text-gray-500">{guard.phone ?? '—'}</td>
                      <td>
                        {guard.status === 'active' ? (
                          <span className="badge-green">Active</span>
                        ) : (
                          <span className="badge-red">Inactive</span>
                        )}
                      </td>
                      <td className="text-gray-500">{formatDate(guard.created_at)}</td>
                      <td>
                        <button
                          onClick={() => openEdit(guard)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
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
              {editing ? 'Edit Guard' : 'Add New Guard'}
            </h2>

            <div className="space-y-4">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  placeholder="Enter guard name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ID Number</label>
                <input
                  placeholder="e.g. IC123456"
                  value={form.id_number}
                  onChange={e => setForm({ ...form, id_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  placeholder="e.g. +60123456789"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={saveGuard} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Guard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}