'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', name: '', businessName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create account'); setLoading(false); return }

      const { error: signInErr } = await createClient().auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (signInErr) { setError('Account created — please sign in.'); setLoading(false); return }

      router.push('/inbox')
      router.refresh()
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">צור חשבון</h1>
            <p className="text-sm text-slate-500 mt-1">FlowDesk — CRM לעסק שלך</p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <Field label="שם מלא">
              <input value={form.name} onChange={u('name')} required
                className={INPUT} placeholder="ישראל ישראלי" />
            </Field>
            <Field label="שם העסק">
              <input value={form.businessName} onChange={u('businessName')} required
                className={INPUT} placeholder="קליניקת נוי" />
            </Field>
            <Field label="אימייל">
              <input type="email" value={form.email} onChange={u('email')} required
                className={INPUT} placeholder="you@business.com" />
            </Field>
            <Field label="סיסמה">
              <input type="password" value={form.password} onChange={u('password')} required minLength={8}
                className={INPUT} placeholder="לפחות 8 תווים" />
            </Field>
            {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 mt-1">
              {loading ? 'יוצר חשבון...' : 'צור חשבון'}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4">
            יש לך חשבון?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline">התחבר</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
