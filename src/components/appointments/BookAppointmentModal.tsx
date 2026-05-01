'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  leadId: string
  leadName: string
  onClose: () => void
  onBooked: () => void
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function BookAppointmentModal({ leadId, leadName, onClose, onBooked }: Props) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [sendConfirm, setSendConfirm] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validate(): string | null {
    if (!date) return 'Please select a date'
    // Build UTC ISO from local date+time string
    const dt = new Date(`${date}T${time}`)
    if (isNaN(dt.getTime())) return 'Invalid date or time'
    if (dt < new Date()) return 'Appointment must be in the future'
    return null
  }

  async function book() {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')

    // Use local datetime — server will store as ISO
    const datetime = new Date(`${date}T${time}`).toISOString()

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: leadId,
        date: datetime,
        title: title.trim() || null,
        notes: notes.trim() || null,
        send_confirmation: sendConfirm,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to book appointment')
      setLoading(false)
      return
    }

    onBooked()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-slate-900">Book Appointment</h2>
            <p className="text-xs text-slate-500 mt-0.5">{leadName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={e => { setDate(e.target.value); setError('') }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Time *</label>
              <input
                type="time"
                value={time}
                onChange={e => { setTime(e.target.value); setError('') }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Initial consultation"
              maxLength={100}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendConfirm}
              onChange={e => setSendConfirm(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-slate-600">Send WhatsApp confirmation</span>
          </label>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={book}
            disabled={!date || loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}
