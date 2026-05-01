import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/twilio'

export async function GET(req: NextRequest) {
  const convId = new URL(req.url).searchParams.get('conversation_id')
  if (!convId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })

  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Verify conversation belongs to workspace (and agent has access)
  let convQ = db.from('conversations').select('workspace_id, assigned_agent_id').eq('id', convId).eq('workspace_id', auth.workspaceId)
  const { data: conv } = await convQ.single()
  if (!conv) return NextResponse.json({ error: 'conversation not found' }, { status: 404 })

  // Agents can only read their assigned conversations
  if (auth.role === 'agent' && conv.assigned_agent_id !== auth.userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[Messages GET] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { lead_id?: string; content?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const { lead_id, content } = body
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'content cannot be empty' }, { status: 400 })

  const db = createServiceClient()

  // Verify lead belongs to this workspace
  const { data: lead } = await db
    .from('leads')
    .select('phone, workspace_id')
    .eq('id', lead_id)
    .eq('workspace_id', auth.workspaceId)
    .single()

  if (!lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 })

  const { data: conv, error: convErr } = await db
    .from('conversations')
    .upsert(
      { lead_id, workspace_id: auth.workspaceId },
      { onConflict: 'lead_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (convErr || !conv) {
    console.error('[Messages POST] Conversation upsert error:', convErr?.message)
    return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 })
  }

  const { ok: sent, sid, error: sendError } = await sendWhatsAppMessage(lead.phone, content.trim())
  if (!sent) console.error(`[Messages POST] Twilio send failed for lead=${lead_id}:`, sendError)

  const { data: msg, error: msgErr } = await db
    .from('messages')
    .insert({
      conversation_id: conv.id,
      direction: 'outbound',
      content: content.trim(),
      status: sent ? 'sent' : 'failed',
      twilio_sid: sid || null,
    })
    .select()
    .single()

  if (msgErr) {
    console.error('[Messages POST] Message insert error:', msgErr.message)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }

  await db.from('conversations').update({
    last_message: content.trim(),
    last_message_at: new Date().toISOString(),
    unread_count: 0,
  }).eq('id', conv.id)

  return NextResponse.json({ ...msg, delivery_failed: !sent }, { status: 201 })
}
