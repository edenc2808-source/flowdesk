'use client'

import { useState, useEffect } from 'react'
import { Calendar, Phone, Send, Check, X, RotateCcw, Clock } from 'lucide-react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { he } from 'date-fns/locale'
import clsx from 'clsx'
import type { Appointment } from '@/types'
import { DEMO_APPOINTMENTS } from '@/lib/demo-data'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled:      { label: 'נקבעה',        color: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmed:      { label: 'אושרה',        color: 'bg-green-50 text-green-700 border-green-200' },
  reminder_sent:  { label: 'תזכורת נשלחה', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  arrived:        { label: 'הגיע',         color: 'bg-teal-50 text-teal-700 border-teal-200' },
  no_show:        { label: 'לא הגיע',      color: 'bg-red-50 text-red-600 border-red-200' },
  rescheduled:    { label: 'נקבע מחדש',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled:      { label: 'בוטל',         color: 'bg-slate-100 text-slate-500 border-slate-200' },
  pending:        { label: 'ממתין',        color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
}

type ApptWithLead = Appointment & { lead: { name: string; phone: string } | null }

function dateLabel(date: Date) {
  if (isToday(date)) return 'היום'
  if (isTomorrow(date)) return 'מחר'
  return format(date, 'EEEE, d בMMMM', { locale: he })
}

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<ApptWithLead[]>(DEMO_APPOINTMENTS as ApptWithLead[])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming')

  useEffect(() => {
    setLoading(true)
    fetch('/api/appointments')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setAppts(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    try {
      if (status === 'cancelled') {
        await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' })
      }
      setAppts(prev => prev.map(a => a.id === id ? { ...a, status: status as Appointment['status'] } : a))
    } catch {}
  }

  const today = appts.filter(a => isToday(new Date(a.date)) && a.status !== 'cancelled')
  const upcoming = appts.filter(a => !isPast(new Date(a.date)) && !isToday(new Date(a.date)) && a.status !== 'cancelled')
  const past = appts.filter(a => isPast(new Date(a.date)) || a.status === 'cancelled')

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">פגישות</h1>
          <p className="text-sm text-slate-500">{today.length} היום · {upcoming.length} קרובות</p>
        </div>
        <div className="flex gap-2">
          {['upcoming', 'all'].map(v => (
            <button
              key={v}
              onClick={() => setView(v as typeof view)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                view === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {v === 'upcoming' ? 'קרובות' : 'הכל'}
            </button>
          ))}
        </div>
      </div>

      {loading && appts.length === 0 ? (
        <div className="text-center text-slate-400 py-10 text-sm">טוען...</div>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {today.length > 0 && (
            <Section title="היום" count={today.length} accent>
              {today.map(appt => <ApptCard key={appt.id} appt={appt} onStatusChange={updateStatus} />)}
            </Section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <Section title="קרובות" count={upcoming.length}>
              {upcoming.map(appt => <ApptCard key={appt.id} appt={appt} onStatusChange={updateStatus} />)}
            </Section>
          )}

          {/* Past */}
          {(view === 'all' || today.length + upcoming.length === 0) && past.length > 0 && (
            <Section title="קודמות / בוטלו" count={past.length}>
              {past.map(appt => <ApptCard key={appt.id} appt={appt} onStatusChange={updateStatus} />)}
            </Section>
          )}

          {today.length + upcoming.length + past.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">אין פגישות</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, count, accent, children }: {
  title: string; count: number; accent?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className={clsx('text-sm font-bold', accent ? 'text-indigo-700' : 'text-slate-600')}>{title}</h2>
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', accent ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500')}>{count}</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
        {children}
      </div>
    </div>
  )
}

function ApptCard({ appt, onStatusChange }: { appt: ApptWithLead; onStatusChange: (id: string, s: string) => void }) {
  const d = new Date(appt.date)
  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled
  const isActive = !['cancelled', 'arrived', 'no_show'].includes(appt.status)

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {/* Date block */}
      <div className="text-center min-w-[52px] shrink-0">
        <div className={clsx('text-xl font-bold', isToday(d) ? 'text-indigo-700' : 'text-slate-800')}>{format(d, 'd')}</div>
        <div className="text-xs text-slate-400 font-medium">{format(d, 'MMM', { locale: he })}</div>
      </div>
      <div className="w-px h-10 bg-slate-200 shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">{appt.lead?.name ?? '—'}</p>
          {isToday(d) && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">היום</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Clock size={10} />{format(d, 'HH:mm')}</span>
          {appt.title && <span>· {appt.title}</span>}
          {appt.lead?.phone && (
            <span className="flex items-center gap-1" dir="ltr">
              <Phone size={10} />{appt.lead.phone}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <span className={clsx('text-xs px-2.5 py-1 rounded-full border font-medium shrink-0', cfg.color)}>
        {cfg.label}
      </span>

      {/* Actions */}
      {isActive && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onStatusChange(appt.id, 'arrived')}
            title="הגיע"
            className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors"
          >
            <Check size={13} />
          </button>
          <button
            onClick={() => onStatusChange(appt.id, 'no_show')}
            title="לא הגיע"
            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
          >
            <X size={13} />
          </button>
          <button
            onClick={() => onStatusChange(appt.id, 'rescheduled')}
            title="קבע מחדש"
            className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors"
          >
            <RotateCcw size={13} />
          </button>
          <button
            title="שלח WhatsApp"
            className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
          >
            <Send size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
