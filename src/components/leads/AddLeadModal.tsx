'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props { onClose: () => void; onCreated: () => void }

export default function AddLeadModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', source: 'manual', tags: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const u = (k: keyof typeof form, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.phone.trim()) { setError('Phone is required'); return }

    setLoading(true)
    setError('')

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to create lead')
      setLoading(false)
      return
    }

    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900">New Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Name *">
            <input value={form.name} onChange={e => u('name', e.target.value)} required
              placeholder="John Smith" className={INPUT} autoFocus />
          </Field>
          <Field label="Phone *" hint="Will be normalized to E.164 format">
            <input value={form.phone} onChange={e => u('phone', e.target.value)} required
              placeholder="+1 555 0100 or 050-1234567" className={INPUT} dir="ltr" />
          </Field>
          <Field label="Source">
            <select value={form.source} onChange={e => u('source', e.target.value)} className={INPUT}>
              {['manual','website','referral','social','email','other'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Tags" hint="Comma-separated, e.g. vip, enterprise">
            <input value={form.tags} onChange={e => u('tags', e.target.value)}
              placeholder="vip, hot-lead, referral" className={INPUT} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => u('notes', e.target.value)} rows={2}
              placeholder="Any additional context…" className={INPUT} />
          </Field>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {loading ? 'Creating…' : 'Create & Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}
