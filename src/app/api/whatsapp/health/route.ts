import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getDefaultWorkspaceId } from '@/lib/workspace'

export async function GET() {
  const checks: Record<string, boolean | string> = {}

  checks.twilio_sid  = !!process.env.TWILIO_ACCOUNT_SID
  checks.twilio_auth = !!process.env.TWILIO_AUTH_TOKEN
  checks.twilio_from = !!process.env.TWILIO_WHATSAPP_FROM || !!process.env.TWILIO_WHATSAPP_NUMBER
  checks.supabase_url  = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  checks.supabase_anon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  checks.supabase_srk  = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  let dbOk = false
  let workspaceId: string | null = null
  try {
    workspaceId = await getDefaultWorkspaceId()
    dbOk = !!workspaceId
    checks.db = dbOk
    checks.workspace_id = workspaceId ?? 'not found'
  } catch (e: unknown) {
    checks.db = `error: ${(e as Error).message}`
  }

  let messageCount = 0
  if (workspaceId) {
    try {
      const db = createServiceClient()
      const { count } = await db
        .from('messages')
        .select('id', { count: 'exact', head: true })
      messageCount = count ?? 0
    } catch {}
  }

  const allOk = Object.values(checks).every(v => v === true || typeof v === 'string' && !v.startsWith('error'))

  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    checks,
    message_count: messageCount,
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://project-c6k1f.vercel.app'}/api/whatsapp/webhook`,
    status_url:  `${process.env.NEXT_PUBLIC_APP_URL || 'https://project-c6k1f.vercel.app'}/api/whatsapp/status`,
    ts: new Date().toISOString(),
  }, { status: allOk ? 200 : 207 })
}
