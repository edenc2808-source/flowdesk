import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { agent_id } = await req.json()
  const db = createServiceClient()

  // Verify conversation belongs to workspace
  const { data: conv } = await db
    .from('conversations')
    .select('workspace_id')
    .eq('id', id)
    .eq('workspace_id', auth.workspaceId)
    .single()

  if (!conv) return NextResponse.json({ error: 'conversation not found' }, { status: 404 })

  // Verify agent belongs to same workspace (if provided)
  if (agent_id) {
    const { data: agent } = await db
      .from('workspace_users')
      .select('workspace_id')
      .eq('id', agent_id)
      .eq('workspace_id', auth.workspaceId)
      .single()

    if (!agent) return NextResponse.json({ error: 'agent not found in workspace' }, { status: 404 })
  }

  const { data, error } = await db
    .from('conversations')
    .update({ assigned_agent_id: agent_id || null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
