import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const TWIML_OK = new NextResponse('<Response></Response>', {
  status: 200,
  headers: { 'Content-Type': 'text/xml' },
})

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const params = Object.fromEntries(formData.entries()) as Record<string, string>

  const sid    = params.MessageSid
  const status = params.MessageStatus  // sent | delivered | read | failed | undelivered

  if (!sid || !status) return TWIML_OK

  console.info(`[Status] sid=${sid} status=${status}`)

  if (['delivered', 'read', 'failed', 'undelivered'].includes(status)) {
    const mapped = status === 'read' ? 'delivered' : status === 'undelivered' ? 'failed' : status as 'delivered' | 'failed' | 'sent'
    const db = createServiceClient()
    await db
      .from('messages')
      .update({ status: mapped })
      .eq('twilio_sid', sid)
  }

  return TWIML_OK
}
