import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { scheduleAutomationsForLead } from '@/lib/automation'
import { normalizePhone } from '@/lib/twilio'
import type { Lead } from '@/types'

async function getWorkspace(supabase: Awaited<ReturnType<typeof createClient>>) {
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
  const wsId = await getWorkspace(supabase)
  if (!wsId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let q = supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })

  if (status) q = q.eq('status', status)
  if (search) q = q.ilike('name', `%${search}%`)

  const { data, error } = await q
  if (error) {
    console.error('[Leads GET] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const wsId = await getWorkspace(supabase)
  if (!wsId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, phone, source, tags, notes } = body as Record<string, string>
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!phone?.trim()) return NextResponse.json({ error: 'phone is required' }, { status: 400 })

  // Normalize phone so it matches webhook-created leads
  let normalizedPhone: string
  try {
    normalizedPhone = normalizePhone(phone)
  } catch {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: lead, error } = await db
    .from('leads')
    .insert({
      workspace_id: wsId,
      name: name.trim(),
      phone: normalizedPhone,
      source: source || 'manual',
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    // Unique constraint violation → duplicate phone in workspace
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A lead with this phone number already exists in your workspace' },
        { status: 409 }
      )
    }
    console.error('[Leads POST] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.info(`[Leads] Created lead ${lead.id} phone=${normalizedPhone} workspace=${wsId}`)
  scheduleAutomationsForLead(lead as Lead).catch(err =>
    console.error('[Leads] scheduleAutomations error:', err)
  )

  return NextResponse.json(lead, { status: 201 })
}
