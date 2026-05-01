import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; name?: string; businessName?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const { email, password, name, businessName } = body
  if (!email?.trim()) return NextResponse.json({ error: 'email required' }, { status: 400 })
  if (!password || password.length < 8) return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 })
  if (!businessName?.trim()) return NextResponse.json({ error: 'business name required' }, { status: 400 })

  const db = createServiceClient()

  // Create auth user (email_confirm bypassed for direct onboarding)
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
    console.error('[Signup] createUser:', msg)
    return NextResponse.json({ error: msg || 'Failed to create account' }, { status: 500 })
  }

  // Create workspace
  const { data: workspace, error: wsErr } = await db
    .from('workspaces')
    .insert({ name: businessName.trim() })
    .select()
    .single()

  if (wsErr || !workspace) {
    await db.auth.admin.deleteUser(user.id)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }

  // Link user → workspace as admin (include name/email if columns exist after migration 005)
  const wuPayload: Record<string, unknown> = {
    id: user.id,
    workspace_id: workspace.id,
    role: 'admin',
  }
  const displayName = name?.trim() || email.split('@')[0]
  // Attempt with name+email; fall back without if columns not yet added
  let wuErr = (await db.from('workspace_users').insert({ ...wuPayload, name: displayName, email: email.trim() })).error
  if (wuErr?.message?.includes('column')) {
    // Migration 005 not run yet — insert without optional columns
    wuErr = (await db.from('workspace_users').insert(wuPayload)).error
  }

  if (wuErr) {
    console.error('[Signup] workspace_users insert:', wuErr.message)
    await db.auth.admin.deleteUser(user.id)
    await db.from('workspaces').delete().eq('id', workspace.id)
    return NextResponse.json({ error: 'Failed to setup workspace' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
