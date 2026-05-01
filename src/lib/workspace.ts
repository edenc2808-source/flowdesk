import { createServiceClient } from './supabase/server'

let _cachedId: string | null = null

export async function getDefaultWorkspaceId(): Promise<string | null> {
  if (_cachedId) return _cachedId

  const db = createServiceClient()

  // 1. Explicit env var
  if (process.env.WORKSPACE_ID) {
    _cachedId = process.env.WORKSPACE_ID
    return _cachedId
  }

  // 2. Match workspace by Twilio number
  const twilioNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_NUMBER
  if (twilioNumber) {
    const normalized = twilioNumber.replace(/^whatsapp:/i, '')
    const { data } = await db
      .from('workspaces')
      .select('id')
      .eq('whatsapp_number', normalized)
      .maybeSingle()
    if (data?.id) { _cachedId = data.id; return _cachedId }
  }

  // 3. First workspace
  const { data } = await db.from('workspaces').select('id').order('created_at').limit(1).maybeSingle()
  if (data?.id) { _cachedId = data.id; return _cachedId }

  return null
}
