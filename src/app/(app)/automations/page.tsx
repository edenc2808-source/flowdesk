'use client'

import { useState, useEffect } from 'react'
import { Plus, Zap, Trash2, ToggleLeft, ToggleRight, Users } from 'lucide-react'
import clsx from 'clsx'
import type { Automation, AutomationTrigger } from '@/types'
import { DEMO_AUTOMATIONS } from '@/lib/demo-data'

const TRIGGER_INFO: Record<AutomationTrigger, { label: string; desc: string; color: string; emoji: string }> = {
  lead_created:         { label: 'פנייה חדשה',          desc: 'מופעל כאשר לקוח חדש פונה',              color: 'bg-blue-50 text-blue-700',   emoji: '👋' },
  no_response:          { label: 'ללא תגובה',           desc: 'מופעל אחרי X דקות ללא תגובה',           color: 'bg-amber-50 text-amber-700', emoji: '⏰' },
  appointment_reminder: { label: 'תזכורת לפגישה',       desc: 'מופעל X דקות לפני פגישה',               color: 'bg-purple-50 text-purple-700',emoji: '🗓️' },
  appointment_created:  { label: 'פגישה נקבעה',         desc: 'מופעל עם יצירת פגישה חדשה',             color: 'bg-green-50 text-green-700', emoji: '✅' },
  appointment_no_show:  { label: 'לא הגיע לפגישה',      desc: 'מופעל כאשר לקוח לא הגיע',               color: 'bg-red-50 text-red-600',    emoji: '❌' },
  post_treatment:       { label: 'מעקב אחרי טיפול',     desc: 'מופעל 24 שעות לאחר טיפול',              color: 'bg-teal-50 text-teal-700',  emoji: '💆' },
  inactive_customer:    { label: 'לקוח לא פעיל',        desc: 'מופעל אחרי X ימי חוסר פעילות',          color: 'bg-slate-100 text-slate-600',emoji: '😴' },
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(DEMO_AUTOMATIONS)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('/api/automations')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setAutomations(data) })
      .catch(() => {})
  }, [])

  async function toggle(a: Automation) {
    try {
      await fetch(`/api/automations/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !a.is_active }),
      })
    } catch {}
    setAutomations(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
  }

  async function remove(id: string) {
    if (!confirm('למחוק את האוטומציה?')) return
    try { await fetch(`/api/automations/${id}`, { method: 'DELETE' }) } catch {}
    setAutomations(prev => prev.filter(a => a.id !== id))
  }

  const active = automations.filter(a => a.is_active).length

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">אוטומציות</h1>
          <p className="text-sm text-slate-500">{active} פעילות מתוך {automations.length}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> אוטומציה חדשה
        </button>
      </div>

      {/* Variables hint */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-xs text-slate-500 flex items-start gap-2">
        <Zap size={14} className="text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-slate-600">משתנים זמינים: </span>
          {['{{name}}', '{{phone}}', '{{workspace}}', '{{appointment_date}}', '{{appointment_time}}'].map(v => (
            <code key={v} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded mx-0.5 font-mono">{v}</code>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">טוען...</div>
      ) : automations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Zap size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">אין אוטומציות עדיין</p>
          <p className="text-slate-400 text-xs mt-1">צור אוטומציה ראשונה להתחלה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(auto => {
            const info = TRIGGER_INFO[auto.trigger_type] ?? TRIGGER_INFO.no_response
            return (
              <div
                key={auto.id}
                className={clsx(
                  'bg-white border rounded-xl p-5 transition-all',
                  auto.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-lg">{info.emoji}</span>
                      <h3 className="font-bold text-slate-800 text-sm">{auto.name}</h3>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', info.color)}>
                        {info.label}
                      </span>
                      {auto.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">פעיל</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{info.desc}</p>
                    {auto.delay_minutes > 0 && (
                      <p className="text-xs text-slate-500 mb-2">
                        עיכוב: <span className="font-medium">{auto.delay_minutes >= 1440 ? `${(auto.delay_minutes/1440).toFixed(0)} ימים` : auto.delay_minutes >= 60 ? `${(auto.delay_minutes/60).toFixed(0)} שעות` : `${auto.delay_minutes} דקות`}</span>
                      </p>
                    )}
                    <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono whitespace-pre-wrap border border-slate-100">
                      {auto.message_template}
                    </div>
                    {auto.stats_sent !== undefined && auto.stats_sent > 0 && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Users size={10} /> {auto.stats_sent} הודעות נשלחו
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggle(auto)} title={auto.is_active ? 'כבה' : 'הפעל'} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      {auto.is_active
                        ? <ToggleRight size={24} className="text-indigo-600" />
                        : <ToggleLeft size={24} />}
                    </button>
                    <button onClick={() => remove(auto.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <AutomationForm
          onClose={() => setShowForm(false)}
          onCreated={(a) => { setAutomations(prev => [...prev, a]); setShowForm(false) }}
        />
      )}
    </div>
  )
}

function AutomationForm({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Automation) => void }) {
  const [form, setForm] = useState({ name: '', trigger_type: 'lead_created' as AutomationTrigger, delay_minutes: 0, message_template: '', template_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [waTemplates, setWaTemplates] = useState<import('@/types').WhatsAppTemplate[]>([])
  const u = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    fetch('/api/whatsapp-templates')
      .then(r => r.ok ? r.json() : [])
      .then((data: import('@/types').WhatsAppTemplate[]) => setWaTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const approvedTemplates = waTemplates.filter(t => t.meta_status === 'approved')
  const otherTemplates    = waTemplates.filter(t => t.meta_status !== 'approved')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'שגיאה'); setLoading(false); return }
      onCreated(data)
    } catch { setError('שגיאת רשת'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-slate-900 mb-5">אוטומציה חדשה</h2>
        <form onSubmit={submit} className="space-y-4">
          <Field label="שם *">
            <input value={form.name} onChange={e => u('name', e.target.value)} required placeholder="לדוגמה: ברכת ברוכים הבאים" className={INPUT} />
          </Field>
          <Field label="טריגר">
            <select value={form.trigger_type} onChange={e => u('trigger_type', e.target.value)} className={INPUT}>
              {(Object.keys(TRIGGER_INFO) as AutomationTrigger[]).map(t => (
                <option key={t} value={t}>{TRIGGER_INFO[t].label}</option>
              ))}
            </select>
          </Field>
          <Field label="עיכוב (דקות)">
            <input type="number" min={0} value={form.delay_minutes} onChange={e => u('delay_minutes', parseInt(e.target.value) || 0)} className={INPUT} />
          </Field>
          <Field label="תבנית WhatsApp (אופציונלי)">
            <select value={form.template_id} onChange={e => u('template_id', e.target.value)} className={INPUT}>
              <option value="">ללא תבנית — הודעה חופשית</option>
              {approvedTemplates.length > 0 && (
                <optgroup label="✅ מאושרות">
                  {approvedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </optgroup>
              )}
              {otherTemplates.length > 0 && (
                <optgroup label="⏳ לא מאושרות (לא ניתן לשלוח)">
                  {otherTemplates.map(t => <option key={t.id} value={t.id} disabled>{t.name}</option>)}
                </optgroup>
              )}
            </select>
            {waTemplates.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                <a href="/templates" className="text-indigo-600 hover:underline">צור תבניות WhatsApp</a> לשימוש באוטומציות
              </p>
            )}
          </Field>
          <Field label="תוכן הודעה *">
            <textarea value={form.message_template} onChange={e => u('message_template', e.target.value)} required rows={4}
              placeholder="היי {{name}}, ברוכים הבאים! איך נוכל לעזור?" className={INPUT + ' resize-none'} />
          </Field>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">ביטול</button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'שומר...' : 'צור אוטומציה'}
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
