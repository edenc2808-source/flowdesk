import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

export async function GET() {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('workspace_users')
    .select('id, role, name, email, created_at')
    .eq('workspace_id', auth.workspaceId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'admin required' }, { status: 403 })

  let body: { email?: string; name?: string; role?: string; password?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const { email, name, role, password } = body
  if (!email?.trim()) return NextResponse.json({ error: 'email required' }, { status: 400 })
  if (!password || password.length < 8) return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 })
  if (role && !['admin', 'agent'].includes(role)) return NextResponse.json({ error: 'invalid role' }, { status: 400 })

  const db = createServiceClient()

  const { data: { user }, error: userErr } = await db.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { name: name?.trim() || email.split('@')[0] },
  })

  if (userErr || !user) {
    const msg = userErr?.message ?? ''
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    return NextResponse.json({ error: msg || 'Failed to create user' }, { status: 500 })
  }

  const displayName = name?.trim() || email.split('@')[0]
  let { data: member, error: wuErr } = await db
    .from('workspace_users')
    .insert({ id: user.id, workspace_id: auth.workspaceId, role: role || 'agent', name: displayName, email: email.trim() })
    .select()
    .single()

  if (wuErr?.message?.includes('column')) {
    // Migration 005 not run yet
    ;({ data: member, error: wuErr } = await db
      .from('workspace_users')
      .insert({ id: user.id, workspace_id: auth.workspaceId, role: role || 'agent' })
      .select()
      .single())
  }

  if (wuErr || !member) {
    await db.auth.admin.deleteUser(user.id)
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
  }

  return NextResponse.json(member, { status: 201 })
}
