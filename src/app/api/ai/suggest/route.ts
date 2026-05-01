import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'
import { generateAiReply } from '@/lib/openai'

// GET: load existing suggestion for a conversation
export async function GET(req: NextRequest) {
  const convId = new URL(req.url).searchParams.get('conversation_id')
  if (!convId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })

  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Verify conversation belongs to workspace
  const { data: conv } = await db
    .from('conversations')
    .select('workspace_id')
    .eq('id', convId)
    .eq('workspace_id', auth.workspaceId)
    .single()
  if (!conv) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { data } = await db
    .from('ai_suggestions')
    .select('*')
    .eq('conversation_id', convId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json(data ?? null)
}

// POST: generate a new suggestion on-demand
export async function POST(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { conversation_id?: string; message?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const { conversation_id, message } = body
  if (!conversation_id) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const db = createServiceClient()

  // Verify conversation belongs to workspace
  const { data: conv } = await db
    .from('conversations')
    .select('workspace_id')
    .eq('id', conversation_id)
    .eq('workspace_id', auth.workspaceId)
    .single()
  if (!conv) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const suggestion = await buildSuggestion(db, auth.workspaceId, conversation_id, message.trim(), null)
  if (!suggestion) return NextResponse.json({ error: 'no knowledge or AI unavailable' }, { status: 422 })

  return NextResponse.json(suggestion)
}

// PATCH: update suggestion status (approve/dismiss)
export async function PATCH(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { id?: string; status?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const { id, status } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (!['approved', 'dismissed'].includes(status ?? '')) {
    return NextResponse.json({ error: 'status must be approved or dismissed' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('ai_suggestions')
    .update({ status })
    .eq('id', id)
    .select('conversation_id')
    .single()

  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Verify workspace ownership
  const { data: conv } = await db
    .from('conversations')
    .select('workspace_id')
    .eq('id', data.conversation_id)
    .single()
  if (!conv || conv.workspace_id !== auth.workspaceId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  return NextResponse.json({ ok: true })
}

// Shared builder — used by webhook too
export async function buildSuggestion(
  db: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  conversationId: string,
  customerMessage: string,
  triggerMessageId: string | null
) {
  // Load active knowledge docs for this business
  const { data: docs } = await db
    .from('business_knowledge_documents')
    .select('id, title, content')
    .eq('business_id', workspaceId)
    .eq('status', 'active')

  if (!docs?.length) return null

  // Get business name
  const { data: ws } = await db.from('workspaces').select('name').eq('id', workspaceId).single()
  const businessName = ws?.name ?? 'the business'

  const { ok, reply, usedDocIds } = await generateAiReply(customerMessage, docs, businessName)
  if (!ok || !reply) return null

  const usedDocs = docs.filter(d => usedDocIds.includes(d.id))

  const { data: saved } = await db
    .from('ai_suggestions')
    .insert({
      conversation_id: conversationId,
      trigger_message_id: triggerMessageId,
      suggested_reply: reply,
      source_doc_ids: usedDocIds,
      source_doc_titles: usedDocs.map(d => d.title),
      status: 'pending',
    })
    .select()
    .single()

  return saved ?? null
}
