import { createServiceClient } from './supabase/server'
import { sendWhatsAppMessage } from './twilio'
import { addMinutes } from 'date-fns'
import type { Lead, Automation } from '@/types'

function renderTemplate(template: string, lead: Lead, workspace: { name: string }): string {
  return template
    .replace(/\{\{name\}\}/g, lead.name)
    .replace(/\{\{phone\}\}/g, lead.phone)
    .replace(/\{\{workspace\}\}/g, workspace.name)
    .replace(/\{\{source\}\}/g, lead.source)
}

export async function scheduleAutomationsForLead(lead: Lead): Promise<void> {
  const db = createServiceClient()

  const { data: workspace } = await db
    .from('workspaces')
    .select('name')
    .eq('id', lead.workspace_id)
    .single()
  if (!workspace) return

  const { data: automations } = await db
    .from('automations')
    .select('*')
    .eq('workspace_id', lead.workspace_id)
    .eq('trigger_type', 'lead_created')
    .eq('is_active', true)

  if (!automations?.length) return

  const now = new Date()
  const jobs = automations.map((a: Automation) => ({
    lead_id:       lead.id,
    automation_id: a.id,
    scheduled_at:  addMinutes(now, a.delay_minutes).toISOString(),
  }))

  // ignoreDuplicates prevents double-scheduling if called twice for same lead
  const { error } = await db.from('automation_jobs').upsert(jobs, {
    onConflict: 'lead_id,automation_id',
    ignoreDuplicates: true,
  })
  if (error) console.error('[Automation] Schedule error:', error.message)
}

export async function onInboundMessage(leadId: string): Promise<void> {
  const db = createServiceClient()

  const [leadRes, cancelRes] = await Promise.all([
    db.from('leads')
      .update({ status: 'responded', automation_paused: true, updated_at: new Date().toISOString() })
      .eq('id', leadId),
    db.from('automation_jobs')
      .update({ status: 'cancelled' })
      .eq('lead_id', leadId)
      .eq('status', 'pending'),
  ])

  if (leadRes.error) console.error('[Automation] onInbound lead update error:', leadRes.error.message)
  if (cancelRes.error) console.error('[Automation] onInbound cancel jobs error:', cancelRes.error.message)
}

export async function processPendingJobs(): Promise<{ processed: number; failed: number }> {
  const db = createServiceClient()
  const now = new Date().toISOString()

  const { data: jobs, error } = await db
    .from('automation_jobs')
    .select('*, leads(*), automations(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(50)

  if (error) {
    console.error('[Automation] processPendingJobs fetch error:', error.message)
    return { processed: 0, failed: 0 }
  }
  if (!jobs?.length) return { processed: 0, failed: 0 }

  // Batch-fetch all unique workspaces needed (avoid N+1)
  const wsIds = [...new Set(jobs.map((j: { leads: { workspace_id: string } }) => j.leads?.workspace_id).filter(Boolean))]
  const { data: workspaces } = await db.from('workspaces').select('id, name').in('id', wsIds)
  const wsMap = Object.fromEntries((workspaces ?? []).map((w: { id: string; name: string }) => [w.id, w]))

  let processed = 0
  let failed = 0

  for (const job of jobs) {
    try {
      await processJob(db, job, wsMap)
      processed++
    } catch (err) {
      console.error(`[Automation] Job ${job.id} threw unexpectedly:`, err)
      failed++
      // Mark failed so it doesn't loop forever
      await db.from('automation_jobs').update({ status: 'cancelled' }).eq('id', job.id)
    }
  }

  console.info(`[Automation] Processed ${processed} jobs, ${failed} failed`)
  return { processed, failed }
}

async function processJob(
  db: ReturnType<typeof createServiceClient>,
  job: Record<string, unknown>,
  wsMap: Record<string, { id: string; name: string }>
): Promise<void> {
  const lead = job.leads as Lead
  const auto = job.automations as Automation

  if (!lead || lead.automation_paused || !auto?.is_active) {
    await db.from('automation_jobs').update({ status: 'cancelled' }).eq('id', job.id)
    return
  }

  const workspace = wsMap[lead.workspace_id] ?? { name: '' }
  const message = renderTemplate(auto.message_template, lead, workspace)

  // Upsert conversation
  const { data: conv } = await db
    .from('conversations')
    .upsert(
      { lead_id: lead.id, workspace_id: lead.workspace_id },
      { onConflict: 'lead_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  const { ok, error: sendError } = await sendWhatsAppMessage(lead.phone, message)

  if (conv) {
    await db.from('messages').insert({
      conversation_id: conv.id,
      direction: 'outbound',
      content: message,
      status: ok ? 'sent' : 'failed',
    })
  }

  await db.from('automation_jobs')
    .update({ status: ok ? 'sent' : 'cancelled' })
    .eq('id', job.id)

  if (!ok) {
    console.warn(`[Automation] Job ${job.id} message not delivered:`, sendError)
  }
}
