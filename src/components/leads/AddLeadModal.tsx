'use client'

import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'

interface Props { onClose: () => void; onCreated: () => void }

const SOURCE_OPTIONS = [
  { value: 'manual',   label: 'ידני' },
  { value: 'website',  label: 'אתר' },
  { value: 'referral', label: 'הפניה' },
  { value: 'social',   label: 'אינסטגרם / פייסבוק' },
  { value: 'google',   label: 'גוגל' },
  { value: 'email',    label: 'אימייל' },
  { value: 'other',    label: 'אחר' },
]

export default function AddLeadModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', source: 'manual', tags: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const u = (k: keyof typeof form, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('שם הוא שדה חובה'); return }
    if (!form.phone.trim()) { setError('טלפון הוא שדה חובה'); return }

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
      setError(data.error || 'יצירת איש הקשר נכשלה')
      setLoading(false)
      return
    }

    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-900">איש קשר חדש</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="שם *">
            <input value={form.name} onChange={e => u('name', e.target.value)} required
              placeholder="שם מלא" className={INPUT} autoFocus />
          </Field>
          <Field label="טלפון *" hint="יאוחד לפורמט בינלאומי (E.164)">
            <input value={form.phone} onChange={e => u('phone', e.target.value)} required
              placeholder="050-1234567 או +972-50-1234567" className={INPUT} dir="ltr" />
          </Field>
          <Field label="מקור">
            <select value={form.source} onChange={e => u('source', e.target.value)} className={INPUT}>
              {SOURCE_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="תגיות" hint="מופרד בפסיקים, לדוג׳: vip, הסרת שיער">
            <input value={form.tags} onChange={e => u('tags', e.target.value)}
              placeholder="vip, לקוח חדש, הפניה" className={INPUT} />
          </Field>
          <Field label="הערות">
            <textarea value={form.notes} onChange={e => u('notes', e.target.value)} rows={2}
              placeholder="הקשר נוסף..." className={INPUT + ' resize-none'} />
          </Field>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">
              ביטול
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {loading ? 'יוצר...' : 'צור איש קשר'}
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
