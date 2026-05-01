import twilio from 'twilio'

// Lazy init — prevents module-level crash when env vars are absent (e.g. build time)
let _client: ReturnType<typeof twilio> | null = null
function getClient() {
  if (!_client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('[Twilio] TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set')
    }
    _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }
  return _client
}

function getFrom(): string {
  const num = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_NUMBER
  if (!num) throw new Error('[Twilio] TWILIO_WHATSAPP_FROM must be set')
  return num.startsWith('whatsapp:') ? num : `whatsapp:${num}`
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<{ ok: boolean; sid?: string; error?: string }> {
  if (!body.trim()) {
    console.warn('[Twilio] Attempted to send empty message to', to)
    return { ok: false, error: 'empty_message' }
  }

  const toFormatted = `whatsapp:${normalizePhone(to)}`
  const from = getFrom()

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const msg = await getClient().messages.create({ from, to: toFormatted, body })
      console.info(`[Twilio] Sent to ${toFormatted} sid=${msg.sid}`)
      return { ok: true, sid: msg.sid }
    } catch (err: unknown) {
      const twilioErr = err as { code?: number; message?: string }
      console.error(`[Twilio] Send attempt ${attempt} failed to ${toFormatted}:`, {
        code: twilioErr?.code,
        message: twilioErr?.message,
      })
      if (attempt === 1) await new Promise(r => setTimeout(r, 1500))
    }
  }

  return { ok: false, error: 'send_failed' }
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/\s/g, '').replace(/-/g, '')
  // Already E.164
  if (/^\+\d{7,15}$/.test(p)) return p
  // Strip non-digits
  p = p.replace(/\D/g, '')
  // Israeli local format
  if (p.startsWith('0') && p.length === 10) p = '972' + p.slice(1)
  return '+' + p
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!token) {
    console.error('[Twilio] Cannot validate signature: TWILIO_AUTH_TOKEN missing')
    return false
  }
  return twilio.validateRequest(token, signature, url, params)
}
