import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const templateId = searchParams.get('id')
  const templateName = searchParams.get('name')

  if (!templateId && !templateName) {
    return NextResponse.json({ error: 'id or name required' }, { status: 400 })
  }

  const db = createServiceClient()

  // Fetch template from DB
  let q = db.from('whatsapp_templates').select('*')
  if (templateId) q = q.eq('id', templateId)
  else q = q.eq('name', templateName!)

  const { data: tpl, error: dbErr } = await q.maybeSingle()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  if (!tpl) return NextResponse.json({ error: 'template not found' }, { status: 404 })

  const accessToken = process.env.META_ACCESS_TOKEN
  const wabaId = process.env.META_WABA_ID

  // No Meta credentials — return local status
  if (!accessToken || !wabaId) {
    return NextResponse.json({ status: tpl.meta_status, source: 'local', template: tpl })
  }

  // Query Meta
  try {
    const name = tpl.name
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${wabaId}/message_templates?name=${encodeURIComponent(name)}&fields=id,name,status,rejected_reason`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const meta = await res.json() as { data?: Array<{ id: string; status: string; rejected_reason?: string }> }
    const metaTpl = meta.data?.[0]

    if (metaTpl) {
      const newStatus = metaTpl.status.toLowerCase() as string
      await db.from('whatsapp_templates').update({
        meta_status: newStatus,
        rejection_reason: metaTpl.rejected_reason || null,
      }).eq('id', tpl.id)

      return NextResponse.json({
        status: newStatus,
        source: 'meta',
        rejection_reason: metaTpl.rejected_reason || null,
        template: { ...tpl, meta_status: newStatus },
      })
    }
  } catch {
    // fall through to local
  }

  return NextResponse.json({ status: tpl.meta_status, source: 'local', template: tpl })
}
