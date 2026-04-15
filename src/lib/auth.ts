import { createAdminClient } from './supabase/admin'
import { AuthUser } from '@/types'
import bcrypt from 'bcryptjs'

export async function verifyLogin(username: string, password: string): Promise<AuthUser | null> {
  const supabase = createAdminClient()

  const { data: user, error } = await supabase
    .from('app_users')
    .select('*, user_permissions(*)')
    .eq('username', username.toLowerCase().trim())
    .eq('is_active', true)
    .single()

  if (error || !user) return null

  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) return null

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    avatar_url: user.avatar_url,
    permissions: user.user_permissions?.[0] ?? null,
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}