import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  const db = createServiceClient()

  let q = db
    .from('conversations')
    .select('*, lead:leads(id,name,phone,status,tags)')
    .eq('workspace_id', auth.workspaceId)
    .order('last_message_at', { ascending: false })
    .limit(100)

  // Agents only see conversations assigned to them
  if (auth.role === 'agent') {
    q = q.eq('assigned_agent_id', auth.userId)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const filtered = search
    ? (data || []).filter((c: { lead: { name: string } | null }) =>
        c.lead?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : data

  return NextResponse.json(filtered)
}
