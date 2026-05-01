import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/twilio'
import { getDefaultWorkspaceId } from '@/lib/workspace'

export async function POST(req: NextRequest) {
  let body: { to?: string; body?: string; lead_id?: string; conversation_id?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const { to, body: msgBody, lead_id, conversation_id } = body
  if (!msgBody?.trim()) return NextResponse.json({ error: 'body is required' }, { status: 400 })
  if (!to && !lead_id) return NextResponse.json({ error: 'to or lead_id is required' }, { status: 400 })

  const db = createServiceClient()
  let phone = to
  let leadId = lead_id
  let convId = conversation_id
  let wsId: string | null = null

  if (lead_id) {
    const { data: lead } = await db.from('leads').select('phone, workspace_id').eq('id', lead_id).single()
    if (!lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 })
    phone = lead.phone
    wsId = lead.workspace_id
    leadId = lead_id
  }

  if (!wsId) wsId = await getDefaultWorkspaceId()
  if (!wsId) return NextResponse.json({ error: 'no workspace' }, { status: 503 })
  if (!phone) return NextResponse.json({ error: 'no phone number' }, { status: 400 })

  // Ensure conversation exists
  if (leadId && !convId) {
    const { data: conv } = await db
      .from('conversations')
      .upsert({ lead_id: leadId, workspace_id: wsId }, { onConflict: 'lead_id', ignoreDuplicates: false })
      .select('id')
      .single()
    convId = conv?.id
  }

  const { ok, sid, error: sendErr } = await sendWhatsAppMessage(phone, msgBody.trim())
  if (!ok) console.error('[WhatsApp send] Twilio error:', sendErr)

  let savedMsg = null
  if (convId) {
    const { data } = await db
      .from('messages')
      .insert({
        conversation_id: convId,
        direction: 'outbound',
        content: msgBody.trim(),
        status: ok ? 'sent' : 'failed',
        twilio_sid: sid || null,
      })
      .select()
      .single()
    savedMsg = data

    await db.from('conversations').update({
      last_message: msgBody.trim(),
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    }).eq('id', convId)
  }

  return NextResponse.json({ ok, message: savedMsg, delivery_failed: !ok }, { status: ok ? 200 : 207 })
}
