import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/layout/AppSidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: wu } = await db
    .from('workspace_users')
    .select('workspace_id, role, name')
    .eq('id', user.id)
    .single()

  let businessName = 'FlowDesk'
  if (wu?.workspace_id) {
    const { data: ws } = await db
      .from('workspaces')
      .select('name')
      .eq('id', wu.workspace_id)
      .single()
    if (ws?.name) businessName = ws.name
  }

  const displayName = wu?.name || user.email || '?'
  const userInitials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex h-full bg-slate-50">
      <AppSidebar
        businessName={businessName}
        userInitials={userInitials}
        userRole={wu?.role ?? 'agent'}
        userName={displayName}
      />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
