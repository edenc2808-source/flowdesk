import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizePhone, validateTwilioSignature } from '@/lib/twilio'
import { getDefaultWorkspaceId } from '@/lib/workspace'
import { buildSuggestion } from '@/app/api/ai/suggest/route'

const TWIML_OK = () => new NextResponse('<Response></Response>', {
  status: 200,
  headers: { 'Content-Type': 'text/xml' },
})

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const params = Object.fromEntries(formData.entries()) as Record<string, string>

  const sig = req.headers.get('x-twilio-signature')
  if (sig) {
    if (!validateTwilioSignature(sig, req.url, params)) {
      console.warn('[Webhook] Invalid Twilio signature — rejected')
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  return handleInbound(params)
}

async function handleInbound(body: Record<string, string>): Promise<NextResponse> {
  const from    = body.From ?? ''
  const content = (body.Body ?? '').trim()
  const to      = body.To ?? ''

  if (!from) { console.warn('[Webhook] Missing From'); return TWIML_OK() }
  if (!content) { console.info('[Webhook] Empty body from', from); return TWIML_OK() }

  const rawPhone = from.replace(/^whatsapp:/i, '')
  let phone: string
  try { phone = normalizePhone(rawPhone) }
  catch { console.warn('[Webhook] Bad phone:', rawPhone); return TWIML_OK() }

  const wsNumber = to.replace(/^whatsapp:/i, '')
  const db = createServiceClient()

  // Resolve workspace
  let workspaceId: string | null = null
  const { data: ws } = await db.from('workspaces').select('id').eq('whatsapp_number', wsNumber).maybeSingle()
  workspaceId = ws?.id ?? null
  if (!workspaceId) workspaceId = await getDefaultWorkspaceId()
  if (!workspaceId) { console.warn('[Webhook] No workspace for', wsNumber); return TWIML_OK() }

  // Find or create lead
  let { data: lead } = await db.from('leads').select('id, workspace_id, automation_paused').eq('phone', phone).maybeSingle()

  if (!lead) {
    const { data: upserted, error } = await db
      .from('leads')
      .upsert(
        { workspace_id: workspaceId, name: phone, phone, source: 'whatsapp', status: 'responded', automation_paused: true },
        { onConflict: 'workspace_id,phone', ignoreDuplicates: false }
      )
      .select('id, workspace_id, automation_paused')
      .single()
    if (error) { console.error('[Webhook] Lead upsert:', error.message); return TWIML_OK() }
    lead = upserted
  }

  if (!lead) return TWIML_OK()

  // Find or create conversation
  const { data: conv, error: convErr } = await db
    .from('conversations')
    .upsert(
      { lead_id: lead.id, workspace_id: lead.workspace_id },
      { onConflict: 'lead_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (convErr || !conv) { console.error('[Webhook] Conv upsert:', convErr?.message); return TWIML_OK() }

  // Deduplication: skip identical message within 60s
  const { count } = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conv.id)
    .eq('content', content)
    .eq('direction', 'inbound')
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())

  if (count && count > 0) { console.info('[Webhook] Duplicate, skipping'); return TWIML_OK() }

  // Save inbound message
  const { data: savedMsg, error: msgErr } = await db.from('messages').insert({
    conversation_id: conv.id,
    direction: 'inbound',
    content,
    status: 'delivered',
  }).select('id').single()

  if (msgErr) console.error('[Webhook] Message insert:', msgErr.message)

  await db.from('leads').update({ status: 'responded' }).eq('id', lead.id)

  console.info(`[Webhook] Inbound from=${phone} conv=${conv.id} len=${content.length}`)

  // Fire-and-forget AI suggestion generation (non-blocking)
  if (savedMsg?.id) {
    buildSuggestion(db, workspaceId, conv.id, content, savedMsg.id)
      .catch(err => console.error('[Webhook] AI suggestion error:', err))
  }

  return TWIML_OK()
}
