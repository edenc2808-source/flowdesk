import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/seed — seeds a workspace + demo data into Supabase
// Protected by CRON_SECRET env var (pass as ?secret=xxx or Authorization: Bearer xxx)
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    const qs   = new URL(req.url).searchParams.get('secret') ?? ''
    if (auth !== `Bearer ${secret}` && qs !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const db = createServiceClient()
  const twilioNumber = (process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_NUMBER || '').replace(/^whatsapp:/i, '')

  // 1. Ensure workspace exists
  let workspaceId: string
  const { data: existingWs } = await db
    .from('workspaces')
    .select('id')
    .eq('whatsapp_number', twilioNumber || 'demo')
    .maybeSingle()

  if (existingWs) {
    workspaceId = existingWs.id
  } else {
    const { data: ws, error } = await db
      .from('workspaces')
      .insert({ name: 'FlowDesk Demo', industry_type: 'beauty', whatsapp_number: twilioNumber || 'demo' })
      .select('id')
      .single()
    if (error || !ws) return NextResponse.json({ error: `workspace: ${error?.message}` }, { status: 500 })
    workspaceId = ws.id
  }

  // 2. Seed leads
  const now = Date.now()
  const m = (n: number) => new Date(now - n * 60000).toISOString()
  const h = (n: number) => new Date(now - n * 3600000).toISOString()
  const d = (n: number) => new Date(now - n * 86400000).toISOString()

  const leadsData = [
    { workspace_id: workspaceId, name: 'יעל כהן',       phone: '+972501234567', source: 'website',  status: 'responded',   tags: ['הסרת שיער', 'חדשה'],  notes: 'מעוניינת בחבילה מלאה' },
    { workspace_id: workspaceId, name: 'מיכל לוי',      phone: '+972523456789', source: 'social',   status: 'appointment', tags: ['בוטוקס', 'vip'],       notes: 'לקוחה קבועה מזה 2 שנים' },
    { workspace_id: workspaceId, name: 'שרה מזרחי',     phone: '+972545678901', source: 'referral', status: 'responded',   tags: ['ניקוי עמוק'],           notes: null },
    { workspace_id: workspaceId, name: 'נועה שפירא',    phone: '+972537890123', source: 'google',   status: 'new',         tags: ['פנים'],                 notes: null },
    { workspace_id: workspaceId, name: 'תמר ברקוביץ',   phone: '+972589012345', source: 'social',   status: 'no_response', tags: ['הסרת שיער'],            notes: "לא הגיעה לפגישה" },
    { workspace_id: workspaceId, name: 'דינה פרידמן',   phone: '+972501111222', source: 'website',  status: 'contacted',   tags: ['גבות', 'צבע'],          notes: null },
    { workspace_id: workspaceId, name: 'הדר גרינברג',   phone: '+972522222333', source: 'referral', status: 'appointment', tags: ['מסאג', 'vip'],          notes: 'פגישה מחר' },
    { workspace_id: workspaceId, name: 'ליאת אדלשטיין', phone: '+972543333444', source: 'google',   status: 'responded',   tags: ['ניקוי עמוק', 'פנים'],   notes: null },
  ]

  const insertedLeads: Array<{ id: string; name: string; phone: string }> = []
  for (const lead of leadsData) {
    const { data } = await db
      .from('leads')
      .upsert(lead, { onConflict: 'workspace_id,phone', ignoreDuplicates: false })
      .select('id, name, phone')
      .single()
    if (data) insertedLeads.push(data)
  }

  // 3. Seed conversations + messages
  const convMessages: Array<{ lead: { id: string; name: string }; msgs: Array<{ direction: string; content: string; ago: number }> }> = [
    {
      lead: insertedLeads[0],
      msgs: [
        { direction: 'inbound',  content: 'שלום! ראיתי את הפרסום שלכן על הסרת שיער. אפשר לקבל פרטים?', ago: 240 },
        { direction: 'outbound', content: 'שלום יעל! ברוכה הבאה 😊 כמובן שנשמח לעזור. איזה אזור מעניין אותך?', ago: 228 },
        { direction: 'inbound',  content: 'רגליים ובית שחי. כמה עולה?', ago: 210 },
        { direction: 'outbound', content: 'חבילת רגליים מלאה + בית שחי מתחילה מ-1,200 ש"ח ל-6 טיפולים. יש לנו מקום מחר ב-14:00 😊', ago: 180 },
        { direction: 'inbound',  content: 'מחר ב-14:00 מעולה!', ago: 5 },
      ],
    },
    {
      lead: insertedLeads[1],
      msgs: [
        { direction: 'inbound',  content: 'שלום, רוצה לקבוע בוטוקס', ago: 360 },
        { direction: 'outbound', content: 'שלום מיכל! ביום שלישי ב-11:00 יש מקום פנוי 🌸', ago: 330 },
        { direction: 'inbound',  content: 'מצוין! מאשרת', ago: 300 },
        { direction: 'outbound', content: 'מעולה! שלחנו תזכורת ב-WhatsApp. מחכות לך! 💙', ago: 280 },
        { direction: 'inbound',  content: 'תודה, מחכה לפגישה 😊', ago: 300 },
      ],
    },
    {
      lead: insertedLeads[2],
      msgs: [
        { direction: 'outbound', content: 'שלום שרה! איך היה הטיפול? 😊', ago: 90 },
        { direction: 'inbound',  content: 'כל כך נהניתי מהטיפול!', ago: 60 },
      ],
    },
    {
      lead: insertedLeads[3],
      msgs: [
        { direction: 'inbound',  content: 'שלום, רוצה לשאול על מחירים', ago: 180 },
        { direction: 'outbound', content: 'שלום נועה! שמחות שפנית אלינו 🌸 איזה טיפול מעניין אותך?', ago: 170 },
      ],
    },
    {
      lead: insertedLeads[4],
      msgs: [
        { direction: 'inbound', content: 'מצטערת, שכחתי לבטל... אפשר לקבוע מחדש?', ago: 2880 },
        { direction: 'outbound', content: 'כמובן! שלחי לנו מתי נוח לך 😊', ago: 2860 },
      ],
    },
  ]

  let convCount = 0
  let msgCount = 0

  for (const { lead, msgs } of convMessages) {
    if (!lead?.id) continue

    const { data: conv } = await db
      .from('conversations')
      .upsert({ lead_id: lead.id, workspace_id: workspaceId }, { onConflict: 'lead_id', ignoreDuplicates: false })
      .select('id')
      .single()

    if (!conv) continue
    convCount++

    // Only insert if no messages yet
    const { count } = await db.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id)
    if (count && count > 0) continue

    for (const msg of msgs) {
      await db.from('messages').insert({
        conversation_id: conv.id,
        direction: msg.direction,
        content: msg.content,
        status: 'delivered',
        created_at: m(msg.ago),
      })
      msgCount++
    }

    const last = msgs[msgs.length - 1]
    await db.from('conversations').update({
      last_message: last.content,
      last_message_at: m(last.ago),
      unread_count: msgs.filter(x => x.direction === 'inbound').length,
    }).eq('id', conv.id)
  }

  return NextResponse.json({
    ok: true,
    workspace_id: workspaceId,
    leads: insertedLeads.length,
    conversations: convCount,
    messages: msgCount,
  })
}
