import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

async function verifyOwnership(id: string, workspaceId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('whatsapp_templates')
    .select('workspace_id')
    .eq('id', id)
    .single()
  return data?.workspace_id === workspaceId ? db : null
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const db = await verifyOwnership(id, auth.workspaceId)
  if (!db) return NextResponse.json({ error: 'template not found' }, { status: 404 })

  const { data, error } = await db
    .from('whatsapp_templates')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = await verifyOwnership(id, auth.workspaceId)
  if (!db) return NextResponse.json({ error: 'template not found' }, { status: 404 })

  const { error } = await db.from('whatsapp_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
