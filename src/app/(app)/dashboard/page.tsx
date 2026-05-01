import { createClient } from '@/lib/supabase/server'

async function getStats(wsId: string) {
  const supabase = await createClient()
  const [{ data: leads }, { data: appts }] = await Promise.all([
    supabase.from('leads').select('status').eq('workspace_id', wsId),
    supabase.from('appointments').select('status').eq('workspace_id', wsId),
  ])
  return {
    total:       leads?.length ?? 0,
    contacted:   leads?.filter(l => l.status === 'contacted').length ?? 0,
    responded:   leads?.filter(l => l.status === 'responded').length ?? 0,
    no_response: leads?.filter(l => l.status === 'no_response').length ?? 0,
    appointments: appts?.filter(a => a.status !== 'cancelled').length ?? 0,
    closed:      leads?.filter(l => l.status === 'closed').length ?? 0,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: wu } = await supabase.from('workspace_users').select('workspace_id').eq('id', user!.id).single()
  const { data: ws } = await supabase.from('workspaces').select('name').eq('id', wu!.workspace_id).single()
  const stats = await getStats(wu!.workspace_id)

  const cards = [
    { label: 'Total Leads',    value: stats.total,       bg: 'bg-slate-50',   text: 'text-slate-700',  border: 'border-slate-200' },
    { label: 'Responded',      value: stats.responded,   bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
    { label: 'Appointments',   value: stats.appointments, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { label: 'No Response',    value: stats.no_response, bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200' },
    { label: 'Closed',         value: stats.closed,      bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200' },
  ]

  const convRate = stats.total > 0 ? Math.round((stats.appointments / stats.total) * 100) : 0
  const respRate = stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0

  return (
    <div className="p-8 overflow-y-auto h-full">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{ws?.name ?? 'Dashboard'}</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your workspace</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {cards.map(c => (
            <div key={c.label} className={`rounded-xl p-4 border ${c.bg} ${c.border}`}>
              <div className={`text-2xl font-bold ${c.text}`}>{c.value}</div>
              <div className={`text-xs font-medium mt-1 ${c.text} opacity-70`}>{c.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="Response Rate" value={`${respRate}%`} sub={`${stats.responded} of ${stats.total} leads replied`} />
          <MetricCard label="Conversion Rate" value={`${convRate}%`} sub={`${stats.appointments} appointments from ${stats.total} leads`} />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}
