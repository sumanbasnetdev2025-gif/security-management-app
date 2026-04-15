'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { AuthUser } from '@/types'
import { useRouter } from 'next/navigation'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export { AuthContext }

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return { user, loading, logout, refresh: fetchUser }
}