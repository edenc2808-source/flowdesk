import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: wu } = await supabase.from('workspace_users').select('workspace_id').eq('id', user.id).single()
  if (!wu) return NextResponse.json({ error: 'no workspace' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  let q = supabase
    .from('conversations')
    .select('*, lead:leads(id,name,phone,status,tags)')
    .eq('workspace_id', wu.workspace_id)
    .order('last_message_at', { ascending: false })

  if (search) {
    // Filter after fetch — Supabase doesn't support joined ilike easily
  }

  const { data, error } = await q.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const filtered = search
    ? (data || []).filter((c: { lead: { name: string } | null }) =>
        c.lead?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : data

  return NextResponse.json(filtered)
}
