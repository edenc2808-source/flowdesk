import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: wu } = await supabase.from('workspace_users').select('workspace_id').eq('id', user.id).single()
  if (!wu) return NextResponse.json({ error: 'no workspace' }, { status: 403 })

  const [{ data: leads }, { data: appts }] = await Promise.all([
    supabase.from('leads').select('status').eq('workspace_id', wu.workspace_id),
    supabase.from('appointments').select('status').eq('workspace_id', wu.workspace_id),
  ])

  return NextResponse.json({
    total_leads:       leads?.length || 0,
    contacted:         leads?.filter(l => l.status === 'contacted').length || 0,
    responded:         leads?.filter(l => l.status === 'responded').length || 0,
    no_response:       leads?.filter(l => l.status === 'no_response').length || 0,
    appointments:      appts?.filter(a => a.status !== 'cancelled').length || 0,
    closed:            leads?.filter(l => l.status === 'closed').length || 0,
  })
}
