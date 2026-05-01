'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, X, Check } from 'lucide-react'
import clsx from 'clsx'
import type { Appointment } from '@/types'

type ApptWithLead = Appointment & { lead: { name: string; phone: string } | null }

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<ApptWithLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/appointments')
    setAppts(await res.json())
    setLoading(false)
  }

  async function cancel(id: string) {
    await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' })
    load()
  }

  const upcoming = appts.filter(a => a.status !== 'cancelled' && new Date(a.date) >= new Date())
  const past     = appts.filter(a => a.status === 'cancelled' || new Date(a.date) < new Date())

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Appointments</h1>
        <p className="text-sm text-slate-500">{upcoming.length} upcoming</p>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-10 text-sm">Loading...</div>
      ) : (
        <>
          <Group title="Upcoming" appts={upcoming} onCancel={cancel} />
          {past.length > 0 && <Group title="Past / Cancelled" appts={past} onCancel={cancel} />}
        </>
      )}
    </div>
  )
}

function Group({ title, appts, onCancel }: { title: string; appts: ApptWithLead[]; onCancel: (id: string) => void }) {
  if (!appts.length) return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm mb-4">
      <Calendar size={24} className="mx-auto mb-2 opacity-40" />
      No {title.toLowerCase()}
    </div>
  )

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
        {appts.map(appt => (
          <div key={appt.id} className="flex items-center gap-4 px-5 py-4">
            <div className="text-center min-w-[48px]">
              <div className="text-lg font-bold text-slate-800">{format(new Date(appt.date), 'd')}</div>
              <div className="text-xs text-slate-400">{format(new Date(appt.date), 'MMM')}</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">{appt.lead?.name ?? '—'}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {format(new Date(appt.date), 'HH:mm')}
                {appt.title ? ` · ${appt.title}` : ''}
                {appt.notes ? ` · ${appt.notes}` : ''}
              </p>
            </div>
            <span className={clsx('text-xs px-2.5 py-1 rounded-full border font-medium', STATUS_STYLES[appt.status])}>
              {appt.status}
            </span>
            {appt.status !== 'cancelled' && (
              <button onClick={() => onCancel(appt.id)} title="Cancel"
                className="text-slate-400 hover:text-red-500 transition-colors p-1">
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
