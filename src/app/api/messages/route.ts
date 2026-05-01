import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/twilio'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const convId = new URL(req.url).searchParams.get('conversation_id')
  if (!convId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })

  const { data, error } = await supabase
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { lead_id?: string; content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { lead_id, content } = body
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'content cannot be empty' }, { status: 400 })

  const db = createServiceClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('phone, workspace_id')
    .eq('id', lead_id)
    .single()

  if (!lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 })

  // Upsert conversation — prevents duplicate if two tabs send at same time
  const { data: conv, error: convErr } = await db
    .from('conversations')
    .upsert(
      { lead_id, workspace_id: lead.workspace_id },
      { onConflict: 'lead_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (convErr || !conv) {
    console.error('[Messages POST] Conversation upsert error:', convErr?.message)
    return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 })
  }

  // Send via Twilio first so we know the real status before saving
  const { ok: sent, error: sendError } = await sendWhatsAppMessage(lead.phone, content.trim())

  if (!sent) {
    console.error(`[Messages POST] Twilio send failed for lead=${lead_id}:`, sendError)
  }

  const { data: msg, error: msgErr } = await db
    .from('messages')
    .insert({
      conversation_id: conv.id,
      direction: 'outbound',
      content: content.trim(),
      status: sent ? 'sent' : 'failed',
    })
    .select()
    .single()

  if (msgErr) {
    console.error('[Messages POST] Message insert error:', msgErr.message)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }

  await db.from('conversations').update({ unread_count: 0 }).eq('id', conv.id)

  // Return the message + a flag so the UI knows if delivery failed
  return NextResponse.json({ ...msg, delivery_failed: !sent }, { status: 201 })
}
