import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizePhone, validateTwilioSignature } from '@/lib/twilio'
import { onInboundMessage } from '@/lib/automation'

const TWIML_OK = new NextResponse('<Response></Response>', {
  status: 200,
  headers: { 'Content-Type': 'text/xml' },
})

export async function POST(req: NextRequest) {
  // ── Signature validation ────────────────────────────────────────────────────
  // Skip in development (no public URL for Twilio to sign against)
  if (process.env.NODE_ENV === 'production') {
    const sig = req.headers.get('x-twilio-signature') ?? ''
    const url = req.url
    const formData = await req.formData()
    const params = Object.fromEntries(formData.entries()) as Record<string, string>

    if (!validateTwilioSignature(sig, url, params)) {
      console.warn('[Webhook] Invalid Twilio signature — rejected')
      return new NextResponse('Forbidden', { status: 403 })
    }

    return handleWebhook(params)
  }

  const formData = await req.formData()
  const params = Object.fromEntries(formData.entries()) as Record<string, string>
  return handleWebhook(params)
}

async function handleWebhook(body: Record<string, string>): Promise<NextResponse> {
  const from    = body.From ?? ''
  const content = (body.Body ?? '').trim()
  const to      = body.To ?? ''

  // Twilio can send media-only messages with empty body — log and ack
  if (!from) {
    console.warn('[Webhook] Missing From field')
    return TWIML_OK
  }
  if (!content) {
    console.info('[Webhook] Empty body (likely media message) from', from, '— acknowledged')
    return TWIML_OK
  }

  const rawPhone = from.replace(/^whatsapp:/i, '')
  let phone: string
  try {
    phone = normalizePhone(rawPhone)
  } catch {
    console.warn('[Webhook] Could not normalize phone:', rawPhone)
    return TWIML_OK
  }

  const wsNumber = to.replace(/^whatsapp:/i, '')
  const db = createServiceClient()

  console.info(`[Webhook] Inbound from=${phone} to=${wsNumber} len=${content.length}`)

  // ── Workspace lookup ────────────────────────────────────────────────────────
  const { data: ws } = await db
    .from('workspaces')
    .select('id')
    .eq('whatsapp_number', wsNumber)
    .maybeSingle()

  // ── Lead lookup / creation (upsert to prevent race-condition duplicates) ────
  // First try to find existing lead
  let { data: lead } = await db
    .from('leads')
    .select('id, workspace_id, automation_paused')
    .eq('phone', phone)
    .maybeSingle()

  if (!lead) {
    const workspaceId = ws?.id
    if (!workspaceId) {
      console.warn('[Webhook] No workspace found for number', wsNumber, '— dropping message')
      return TWIML_OK
    }

    // upsert on (workspace_id, phone) to handle concurrent webhook replays
    const { data: upserted, error: upsertErr } = await db
      .from('leads')
      .upsert(
        { workspace_id: workspaceId, name: phone, phone, source: 'whatsapp', status: 'responded', automation_paused: true },
        { onConflict: 'workspace_id,phone', ignoreDuplicates: false }
      )
      .select('id, workspace_id, automation_paused')
      .single()

    if (upsertErr) {
      console.error('[Webhook] Lead upsert error:', upsertErr.message)
      return TWIML_OK
    }
    lead = upserted
  }

  if (!lead) return TWIML_OK

  // ── Conversation lookup / creation (upsert on lead_id) ─────────────────────
  const { data: conv, error: convErr } = await db
    .from('conversations')
    .upsert(
      { lead_id: lead.id, workspace_id: lead.workspace_id },
      { onConflict: 'lead_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (convErr || !conv) {
    console.error('[Webhook] Conversation upsert error:', convErr?.message)
    return TWIML_OK
  }

  // ── Deduplication: skip if identical message arrived within 60s ─────────────
  const { count } = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conv.id)
    .eq('content', content)
    .eq('direction', 'inbound')
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())

  if (count && count > 0) {
    console.info('[Webhook] Duplicate message detected — skipping insert')
    return TWIML_OK
  }

  const { error: msgErr } = await db.from('messages').insert({
    conversation_id: conv.id,
    direction: 'inbound',
    content,
    status: 'delivered',
  })

  if (msgErr) {
    console.error('[Webhook] Message insert error:', msgErr.message)
    // Still ack Twilio — do not let message loop retry forever
  }

  await onInboundMessage(lead.id)

  return TWIML_OK
}
