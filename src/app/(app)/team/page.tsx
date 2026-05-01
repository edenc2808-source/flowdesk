'use client'

import { useState, useEffect } from 'react'
import { Plus, Shield, Trash2, Crown, User } from 'lucide-react'
import type { WorkspaceUser } from '@/types'

export default function TeamPage() {
  const [members, setMembers] = useState<WorkspaceUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
    })
    fetch('/api/team')
      .then(r => r.ok ? r.json() : [])
      .then((data: WorkspaceUser[]) => { setMembers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function toggleRole(member: WorkspaceUser) {
    const newRole = member.role === 'admin' ? 'agent' : 'admin'
    const res = await fetch(`/api/team/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
  }

  async function removeMember(id: string) {
    if (!confirm('הסר את חבר הצוות?')) return
    const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ניהול צוות</h1>
          <p className="text-sm text-slate-500">{members.length} חברי צוות</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> הוסף חבר צוות
        </button>
      </div>

      {/* Role explanation */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
          <p className="font-bold flex items-center gap-1.5 mb-1"><Crown size={12} /> מנהל (Admin)</p>
          <p>גישה מלאה — רואה את כל השיחות, יכול לנהל צוות ולשלוח לכל לקוח</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          <p className="font-bold flex items-center gap-1.5 mb-1"><User size={12} /> סוכן (Agent)</p>
          <p>גישה מוגבלת — רואה רק שיחות שהוקצו לו ישירות</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">טוען...</div>
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {(member.name || member.email || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{member.name || '—'}</p>
                <p className="text-xs text-slate-500 truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                  member.role === 'admin'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {member.role === 'admin' ? <Crown size={10} /> : <User size={10} />}
                  {member.role === 'admin' ? 'מנהל' : 'סוכן'}
                </span>
                {member.id !== currentUserId ? (
                  <>
                    <button
                      onClick={() => toggleRole(member)}
                      title={`שנה ל-${member.role === 'admin' ? 'סוכן' : 'מנהל'}`}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Shield size={14} />
                    </button>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 px-2">(אתה)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddMemberModal
          onClose={() => setShowForm(false)}
          onAdded={(m) => { setMembers(prev => [...prev, m]); setShowForm(false) }}
        />
      )}
    </div>
  )
}

function AddMemberModal({ onClose, onAdded }: { onClose: () => void; onAdded: (m: WorkspaceUser) => void }) {
  const [form, setForm] = useState({ email: '', name: '', role: 'agent', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'שגיאה'); setLoading(false); return }
      onAdded(data)
    } catch { setError('שגיאת רשת'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-slate-900 mb-5">הוסף חבר צוות</h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="שם מלא">
            <input value={form.name} onChange={u('name')} required className={INPUT} placeholder="ישראל ישראלי" />
          </Field>
          <Field label="אימייל">
            <input type="email" value={form.email} onChange={u('email')} required className={INPUT} placeholder="user@company.com" />
          </Field>
          <Field label="סיסמה זמנית">
            <input type="password" value={form.password} onChange={u('password')} required minLength={8} className={INPUT} placeholder="לפחות 8 תווים" />
          </Field>
          <Field label="תפקיד">
            <select value={form.role} onChange={u('role')} className={INPUT}>
              <option value="agent">סוכן — רואה שיחות שהוקצו אליו בלבד</option>
              <option value="admin">מנהל — גישה מלאה לכל השיחות</option>
            </select>
          </Field>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
              ביטול
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {loading ? 'מוסיף...' : 'הוסף חבר צוות'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
