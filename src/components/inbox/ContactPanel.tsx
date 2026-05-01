'use client'

import { useState, useEffect } from 'react'
import { Phone, Tag, FileText, Calendar, Pause, Play, X, Loader2, Clock, UserCheck } from 'lucide-react'
import clsx from 'clsx'
import type { Lead, LeadStatus, Appointment, WorkspaceUser } from '@/types'
import { DEMO_APPOINTMENTS } from '@/lib/demo-data'

const STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new',          label: 'שיחה חדשה',      color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted',    label: 'ממתין ללקוח',     color: 'bg-yellow-100 text-yellow-700' },
  { value: 'responded',    label: 'ממתין לתגובה',    color: 'bg-amber-100 text-amber-700' },
  { value: 'appointment',  label: 'פגישה קבועה',     color: 'bg-purple-100 text-purple-700' },
  { value: 'no_response',  label: 'נדרש מעקב',       color: 'bg-red-100 text-red-600' },
  { value: 'closed',       label: 'סגור',            color: 'bg-slate-100 text-slate-600' },
]

const APPT_STATUS: Record<string, string> = {
  scheduled: 'נקבעה', confirmed: 'אושרה', cancelled: 'בוטלה',
  no_show: 'לא הגיע', arrived: 'הגיע', rescheduled: 'נקבע מחדש',
  reminder_sent: 'תזכורת נשלחה', pending: 'ממתין',
}

interface Props {
  lead: Lead
  conversationId?: string | null
  assignedAgentId?: string | null
  onUpdated: (lead: Lead) => void
}

export default function ContactPanel({ lead, conversationId, assignedAgentId, onUpdated }: Props) {
  const [tagInput, setTagInput] = useState('')
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [patching, setPatching] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>(
    DEMO_APPOINTMENTS.filter(a => a.lead_id === lead.id)
  )
  const [teamMembers, setTeamMembers] = useState<WorkspaceUser[]>([])
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(assignedAgentId ?? null)
  const [assigningAgent, setAssigningAgent] = useState(false)

  useEffect(() => {
    setNotes(lead.notes ?? '')
    setTagInput('')
    setCurrentAgentId(assignedAgentId ?? null)
    fetch(`/api/appointments?lead_id=${lead.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setAppointments(data) })
      .catch(() => {})
  }, [lead.id, lead.notes, assignedAgentId])

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.ok ? r.json() : [])
      .then((data: WorkspaceUser[]) => { if (Array.isArray(data)) setTeamMembers(data) })
      .catch(() => {})
  }, [])

  async function patch(updates: Partial<Lead>): Promise<Lead | null> {
    setPatching(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) return null
      const updated: Lead = await res.json()
      onUpdated(updated)
      return updated
    } finally {
      setPatching(false)
    }
  }

  async function assignAgent(agentId: string | null) {
    if (!conversationId) return
    setAssigningAgent(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      })
      if (res.ok) setCurrentAgentId(agentId)
    } finally {
      setAssigningAgent(false)
    }
  }

  async function saveNotes() {
    if (notes === (lead.notes ?? '')) return
    setSavingNotes(true)
    await patch({ notes: notes.trim() || null })
    setSavingNotes(false)
  }

  async function addTag(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    const tag = tagInput.trim()
    if (!tag || lead.tags?.includes(tag)) { setTagInput(''); return }
    await patch({ tags: [...(lead.tags ?? []), tag] })
    setTagInput('')
  }

  const currentStatus = STATUSES.find(s => s.value === lead.status)
  const upcomingAppts = appointments.filter(a => a.status !== 'cancelled' && new Date(a.date) >= new Date())
  const pastAppts = appointments.filter(a => a.status === 'cancelled' || new Date(a.date) < new Date())

  return (
    <div className="h-full overflow-y-auto flex flex-col relative">
      {patching && (
        <div className="absolute top-2 left-2 z-10">
          <Loader2 size={14} className="animate-spin text-indigo-500" />
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-xl font-bold text-white mb-3">
          {lead.name[0]?.toUpperCase() ?? '?'}
        </div>
        <h3 className="font-bold text-slate-900 text-base break-words">{lead.name}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
          <Phone size={12} className="shrink-0" />
          <span dir="ltr" className="font-mono text-xs">{lead.phone}</span>
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {lead.source && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {lead.source}
            </span>
          )}
          {lead.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Status */}
        <Section label="סטטוס">
          <select
            value={lead.status}
            onChange={e => patch({ status: e.target.value as LeadStatus })}
            disabled={patching}
            className={clsx(
              'w-full text-sm rounded-lg px-3 py-2 border-0 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer disabled:opacity-60',
              currentStatus?.color ?? 'bg-slate-100 text-slate-700'
            )}
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Section>

        {/* Automation */}
        <Section label="אוטומציה">
          <button
            onClick={() => patch({ automation_paused: !lead.automation_paused })}
            disabled={patching}
            className={clsx(
              'flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg w-full transition-colors disabled:opacity-60',
              lead.automation_paused
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            )}
          >
            {lead.automation_paused
              ? <><Play size={12} /> מושהית — לחץ להמשך</>
              : <><Pause size={12} /> פעילה — לחץ להשהיה</>}
          </button>
        </Section>

        {/* Agent assignment */}
        {conversationId && teamMembers.length > 0 && (
          <Section label="הוקצה לסוכן" icon={<UserCheck size={12} />}>
            <select
              value={currentAgentId ?? ''}
              onChange={e => assignAgent(e.target.value || null)}
              disabled={assigningAgent}
              className="w-full text-sm rounded-lg px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer disabled:opacity-60"
            >
              <option value="">לא הוקצה</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email} {m.role === 'admin' ? '(מנהל)' : ''}
                </option>
              ))}
            </select>
          </Section>
        )}

        {/* Upcoming appointments */}
        {upcomingAppts.length > 0 && (
          <Section label="פגישות קרובות" icon={<Calendar size={12} />}>
            {upcomingAppts.map(appt => (
              <div key={appt.id} className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs">
                <p className="font-semibold text-purple-800">
                  {new Date(appt.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}
                  {new Date(appt.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {appt.title && <p className="text-purple-600 mt-0.5">{appt.title}</p>}
                <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                  {APPT_STATUS[appt.status] ?? appt.status}
                </span>
              </div>
            ))}
          </Section>
        )}

        {/* Tags */}
        <Section label="תגיות" icon={<Tag size={12} />}>
          {(lead.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {lead.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {tag}
                  <button onClick={() => patch({ tags: lead.tags.filter(t => t !== tag) })} disabled={patching}
                    className="hover:text-indigo-900 disabled:opacity-50">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="הוסף תגית, Enter לאישור"
            maxLength={30}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </Section>

        {/* Last activity */}
        <Section label="פעילות אחרונה" icon={<Clock size={12} />}>
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span>שיחה אחרונה: {new Date(lead.updated_at).toLocaleDateString('he-IL')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <span>מקור: {lead.source}</span>
            </div>
            {pastAppts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span>פגישות: {appointments.length}</span>
              </div>
            )}
          </div>
        </Section>

        {/* Notes */}
        <Section label="הערות" icon={<FileText size={12} />}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={3}
            placeholder="הוסף הערות פנימיות..."
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          {savingNotes && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> שומר...
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
        {icon}{label}
      </div>
      {children}
    </div>
  )
}
