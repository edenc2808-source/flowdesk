'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const [ws, setWs] = useState({ name: '', industry_type: '', whatsapp_number: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d) setWs({ name: d.name ?? '', industry_type: d.industry_type ?? '', whatsapp_number: d.whatsapp_number ?? '' })
      setLoading(false)
    })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ws) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading...</div>

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-lg">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Settings</h1>

        <form onSubmit={save} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Workspace</h2>
            <Field label="Workspace Name">
              <input value={ws.name} onChange={e => setWs(p => ({ ...p, name: e.target.value }))}
                className={INPUT} placeholder="Acme Inc." />
            </Field>
            <Field label="Industry" hint="Used for display purposes only">
              <input value={ws.industry_type} onChange={e => setWs(p => ({ ...p, industry_type: e.target.value }))}
                className={INPUT} placeholder="e.g. Real Estate, Healthcare, SaaS" />
            </Field>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Twilio WhatsApp</h2>
            <Field label="WhatsApp Number" hint="The Twilio number connected to your account">
              <input value={ws.whatsapp_number} onChange={e => setWs(p => ({ ...p, whatsapp_number: e.target.value }))}
                className={INPUT} placeholder="+14155238886" dir="ltr" />
            </Field>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-600">Webhook URL for Twilio:</p>
              <code className="block bg-white border border-slate-200 rounded px-2 py-1 text-slate-700">
                https://your-domain.com/api/webhook/twilio
              </code>
              <p>Set this in Twilio Console → Messaging → Sandbox → "When a message comes in"</p>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
            <Save size={14} />
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}
