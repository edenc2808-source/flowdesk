import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Calendar, TrendingUp, Clock, Users, AlertCircle, CheckCircle, BarChart2 } from 'lucide-react'
import { DEMO_STATS, DEMO_CONVERSATIONS, DEMO_APPOINTMENTS } from '@/lib/demo-data'

async function getStats() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: wu } = await supabase.from('workspace_users').select('workspace_id').eq('id', user.id).single()
    if (!wu) return null

    const [{ data: leads }, { data: appts }] = await Promise.all([
      supabase.from('leads').select('status').eq('workspace_id', wu.workspace_id),
      supabase.from('appointments').select('status, date').eq('workspace_id', wu.workspace_id),
    ])

    const now = new Date()
    const today = now.toISOString().slice(0, 10)

    return {
      total_conversations: leads?.length ?? 0,
      unread: 0,
      new_today: leads?.filter(l => l.status === 'new').length ?? 0,
      avg_response_time: '—',
      appointments_today: appts?.filter(a => a.date?.slice(0, 10) === today).length ?? 0,
      appointments_week: appts?.filter(a => !['cancelled'].includes(a.status)).length ?? 0,
      no_show_rate: appts?.length ? Math.round((appts.filter(a => a.status === 'no_response').length / appts.length) * 100) : 0,
      conversion_rate: leads?.length ? Math.round((leads.filter(l => l.status === 'appointment').length / leads.length) * 100) : 0,
      follow_ups_due: leads?.filter(l => l.status === 'no_response').length ?? 0,
    }
  } catch {
    return null
  }
}

export default async function AnalyticsPage() {
  const realStats = await getStats()
  const stats = realStats ?? DEMO_STATS

  const kpis = [
    { icon: MessageSquare, label: 'סה״כ שיחות',     value: stats.total_conversations, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: AlertCircle,   label: 'לא נקראו',        value: stats.unread,              color: 'text-red-500',    bg: 'bg-red-50' },
    { icon: Users,         label: 'חדשים היום',       value: stats.new_today,           color: 'text-blue-600',  bg: 'bg-blue-50' },
    { icon: Clock,         label: 'זמן תגובה ממוצע', value: stats.avg_response_time,   color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Calendar,      label: 'פגישות היום',      value: stats.appointments_today,  color: 'text-purple-600',bg: 'bg-purple-50' },
    { icon: Calendar,      label: 'פגישות השבוע',     value: stats.appointments_week,   color: 'text-violet-600',bg: 'bg-violet-50' },
    { icon: TrendingUp,    label: 'המרה לפגישה',      value: `${stats.conversion_rate}%`,color: 'text-teal-600', bg: 'bg-teal-50' },
    { icon: CheckCircle,   label: 'מעקבים נדרשים',   value: stats.follow_ups_due,      color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  // Conversation status breakdown from demo data
  const convsByStatus = [
    { label: 'חדש',          count: DEMO_CONVERSATIONS.filter(c => c.lead?.status === 'new').length,         color: 'bg-blue-500' },
    { label: 'ממתין לתגובה', count: DEMO_CONVERSATIONS.filter(c => c.lead?.status === 'responded').length,   color: 'bg-amber-400' },
    { label: 'פגישה',         count: DEMO_CONVERSATIONS.filter(c => c.lead?.status === 'appointment').length, color: 'bg-purple-500' },
    { label: 'נדרש מעקב',    count: DEMO_CONVERSATIONS.filter(c => c.lead?.status === 'no_response').length, color: 'bg-red-400' },
    { label: 'סגור',          count: DEMO_CONVERSATIONS.filter(c => c.lead?.status === 'closed').length,      color: 'bg-slate-400' },
  ]

  const maxCount = Math.max(...convsByStatus.map(s => s.count), 1)

  const apptsByStatus = [
    { label: 'נקבעה',    count: DEMO_APPOINTMENTS.filter(a => a.status === 'scheduled').length,  color: 'bg-blue-500' },
    { label: 'אושרה',    count: DEMO_APPOINTMENTS.filter(a => a.status === 'confirmed').length,  color: 'bg-green-500' },
    { label: 'הגיע',     count: DEMO_APPOINTMENTS.filter(a => a.status === 'arrived').length,    color: 'bg-teal-500' },
    { label: 'לא הגיע',  count: DEMO_APPOINTMENTS.filter(a => a.status === 'no_show').length,    color: 'bg-red-400' },
    { label: 'בוטל',     count: DEMO_APPOINTMENTS.filter(a => a.status === 'cancelled').length,  color: 'bg-slate-400' },
  ]

  const maxAppt = Math.max(...apptsByStatus.map(s => s.count), 1)

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">אנליטיקס</h1>
        <p className="text-sm text-slate-500">
          {realStats ? 'נתונים אמיתיים מ-Supabase' : 'מוצג נתוני דמו — התחבר לראות נתונים אמיתיים'}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${k.bg}`}>
              <k.icon size={18} className={k.color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversations by status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-800 text-sm">שיחות לפי סטטוס</h2>
          </div>
          <div className="space-y-3">
            {convsByStatus.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-28 text-right">{s.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color} transition-all`}
                    style={{ width: `${Math.max((s.count / maxCount) * 100, s.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 text-center">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments by status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-purple-500" />
            <h2 className="font-semibold text-slate-800 text-sm">פגישות לפי סטטוס</h2>
          </div>
          <div className="space-y-3">
            {apptsByStatus.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-20 text-right">{s.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color} transition-all`}
                    style={{ width: `${Math.max((s.count / maxAppt) * 100, s.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 text-center">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* No-show rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-4">שיעור אי-הגעה</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4"
                  strokeDasharray={`${stats.no_show_rate * 0.88} 88`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-slate-800">
                {stats.no_show_rate}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{stats.no_show_rate}% לא הגיעו</p>
              <p className="text-xs text-slate-500 mt-1">מתוך סה״כ הפגישות</p>
              <p className="text-xs text-slate-400 mt-2">אוטומציות מעקב יכולות להפחית מספר זה</p>
            </div>
          </div>
        </div>

        {/* Conversion rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-4">שיעור המרה לפגישה</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#6366f1" strokeWidth="4"
                  strokeDasharray={`${stats.conversion_rate * 0.88} 88`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-slate-800">
                {stats.conversion_rate}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{stats.conversion_rate}% המרה</p>
              <p className="text-xs text-slate-500 mt-1">שיחות שהפכו לפגישות</p>
              <p className="text-xs text-slate-400 mt-2">ממוצע תעשייתי: ~40–60%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
