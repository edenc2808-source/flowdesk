'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare, Users, Calendar, Zap, FileText,
  Send, BarChart2, Settings, LogOut, UserCog, Brain,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/inbox',              icon: MessageSquare, label: 'תיבת דואר' },
  { href: '/contacts',           icon: Users,         label: 'אנשי קשר' },
  { href: '/appointments',       icon: Calendar,      label: 'פגישות' },
  { href: '/automations',        icon: Zap,           label: 'אוטומציות' },
  { href: '/ai-agent/knowledge', icon: Brain,         label: 'מאגר ידע AI' },
  { href: '/templates',          icon: FileText,      label: 'תבניות' },
  { href: '/campaigns',          icon: Send,          label: 'קמפיינים' },
  { href: '/analytics',          icon: BarChart2,     label: 'אנליטיקס' },
]

interface Props {
  businessName: string
  userInitials: string
  userRole: string
  userName: string
}

export default function AppSidebar({ businessName, userInitials, userRole, userName }: Props) {
  const path = usePathname()
  const router = useRouter()

  async function logout() {
    try { await createClient().auth.signOut() } catch {}
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-14 flex flex-col items-center bg-slate-900 py-4 shrink-0 z-10 relative">
      {/* Logo — tooltip shows business name */}
      <div
        title={businessName}
        className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center mb-5 shrink-0 cursor-default"
      >
        <MessageSquare size={18} className="text-white" />
      </div>

      <nav className="flex flex-col gap-1 flex-1 w-full px-2 min-h-0 overflow-hidden">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-xl mx-auto transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <Icon size={18} />
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-1 px-2 w-full shrink-0">
        {userRole === 'admin' && (
          <Link
            href="/team"
            title="ניהול צוות"
            className={clsx(
              'flex items-center justify-center w-10 h-10 rounded-xl mx-auto transition-colors',
              path.startsWith('/team')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            <UserCog size={18} />
          </Link>
        )}
        <Link
          href="/settings"
          title="הגדרות"
          className={clsx(
            'flex items-center justify-center w-10 h-10 rounded-xl mx-auto transition-colors',
            path.startsWith('/settings')
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          )}
        >
          <Settings size={18} />
        </Link>

        {/* User avatar — shows name + role on hover, click to logout */}
        <button
          onClick={logout}
          title={`${userName} (${userRole === 'admin' ? 'מנהל' : 'סוכן'}) — ${businessName}\nלחץ להתנתקות`}
          className="flex items-center justify-center w-10 h-10 rounded-xl mx-auto bg-slate-700 hover:bg-red-600 text-slate-200 hover:text-white transition-colors text-xs font-bold shrink-0"
        >
          {userInitials}
        </button>
        <div title="התנתק" className="flex items-center justify-center">
          <button
            onClick={logout}
            className="flex items-center justify-center w-8 h-6 text-slate-600 hover:text-red-400 transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
