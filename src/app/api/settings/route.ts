import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: wu } = await supabase.from('workspace_users').select('workspace_id').eq('id', user.id).single()
  if (!wu) return NextResponse.json({ error: 'no workspace' }, { status: 403 })
  const { data } = await supabase.from('workspaces').select('*').eq('id', wu.workspace_id).single()
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: wu } = await supabase.from('workspace_users').select('workspace_id').eq('id', user.id).single()
  if (!wu) return NextResponse.json({ error: 'no workspace' }, { status: 403 })

  const body = await req.json()
  const allowed = ['name', 'industry_type', 'whatsapp_number']
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) updates[k] = body[k]

  const { data, error } = await supabase.from('workspaces').update(updates).eq('id', wu.workspace_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
