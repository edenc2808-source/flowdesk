'use client'

import { useState, useEffect } from 'react'
import { Plus, Zap, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import clsx from 'clsx'
import type { Automation, AutomationTrigger } from '@/types'

const TRIGGER_INFO: Record<AutomationTrigger, { label: string; desc: string; color: string }> = {
  lead_created:         { label: 'Lead Created',          desc: 'Fires when a new lead is added',              color: 'bg-blue-50 text-blue-700' },
  no_response:          { label: 'No Response',           desc: 'Fires after X minutes of no reply',          color: 'bg-amber-50 text-amber-700' },
  appointment_reminder: { label: 'Appointment Reminder',  desc: 'Fires X minutes before an appointment',      color: 'bg-purple-50 text-purple-700' },
}

const TEMPLATE_VARS = ['{{name}}', '{{phone}}', '{{workspace}}', '{{source}}']

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/automations')
    setAutomations(await res.json())
    setLoading(false)
  }

  async function toggle(a: Automation) {
    await fetch(`/api/automations/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !a.is_active }),
    })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this automation?')) return
    await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Automations</h1>
          <p className="text-sm text-slate-500">Configure message flows</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> New Automation
        </button>
      </div>

      {/* Template vars hint */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Available variables: </span>
        {TEMPLATE_VARS.map(v => (
          <code key={v} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded mx-0.5">{v}</code>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">Loading...</div>
      ) : automations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <Zap size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No automations yet</p>
          <p className="text-slate-400 text-xs mt-1">Create one to start automating messages</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(auto => {
            const info = TRIGGER_INFO[auto.trigger_type]
            return (
              <div key={auto.id} className={clsx('bg-white border rounded-xl p-5 transition-all', auto.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 text-sm">{auto.name}</h3>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', info.color)}>
                        {info.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{info.desc}</p>
                    {auto.delay_minutes > 0 && (
                      <p className="text-xs text-slate-500 mb-2">
                        Delay: <span className="font-medium">{auto.delay_minutes}m ({(auto.delay_minutes / 60).toFixed(1)}h)</span>
                      </p>
                    )}
                    <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono whitespace-pre-wrap">
                      {auto.message_template}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggle(auto)} title={auto.is_active ? 'Disable' : 'Enable'}
                      className="text-slate-400 hover:text-indigo-600 transition-colors">
                      {auto.is_active ? <ToggleRight size={22} className="text-indigo-600" /> : <ToggleLeft size={22} />}
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

      {showForm && <AutomationForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function AutomationForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    trigger_type: 'lead_created' as AutomationTrigger,
    delay_minutes: 0,
    message_template: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const u = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) { setError('Failed'); setLoading(false); return }
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-slate-900 mb-5">New Automation</h2>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name *">
            <input value={form.name} onChange={e => u('name', e.target.value)} required
              placeholder="e.g. Welcome message" className={INPUT} />
          </Field>
          <Field label="Trigger">
            <select value={form.trigger_type} onChange={e => u('trigger_type', e.target.value)} className={INPUT}>
              {(Object.keys(TRIGGER_INFO) as AutomationTrigger[]).map(t => (
                <option key={t} value={t}>{TRIGGER_INFO[t].label}</option>
              ))}
            </select>
          </Field>
          <Field label="Delay (minutes)">
            <input type="number" min={0} value={form.delay_minutes}
              onChange={e => u('delay_minutes', parseInt(e.target.value) || 0)} className={INPUT} />
          </Field>
          <Field label="Message Template *">
            <textarea value={form.message_template} onChange={e => u('message_template', e.target.value)} required
              rows={4} placeholder="Hi {{name}}, welcome! How can we help?" className={INPUT + ' resize-none'} />
          </Field>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Create Automation'}
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
