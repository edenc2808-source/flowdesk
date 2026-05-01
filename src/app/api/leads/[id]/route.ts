import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/twilio'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // RLS ensures we only see leads in our workspace
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = ['name', 'phone', 'source', 'status', 'tags', 'notes', 'automation_paused']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) {
    if (k in body) updates[k] = body[k]
  }

  // Normalize phone if being updated
  if (typeof updates.phone === 'string') {
    try {
      updates.phone = normalizePhone(updates.phone)
    } catch {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
  }

  // Sanitize notes/name
  if (typeof updates.notes === 'string') updates.notes = updates.notes.trim() || null
  if (typeof updates.name === 'string') {
    updates.name = updates.name.trim()
    if (!updates.name) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A lead with this phone number already exists' },
        { status: 409 }
      )
    }
    console.error('[Leads PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
