import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/auth'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = createServiceClient()
  await db.from('conversations')
    .update({ unread_count: 0 })
    .eq('id', id)
    .eq('workspace_id', auth.workspaceId)

  return NextResponse.json({ ok: true })
}
