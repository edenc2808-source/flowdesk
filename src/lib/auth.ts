import { createClient } from './supabase/server'

export interface AuthContext {
  userId: string
  workspaceId: string
  role: string
  name: string | null
  email: string
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: wu } = await supabase
    .from('workspace_users')
    .select('workspace_id, role, name')
    .eq('id', user.id)
    .single()

  if (!wu) return null

  return {
    userId: user.id,
    workspaceId: wu.workspace_id,
    role: wu.role ?? 'agent',
    name: wu.name ?? null,
    email: user.email ?? '',
  }
}
