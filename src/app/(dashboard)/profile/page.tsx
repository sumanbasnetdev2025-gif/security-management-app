'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserCircle, Lock, Loader2, Save, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const isAdmin = user?.role === 'admin'

  async function updateName() {
    if (!name.trim()) { toast.error('Name cannot be empty'); return }
    setSavingName(true)

    const res = await fetch('/api/profile/name', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (res.ok) { toast.success('Name updated'); await refresh() }
    else toast.error('Failed to update name')
    setSavingName(false)
  }

  async function updatePassword() {
    if (!currentPassword || !newPassword) { toast.error('Fill in both fields'); return }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return }
    setSavingPassword(true)

    const res = await fetch('/api/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json()
    if (res.ok) {
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
    } else {
      toast.error(data.error || 'Failed to update password')
    }
    setSavingPassword(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="page-title mb-6">My Profile</h1>

      {isAdmin && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Admin account details are managed directly in the database for security reasons.
            Name and password changes are disabled here.
          </p>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Account Info</h2>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="form-group">
            <label>Username</label>
            <input
              value={user?.username ?? ''}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input
              value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              disabled={isAdmin}
              className={isAdmin ? 'opacity-60 cursor-not-allowed' : ''}
            />
          </div>
          {!isAdmin && (
            <button
              onClick={updateName}
              disabled={savingName}
              className="btn-primary"
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Name
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
          </div>
        </div>
        <div className="card-body space-y-4">
          {isAdmin ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Password changes for the admin account must be done via the database.
            </p>
          ) : (
            <>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <button
                onClick={updatePassword}
                disabled={savingPassword}
                className="btn-primary"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Change Password
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}