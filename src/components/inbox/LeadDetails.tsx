'use client'

import { useState, useEffect } from 'react'
import { Phone, Tag, FileText, Calendar, Pause, Play, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { Lead, LeadStatus } from '@/types'
import BookAppointmentModal from '@/components/appointments/BookAppointmentModal'

const STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new',         label: 'New',         color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted',  label: 'Contacted',   color: 'bg-yellow-100 text-yellow-700' },
  { value: 'responded',  label: 'Responded',   color: 'bg-green-100 text-green-700' },
  { value: 'appointment',label: 'Appointment', color: 'bg-purple-100 text-purple-700' },
  { value: 'no_response',label: 'No Response', color: 'bg-red-100 text-red-600' },
  { value: 'closed',     label: 'Closed',      color: 'bg-slate-100 text-slate-600' },
]

interface Props {
  lead: Lead
  onUpdated: (lead: Lead) => void
}

export default function LeadDetails({ lead, onUpdated }: Props) {
  const [tagInput, setTagInput] = useState('')
  // Reset notes whenever a different lead is selected
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [patching, setPatching] = useState(false)
  const [showBook, setShowBook] = useState(false)

  // Sync local state when lead prop changes (e.g. switching conversations)
  useEffect(() => {
    setNotes(lead.notes ?? '')
    setTagInput('')
  }, [lead.id, lead.notes])

  async function patch(updates: Partial<Lead>): Promise<Lead | null> {
    setPatching(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        console.error('[LeadDetails] patch failed:', await res.text())
        return null
      }
      const updated: Lead = await res.json()
      onUpdated(updated)
      return updated
    } finally {
      setPatching(false)
    }
  }

  async function saveNotes() {
    if (notes === (lead.notes ?? '')) return // no change
    setSavingNotes(true)
    await patch({ notes: notes.trim() || null })
    setSavingNotes(false)
  }

  async function addTag(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    const tag = tagInput.trim()
    if (!tag) return
    if (lead.tags?.includes(tag)) { setTagInput(''); return }
    const newTags = [...(lead.tags ?? []), tag]
    await patch({ tags: newTags })
    setTagInput('')
  }

  async function removeTag(tag: string) {
    await patch({ tags: lead.tags.filter(t => t !== tag) })
  }

  const currentStatus = STATUSES.find(s => s.value === lead.status)

  return (
    <div className="h-full overflow-y-auto flex flex-col relative">
      {/* Loading overlay for patch operations */}
      {patching && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 size={14} className="animate-spin text-indigo-500" />
        </div>
      )}

      {/* Lead header */}
      <div className="p-4 border-b border-slate-100">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-700 mb-3">
          {lead.name[0]?.toUpperCase() ?? '?'}
        </div>
        <h3 className="font-semibold text-slate-900 break-words">{lead.name}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
          <Phone size={12} className="shrink-0" />
          <span dir="ltr" className="font-mono">{lead.phone}</span>
        </p>
        {lead.source && (
          <span className="mt-2 inline-block text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">
            {lead.source}
          </span>
        )}
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Status */}
        <Section label="Status">
          <select
            value={lead.status}
            onChange={e => patch({ status: e.target.value as LeadStatus })}
            disabled={patching}
            className={clsx(
              'w-full text-sm rounded-lg px-3 py-1.5 border-0 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer disabled:opacity-60',
              currentStatus?.color ?? 'bg-slate-100 text-slate-700'
            )}
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Section>

        {/* Automation toggle */}
        <Section label="Automation">
          <button
            onClick={() => patch({ automation_paused: !lead.automation_paused })}
            disabled={patching}
            className={clsx(
              'flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg w-full transition-colors disabled:opacity-60',
              lead.automation_paused
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            )}
          >
            {lead.automation_paused
              ? <><Play size={12} /> Paused — click to resume</>
              : <><Pause size={12} /> Active — click to pause</>}
          </button>
        </Section>

        {/* Tags */}
        <Section label="Tags" icon={<Tag size={12} />}>
          {(lead.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {lead.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {tag}
                  <button onClick={() => removeTag(tag)} disabled={patching}
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
            placeholder="Add tag, press Enter"
            maxLength={30}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </Section>

        {/* Notes */}
        <Section label="Notes" icon={<FileText size={12} />}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={4}
            placeholder="Add notes…"
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          {savingNotes && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Saving…
            </p>
          )}
        </Section>

        {/* Book appointment */}
        <button
          onClick={() => setShowBook(true)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Calendar size={14} /> Book Appointment
        </button>
      </div>

      {showBook && (
        <BookAppointmentModal
          leadId={lead.id}
          leadName={lead.name}
          onClose={() => setShowBook(false)}
          onBooked={() => setShowBook(false)}
        />
      )}
    </div>
  )
}

function Section({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {icon}{label}
      </div>
      {children}
    </div>
  )
}
