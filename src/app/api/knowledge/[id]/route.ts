import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

async function ownedDoc(id: string, workspaceId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('business_knowledge_documents')
    .select('*')
    .eq('id', id)
    .eq('business_id', workspaceId)
    .single()
  return { db, doc: data }
}

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { doc } = await ownedDoc(id, auth.workspaceId)
  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(doc)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { doc, db } = await ownedDoc(id, auth.workspaceId)
  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  // Only allow safe fields
  const allowed = ['title', 'content', 'status']
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) updates[k] = body[k]

  const { data, error } = await db
    .from('business_knowledge_documents')
    .update(updates)
    .eq('id', id)
    .eq('business_id', auth.workspaceId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { doc, db } = await ownedDoc(id, auth.workspaceId)
  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Clean up stored file if any
  if (doc.file_url) {
    const path = doc.file_url.split('/knowledge-documents/')[1]
    if (path) await db.storage.from('knowledge-documents').remove([path])
  }

  const { error } = await db
    .from('business_knowledge_documents')
    .delete()
    .eq('id', id)
    .eq('business_id', auth.workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
