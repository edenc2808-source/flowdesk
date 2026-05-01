'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Inbox, Users, Calendar, Zap, LayoutDashboard, Settings, LogOut } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/inbox',        icon: Inbox,          label: 'Inbox' },
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads',        icon: Users,           label: 'Leads' },
  { href: '/appointments', icon: Calendar,        label: 'Appointments' },
  { href: '/automations',  icon: Zap,             label: 'Automations' },
]

export default function AppSidebar() {
  const path = usePathname()
  const router = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-14 flex flex-col items-center bg-slate-900 py-4 shrink-0">
      {/* Logo */}
      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mb-6">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>

      <nav className="flex flex-col gap-1 flex-1 w-full px-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href} title={label}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}>
              <Icon size={18} />
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-1 px-2 w-full">
        <Link href="/settings" title="Settings"
          className={clsx('flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors',
            path.startsWith('/settings') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          )}>
          <Settings size={18} />
        </Link>
        <button onClick={logout} title="Sign out"
          className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}
