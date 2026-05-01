import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { date?: string; title?: string; notes?: string; status?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const db = createServiceClient()

  // Verify ownership
  const { data: existing } = await db
    .from('appointments')
    .select('id, lead_id')
    .eq('id', id)
    .eq('workspace_id', auth.workspaceId)
    .single()
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.status !== undefined) updates.status = body.status

  if (body.date) {
    const d = new Date(body.date)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'invalid date' }, { status: 400 })
    updates.date = d.toISOString()
    updates.status = 'confirmed'
  }

  const { data, error } = await db
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .eq('workspace_id', auth.workspaceId)
    .select('*, lead:leads(name,phone)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
