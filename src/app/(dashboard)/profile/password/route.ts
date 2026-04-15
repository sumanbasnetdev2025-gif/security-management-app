import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('auth-session')
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const sessionUser = JSON.parse(session.value)
    const { currentPassword, newPassword } = await request.json()

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from('app_users')
      .select('password_hash')
      .eq('id', sessionUser.id)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const match = await bcrypt.compare(currentPassword, user.password_hash)
    if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

    const newHash = await bcrypt.hash(newPassword, 10)
    const { error } = await supabase
      .from('app_users')
      .update({ password_hash: newHash })
      .eq('id', sessionUser.id)

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}