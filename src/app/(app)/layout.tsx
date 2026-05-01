import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/layout/AppSidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-full bg-slate-50">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
