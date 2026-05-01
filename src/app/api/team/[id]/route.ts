import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

async function verifyMemberInWorkspace(db: ReturnType<typeof createServiceClient>, memberId: string, workspaceId: string) {
  const { data } = await db.from('workspace_users').select('workspace_id').eq('id', memberId).single()
  return data?.workspace_id === workspaceId
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'admin required' }, { status: 403 })
  if (id === auth.userId) return NextResponse.json({ error: 'cannot change your own role' }, { status: 400 })

  const { role } = await req.json()
  if (!['admin', 'agent'].includes(role)) return NextResponse.json({ error: 'invalid role' }, { status: 400 })

  const db = createServiceClient()
  if (!(await verifyMemberInWorkspace(db, id, auth.workspaceId))) {
    return NextResponse.json({ error: 'member not found' }, { status: 404 })
  }

  const { data, error } = await db
    .from('workspace_users')
    .update({ role })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'admin required' }, { status: 403 })
  if (id === auth.userId) return NextResponse.json({ error: 'cannot remove yourself' }, { status: 400 })

  const db = createServiceClient()
  if (!(await verifyMemberInWorkspace(db, id, auth.workspaceId))) {
    return NextResponse.json({ error: 'member not found' }, { status: 404 })
  }

  const { error } = await db.from('workspace_users').delete().eq('id', id).eq('workspace_id', auth.workspaceId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
