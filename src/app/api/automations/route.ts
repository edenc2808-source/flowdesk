import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getWsId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: wu } = await supabase.from('workspace_users').select('workspace_id').eq('id', user.id).single()
  return wu?.workspace_id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const wsId = await getWsId(supabase)
  if (!wsId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('workspace_id', wsId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const wsId = await getWsId(supabase)
  if (!wsId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { name, trigger_type, delay_minutes, message_template } = await req.json()
  if (!name || !trigger_type || !message_template) {
    return NextResponse.json({ error: 'name, trigger_type and message_template required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('automations')
    .insert({ workspace_id: wsId, name, trigger_type, delay_minutes: delay_minutes || 0, message_template })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
