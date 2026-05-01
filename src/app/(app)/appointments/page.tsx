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

function todayISO() { return new Date().toISOString().slice(0, 10) }

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<ApptWithLead[]>(DEMO_APPOINTMENTS as ApptWithLead[])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming')
  const [rescheduling, setRescheduling] = useState<ApptWithLead | null>(null)
  const [reschedDate, setReschedDate] = useState('')
  const [reschedTime, setReschedTime] = useState('10:00')
  const [reschedLoading, setReschedLoading] = useState(false)
  const [sendingWa, setSendingWa] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetch('/api/appointments')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setAppts(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    try {
      if (status === 'cancelled') {
        await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' })
      } else {
        await fetch(`/api/appointments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      }
      setAppts(prev => prev.map(a => a.id === id ? { ...a, status: status as Appointment['status'] } : a))
    } catch {}
  }

  async function doReschedule() {
    if (!rescheduling || !reschedDate) return
    setReschedLoading(true)
    try {
      const date = new Date(`${reschedDate}T${reschedTime}`).toISOString()
      const res = await fetch(`/api/appointments/${rescheduling.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, status: 'confirmed' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAppts(prev => prev.map(a => a.id === rescheduling.id ? { ...a, ...updated } : a))
        setRescheduling(null)
      }
    } finally { setReschedLoading(false) }
  }

  async function sendReminder(appt: ApptWithLead) {
    if (!appt.lead_id) return
    setSendingWa(appt.id)
    try {
      const dateStr = format(new Date(appt.date), 'dd/MM/yyyy HH:mm')
      const msg = `תזכורת: יש לך פגישה${appt.title ? ` – ${appt.title}` : ''} ב-${dateStr}. נתראה! 🗓️`
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: appt.lead_id, body: msg }),
      })
      await updateStatus(appt.id, 'reminder_sent')
    } finally { setSendingWa(null) }
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
          {(['upcoming', 'all'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
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
          {today.length > 0 && (
            <Section title="היום" count={today.length} accent>
              {today.map(appt => (
                <ApptCard key={appt.id} appt={appt}
                  onStatusChange={updateStatus}
                  onReschedule={() => { setRescheduling(appt); setReschedDate(''); setReschedTime('10:00') }}
                  onSendWa={() => sendReminder(appt)}
                  sendingWa={sendingWa === appt.id}
                />
              ))}
            </Section>
          )}

          {upcoming.length > 0 && (
            <Section title="קרובות" count={upcoming.length}>
              {upcoming.map(appt => (
                <ApptCard key={appt.id} appt={appt}
                  onStatusChange={updateStatus}
                  onReschedule={() => { setRescheduling(appt); setReschedDate(''); setReschedTime('10:00') }}
                  onSendWa={() => sendReminder(appt)}
                  sendingWa={sendingWa === appt.id}
                />
              ))}
            </Section>
          )}

          {(view === 'all' || today.length + upcoming.length === 0) && past.length > 0 && (
            <Section title="קודמות / בוטלו" count={past.length}>
              {past.map(appt => (
                <ApptCard key={appt.id} appt={appt}
                  onStatusChange={updateStatus}
                  onReschedule={() => { setRescheduling(appt); setReschedDate(''); setReschedTime('10:00') }}
                  onSendWa={() => sendReminder(appt)}
                  sendingWa={sendingWa === appt.id}
                />
              ))}
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

      {/* Reschedule modal */}
      {rescheduling && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRescheduling(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-slate-900 mb-1">קביעה מחדש</h2>
            <p className="text-xs text-slate-500 mb-4">{rescheduling.lead?.name}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">תאריך *</label>
                <input type="date" value={reschedDate} min={todayISO()}
                  onChange={e => setReschedDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">שעה *</label>
                <input type="time" value={reschedTime}
                  onChange={e => setReschedTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRescheduling(null)}
                className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">
                ביטול
              </button>
              <button onClick={doReschedule} disabled={!reschedDate || reschedLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {reschedLoading ? 'שומר...' : 'אשר מועד חדש'}
              </button>
            </div>
          </div>
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

function ApptCard({ appt, onStatusChange, onReschedule, onSendWa, sendingWa }: {
  appt: ApptWithLead
  onStatusChange: (id: string, s: string) => void
  onReschedule: () => void
  onSendWa: () => void
  sendingWa: boolean
}) {
  const d = new Date(appt.date)
  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled
  const isActive = !['cancelled', 'arrived', 'no_show'].includes(appt.status)

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="text-center min-w-[52px] shrink-0">
        <div className={clsx('text-xl font-bold', isToday(d) ? 'text-indigo-700' : 'text-slate-800')}>{format(d, 'd')}</div>
        <div className="text-xs text-slate-400 font-medium">{format(d, 'MMM', { locale: he })}</div>
      </div>
      <div className="w-px h-10 bg-slate-200 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">{appt.lead?.name ?? '—'}</p>
          {isToday(d) && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">היום</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Clock size={10} />{format(d, 'HH:mm')}</span>
          {appt.title && <span>· {appt.title}</span>}
          {appt.lead?.phone && (
            <span className="flex items-center gap-1" dir="ltr"><Phone size={10} />{appt.lead.phone}</span>
          )}
        </div>
      </div>

      <span className={clsx('text-xs px-2.5 py-1 rounded-full border font-medium shrink-0', cfg.color)}>
        {cfg.label}
      </span>

      {isActive && (
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onStatusChange(appt.id, 'arrived')} title="הגיע"
            className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors">
            <Check size={13} />
          </button>
          <button onClick={() => onStatusChange(appt.id, 'no_show')} title="לא הגיע"
            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
            <X size={13} />
          </button>
          <button onClick={onReschedule} title="קבע מחדש"
            className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors">
            <RotateCcw size={13} />
          </button>
          <button onClick={onSendWa} disabled={sendingWa} title="שלח תזכורת WhatsApp"
            className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors disabled:opacity-40">
            <Send size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
