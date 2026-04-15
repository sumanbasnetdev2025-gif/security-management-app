import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('auth-session')
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const user = JSON.parse(session.value)
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { name, username, password, role, permissions } = await request.json()

  if (!name || !username || !password) {
    return NextResponse.json({ error: 'Name, username, and password are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('app_users').select('id').eq('username', username.toLowerCase().trim()).single()

  if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 400 })

  const password_hash = await hashPassword(password)

  const { data: newUser, error } = await supabase
    .from('app_users')
    .insert({ name, username: username.toLowerCase().trim(), password_hash, role })
    .select().single()

  if (error) return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })

  await supabase.from('user_permissions').insert({
    user_id: newUser.id,
    ...(permissions ?? {}),
  })

  return NextResponse.json({ user: newUser })
}