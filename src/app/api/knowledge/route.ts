import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

export async function GET() {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('business_knowledge_documents')
    .select('*')
    .eq('business_id', auth.workspaceId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { title?: string; content?: string; status?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const { title, content, status } = body
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('business_knowledge_documents')
    .insert({
      business_id: auth.workspaceId,
      title: title.trim(),
      content: content?.trim() || null,
      status: status || 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
