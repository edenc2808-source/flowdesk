import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { TemplateButton } from '@/types'

interface SubmitPayload {
  template_id: string
  name: string
  category: string
  language: string
  header_type?: string | null
  header_text?: string | null
  body: string
  footer?: string | null
  buttons?: TemplateButton[]
  sample_values?: Record<string, string>
}

function buildComponents(payload: SubmitPayload) {
  const components: unknown[] = []
  const { header_type, header_text, body, footer, buttons, sample_values = {} } = payload

  // Header
  if (header_type === 'TEXT' && header_text) {
    const headerVars = (header_text.match(/\{\{(\d+)\}\}/g) || []).map(v => v.replace(/\{\{|\}\}/g, ''))
    const comp: Record<string, unknown> = { type: 'HEADER', format: 'TEXT', text: header_text }
    if (headerVars.length > 0) {
      comp.example = { header_text: headerVars.map(n => sample_values[n] || `sample_${n}`) }
    }
    components.push(comp)
  } else if (header_type === 'IMAGE') {
    components.push({
      type: 'HEADER',
      format: 'IMAGE',
      example: { header_handle: ['https://example.com/placeholder.jpg'] },
    })
  }

  // Body
  const bodyVars = (body.match(/\{\{(\d+)\}\}/g) || []).map(v => v.replace(/\{\{|\}\}/g, ''))
  const bodyComp: Record<string, unknown> = { type: 'BODY', text: body }
  if (bodyVars.length > 0) {
    bodyComp.example = { body_text: [bodyVars.map(n => sample_values[n] || `sample_${n}`)] }
  }
  components.push(bodyComp)

  // Footer
  if (footer?.trim()) {
    components.push({ type: 'FOOTER', text: footer.trim() })
  }

  // Buttons
  if (buttons && buttons.length > 0) {
    components.push({
      type: 'BUTTONS',
      buttons: buttons.map(b => {
        if (b.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: b.text }
        if (b.type === 'URL') return { type: 'URL', text: b.text, url: b.url }
        if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phone_number }
        return b
      }),
    })
  }

  return components
}

export async function POST(req: NextRequest) {
  let payload: SubmitPayload
  try { payload = await req.json() }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  if (!payload.template_id) return NextResponse.json({ error: 'template_id required' }, { status: 400 })
  if (!payload.body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const db = createServiceClient()
  const accessToken = process.env.META_ACCESS_TOKEN
  const wabaId = process.env.META_WABA_ID

  // No Meta credentials — save as draft with clear message
  if (!accessToken || !wabaId) {
    await db.from('whatsapp_templates').update({ meta_status: 'draft' }).eq('id', payload.template_id)
    return NextResponse.json({
      ok: false,
      draft: true,
      message: 'Meta connection is not configured yet. Template saved as draft.',
    })
  }

  const components = buildComponents(payload)

  let metaResponse: Record<string, unknown> = {}
  let metaError: string | null = null

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        category: payload.category,
        language: payload.language,
        components,
      }),
    })
    metaResponse = await res.json() as Record<string, unknown>
    if (!res.ok) {
      metaError = (metaResponse as { error?: { message?: string } }).error?.message || 'Meta API error'
    }
  } catch (e: unknown) {
    metaError = (e as Error).message
  }

  if (metaError) {
    await db.from('whatsapp_templates')
      .update({ meta_status: 'draft', rejection_reason: metaError })
      .eq('id', payload.template_id)
    return NextResponse.json({ ok: false, error: metaError }, { status: 422 })
  }

  const metaId = (metaResponse as { id?: string }).id || null
  await db.from('whatsapp_templates').update({
    meta_template_id: metaId,
    meta_status: 'pending',
    last_submitted_at: new Date().toISOString(),
    rejection_reason: null,
  }).eq('id', payload.template_id)

  return NextResponse.json({ ok: true, meta_template_id: metaId, status: 'pending' })
}
