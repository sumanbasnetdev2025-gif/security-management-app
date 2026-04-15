import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('auth-session')
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const sessionUser = JSON.parse(session.value)
    const { name } = await request.json()

    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from('app_users').update({ name }).eq('id', sessionUser.id)

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    const updatedUser = { ...sessionUser, name }
    cookieStore.set('auth-session', JSON.stringify(updatedUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}