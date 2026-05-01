'use client'

import { useState, useEffect } from 'react'
import { Save, Wifi, WifiOff, Copy, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [ws, setWs] = useState({ name: '', industry_type: '', whatsapp_number: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => { setConnected(r.ok); return r.ok ? r.json() : null })
      .then(d => {
        if (d) setWs({ name: d.name ?? '', industry_type: d.industry_type ?? '', whatsapp_number: d.whatsapp_number ?? '' })
        setLoading(false)
      })
      .catch(() => { setConnected(false); setLoading(false) })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ws) })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  function copyWebhook() {
    const url = `${window.location.origin}/api/webhook/twilio`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">טוען...</div>

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-xl">
        <h1 className="text-xl font-bold text-slate-900 mb-6">הגדרות</h1>

        {/* Connection status */}
        <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 border ${connected === false ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          {connected === false
            ? <WifiOff size={18} className="text-red-500 shrink-0" />
            : <Wifi size={18} className="text-green-500 shrink-0" />}
          <div>
            <p className={`text-sm font-semibold ${connected === false ? 'text-red-700' : 'text-green-700'}`}>
              {connected === false ? 'Supabase לא מחובר' : 'Supabase מחובר'}
            </p>
            <p className={`text-xs mt-0.5 ${connected === false ? 'text-red-600' : 'text-green-600'}`}>
              {connected === false
                ? 'בדוק את משתני הסביבה: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
                : 'מסד הנתונים פעיל ומחובר'}
            </p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-6">
          {/* Business profile */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700">פרופיל עסקי</h2>
            <Field label="שם העסק">
              <input value={ws.name} onChange={e => setWs(p => ({ ...p, name: e.target.value }))}
                className={INPUT} placeholder="קליניקת נוי" />
            </Field>
            <Field label="תחום עיסוק" hint="לצורכי תצוגה בלבד">
              <input value={ws.industry_type} onChange={e => setWs(p => ({ ...p, industry_type: e.target.value }))}
                className={INPUT} placeholder="לדוגמה: קליניקת יופי, מרפאת שיניים, מספרה" />
            </Field>
          </div>

          {/* WhatsApp */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700">חיבור WhatsApp</h2>
            <Field label="מספר WhatsApp (Twilio)" hint="מספר ה-Twilio המחובר לחשבונך">
              <input value={ws.whatsapp_number} onChange={e => setWs(p => ({ ...p, whatsapp_number: e.target.value }))}
                className={INPUT} placeholder="+14155238886" dir="ltr" />
            </Field>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">כתובת Webhook</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono truncate" dir="ltr">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/twilio` : '/api/webhook/twilio'}
                </code>
                <button type="button" onClick={copyWebhook} className="shrink-0 p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">הגדר כתובת זו ב: Twilio Console → Messaging → Sandbox → &quot;When a message comes in&quot;</p>
            </div>

            {/* Environment variables status */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">משתני סביבה נדרשים:</p>
              {[
                { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
                { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
                { key: 'TWILIO_ACCOUNT_SID', required: false },
                { key: 'TWILIO_AUTH_TOKEN', required: false },
                { key: 'TWILIO_WHATSAPP_FROM', required: false },
              ].map(({ key, required }) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${required ? 'bg-red-400' : 'bg-slate-300'}`} />
                  <code className="font-mono text-slate-600">{key}</code>
                  <span className="text-slate-400">{required ? '(חובה)' : '(לשליחת WhatsApp)'}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
            <Save size={14} />
            {saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמור שינויים'}
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
