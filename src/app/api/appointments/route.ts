import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/twilio'
import { format, subMinutes } from 'date-fns'

async function getWorkspaceId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: wu } = await supabase
    .from('workspace_users')
    .select('workspace_id')
    .eq('id', user.id)
    .single()
  return wu?.workspace_id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const wsId = await getWorkspaceId(supabase)
  if (!wsId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('appointments')
    .select('*, lead:leads(name,phone)')
    .eq('workspace_id', wsId)
    .order('date', { ascending: true })

  if (error) {
    console.error('[Appointments GET]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const wsId = await getWorkspaceId(supabase)
  if (!wsId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { lead_id, date, title, notes, send_confirmation } = body as Record<string, string | boolean>

  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
  if (!date)    return NextResponse.json({ error: 'date required' }, { status: 400 })

  // Reject appointments in the past
  const apptDate = new Date(date as string)
  if (isNaN(apptDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }
  if (apptDate < new Date()) {
    return NextResponse.json({ error: 'Appointment date must be in the future' }, { status: 400 })
  }

  const db = createServiceClient()

  // Verify lead belongs to workspace
  const { data: lead } = await db
    .from('leads')
    .select('phone, name, workspace_id')
    .eq('id', lead_id)
    .eq('workspace_id', wsId)
    .single()

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const { data: appt, error } = await db
    .from('appointments')
    .insert({
      lead_id,
      workspace_id: wsId,
      date: apptDate.toISOString(),
      title: (title as string)?.trim() || null,
      status: 'confirmed',
      notes: (notes as string)?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[Appointments POST] Insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update lead status
  await db
    .from('leads')
    .update({ status: 'appointment', automation_paused: true, updated_at: new Date().toISOString() })
    .eq('id', lead_id)

  // Send WhatsApp confirmation (non-blocking, log failure)
  if (send_confirmation !== false) {
    const dateStr = format(apptDate, 'dd/MM/yyyy HH:mm')
    const msg = `Your appointment is confirmed for ${dateStr}. See you then!`
    const { ok } = await sendWhatsAppMessage(lead.phone, msg)
    if (!ok) console.warn(`[Appointments] Confirmation not delivered to ${lead.phone}`)
  }

  // Schedule reminder from automation config
  const { data: reminderAuto } = await db
    .from('automations')
    .select('id, delay_minutes, message_template')
    .eq('workspace_id', wsId)
    .eq('trigger_type', 'appointment_reminder')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (reminderAuto) {
    // delay_minutes here means "how many minutes before the appointment"
    const delayMins = reminderAuto.delay_minutes || 1440 // default 24h
    const scheduledAt = subMinutes(apptDate, delayMins)

    if (scheduledAt > new Date()) {
      const { error: jobErr } = await db.from('automation_jobs').insert({
        lead_id,
        automation_id: reminderAuto.id,
        scheduled_at: scheduledAt.toISOString(),
      })
      if (jobErr && jobErr.code !== '23505') { // ignore duplicate-pending constraint
        console.warn('[Appointments] Could not schedule reminder:', jobErr.message)
      }
    }
  }

  console.info(`[Appointments] Created ${appt.id} for lead=${lead_id} at ${apptDate.toISOString()}`)
  return NextResponse.json(appt, { status: 201 })
}
