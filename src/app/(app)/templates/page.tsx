'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, CheckCircle, Clock, AlertCircle, Edit3, Send, RefreshCw,
  Copy, Trash2, ChevronDown, X, Phone, Link2, MessageSquare, Image, FileText,
  Loader2, PauseCircle, Ban,
} from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import type { WhatsAppTemplate, TemplateCategory, TemplateButton } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string; desc: string }[] = [
  { value: 'MARKETING',       label: 'שיווק',      desc: 'מבצעים, הטבות, עדכוני מוצר' },
  { value: 'UTILITY',         label: 'שירות',      desc: 'תזכורות, אישורים, עדכונים' },
  { value: 'AUTHENTICATION',  label: 'אימות',      desc: 'קודי OTP, אימות חשבון' },
]

const LANGUAGE_OPTIONS = [
  { value: 'he', label: 'עברית' },
  { value: 'en', label: 'English' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:    { label: 'טיוטה',   color: 'bg-slate-100 text-slate-500',    icon: Edit3 },
  pending:  { label: 'ממתין',   color: 'bg-amber-50 text-amber-600',     icon: Clock },
  approved: { label: 'מאושר',   color: 'bg-green-50 text-green-700',     icon: CheckCircle },
  rejected: { label: 'נדחה',    color: 'bg-red-50 text-red-600',         icon: AlertCircle },
  paused:   { label: 'מושהה',   color: 'bg-blue-50 text-blue-600',       icon: PauseCircle },
  disabled: { label: 'מושבת',   color: 'bg-slate-100 text-slate-400',    icon: Ban },
}

const CATEGORY_COLOR: Record<string, string> = {
  MARKETING:      'bg-pink-50 text-pink-700',
  UTILITY:        'bg-blue-50 text-blue-700',
  AUTHENTICATION: 'bg-purple-50 text-purple-700',
}

const CATEGORY_LABEL: Record<string, string> = {
  MARKETING: 'שיווק', UTILITY: 'שירות', AUTHENTICATION: 'אימות',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectVars(text: string): string[] {
  const m = text.match(/\{\{(\d+)\}\}/g) || []
  return [...new Set(m.map(v => v.replace(/\{\{|\}\}/g, '')))]
}

function applyVars(text: string, samples: Record<string, string>): string {
  return text.replace(/\{\{(\d+)\}\}/g, (_, n) => samples[n] || `{{${n}}}`)
}

function relativeDate(iso: string) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 1000
    if (diff < 60) return 'עכשיו'
    if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק׳`
    if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`
    return format(d, 'dd/MM/yyyy')
  } catch { return '' }
}

// ─── WhatsApp Preview ─────────────────────────────────────────────────────────

function WhatsAppPreview({
  headerType, headerText, body, footer, buttons, samples,
}: {
  headerType: string; headerText: string; body: string;
  footer: string; buttons: TemplateButton[]; samples: Record<string, string>
}) {
  const renderedHeader = applyVars(headerText, samples)
  const renderedBody   = applyVars(body, samples)

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-medium text-slate-500 mb-3">תצוגה מקדימה</p>

      {/* Phone frame */}
      <div className="w-[260px] bg-[#ECE5DD] rounded-2xl overflow-hidden shadow-lg border border-slate-300">
        {/* WA header bar */}
        <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">B</div>
          <div>
            <p className="text-white text-xs font-semibold leading-none">FlowDesk</p>
            <p className="text-white/60 text-[10px] leading-none mt-0.5">online</p>
          </div>
        </div>

        {/* Chat area */}
        <div className="p-3 min-h-[180px]">
          {/* Message bubble */}
          <div className="bg-white rounded-xl rounded-br-sm shadow-sm overflow-hidden max-w-[220px] ml-auto">
            {/* Header */}
            {headerType === 'TEXT' && headerText && (
              <div className="px-3 pt-3 pb-1">
                <p className="text-[12px] font-bold text-slate-800 leading-snug">{renderedHeader || 'כותרת'}</p>
              </div>
            )}
            {headerType === 'IMAGE' && (
              <div className="bg-slate-200 h-24 flex items-center justify-center">
                <Image size={24} className="text-slate-400" />
              </div>
            )}

            {/* Body */}
            <div className={clsx('px-3 text-[12px] text-slate-800 leading-relaxed whitespace-pre-wrap', headerType !== 'NONE' ? 'pt-1 pb-1' : 'pt-3 pb-1')}>
              {renderedBody || <span className="text-slate-400 italic">גוף ההודעה יופיע כאן...</span>}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-3 pb-2">
                <p className="text-[10px] text-slate-400">{footer}</p>
              </div>
            )}

            {/* Timestamp */}
            <div className="px-3 pb-2 flex justify-end">
              <span className="text-[10px] text-slate-400">12:30 ✓✓</span>
            </div>

            {/* Buttons */}
            {buttons.length > 0 && (
              <div className="border-t border-slate-100">
                {buttons.map((btn, i) => (
                  <div key={i} className={clsx(
                    'flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-[#075E54]',
                    i > 0 && 'border-t border-slate-100'
                  )}>
                    {btn.type === 'URL' && <Link2 size={11} />}
                    {btn.type === 'PHONE_NUMBER' && <Phone size={11} />}
                    {btn.type === 'QUICK_REPLY' && <MessageSquare size={11} />}
                    {btn.text || `כפתור ${i + 1}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Template Modal ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', category: 'UTILITY' as TemplateCategory, language: 'he',
  headerType: 'NONE', headerText: '', body: '', footer: '',
  buttons: [] as TemplateButton[], samples: {} as Record<string, string>,
}

function TemplateModal({
  onClose, onSaved, editTpl,
}: { onClose: () => void; onSaved: (t: WhatsAppTemplate) => void; editTpl?: WhatsAppTemplate | null }) {
  const [form, setForm] = useState(() => editTpl ? {
    name: editTpl.name,
    category: editTpl.category,
    language: editTpl.language,
    headerType: editTpl.header_type || 'NONE',
    headerText: editTpl.header_text || '',
    body: editTpl.body,
    footer: editTpl.footer || '',
    buttons: editTpl.buttons || [],
    samples: editTpl.sample_values || {},
  } : EMPTY_FORM)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const u = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }))

  // Auto-detect variables from header + body
  const allVars = useMemo(() => {
    const fromHeader = form.headerType === 'TEXT' ? detectVars(form.headerText) : []
    const fromBody   = detectVars(form.body)
    return [...new Set([...fromHeader, ...fromBody])].sort((a, b) => Number(a) - Number(b))
  }, [form.headerText, form.headerType, form.body])

  // Validate name format
  const nameError = form.name && !/^[a-z0-9_]+$/.test(form.name)
    ? 'שם חייב להכיל רק אותיות קטנות באנגלית, מספרים וקווים תחתיים'
    : null

  function addButton() {
    if (form.buttons.length >= 3) return
    u('buttons', [...form.buttons, { type: 'QUICK_REPLY' as const, text: '' }])
  }

  function updateButton(i: number, patch: Partial<TemplateButton>) {
    u('buttons', form.buttons.map((b, idx) => idx === i ? { ...b, ...patch } : b))
  }

  function removeButton(i: number) {
    u('buttons', form.buttons.filter((_, idx) => idx !== i))
  }

  async function save(submitToMeta = false) {
    if (!form.name.trim()) { setError('שם התבנית הוא שדה חובה'); return }
    if (nameError) { setError(nameError); return }
    if (!form.body.trim()) { setError('גוף ההודעה הוא שדה חובה'); return }
    if (submitToMeta && allVars.some(v => !form.samples[v]?.trim())) {
      setError('יש למלא ערכי דוגמה לכל המשתנים לפני שליחה ל-Meta')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      category: form.category,
      language: form.language,
      header_type: form.headerType,
      header_text: form.headerType === 'TEXT' ? form.headerText : null,
      body: form.body.trim(),
      footer: form.footer.trim() || null,
      buttons: form.buttons.filter(b => b.text.trim()),
      variables: allVars,
      sample_values: form.samples,
    }

    try {
      const url = editTpl ? `/api/whatsapp-templates/${editTpl.id}` : '/api/whatsapp-templates'
      const method = editTpl ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const saved = await res.json() as WhatsAppTemplate & { error?: string }

      if (!res.ok) { setError(saved.error || 'שמירה נכשלה'); setSaving(false); return }

      if (submitToMeta) {
        const submitRes = await fetch('/api/meta/templates/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template_id: saved.id, ...payload }),
        })
        const submitData = await submitRes.json() as { ok: boolean; draft?: boolean; message?: string; error?: string }
        if (submitData.draft) {
          setError(submitData.message || 'Meta לא מחובר — נשמר כטיוטה')
          onSaved({ ...saved, meta_status: 'draft' })
        } else if (!submitData.ok) {
          setError(submitData.error || 'שליחה ל-Meta נכשלה')
          onSaved(saved)
        } else {
          onSaved({ ...saved, meta_status: 'pending' })
        }
      } else {
        onSaved(saved)
      }
    } catch {
      setError('שגיאת רשת — נסה שוב')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            <h2 className="font-bold text-slate-900">{editTpl ? 'עריכת תבנית' : 'תבנית חדשה'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex divide-x divide-slate-100 flex-row-reverse">
          {/* ── Form ── */}
          <div className="flex-1 overflow-y-auto max-h-[80vh] px-6 py-5 space-y-5">

            {/* Name + Category + Language row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-1">
                <label className={LABEL}>שם התבנית *</label>
                <p className="text-[11px] text-slate-400 mb-1">אנגלית + קווים תחתיים בלבד</p>
                <input
                  value={form.name} onChange={e => u('name', e.target.value.toLowerCase())}
                  placeholder="appointment_reminder_24h"
                  dir="ltr"
                  className={clsx(INPUT, nameError && 'border-red-400 focus:ring-red-400')}
                />
                {nameError && <p className="text-[11px] text-red-500 mt-1">{nameError}</p>}
              </div>

              <div>
                <label className={LABEL}>קטגוריה *</label>
                <select value={form.category} onChange={e => u('category', e.target.value as TemplateCategory)} className={INPUT}>
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label} — {c.desc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL}>שפה</label>
                <select value={form.language} onChange={e => u('language', e.target.value)} className={INPUT}>
                  {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>

            {/* Header */}
            <div>
              <label className={LABEL}>כותרת (Header)</label>
              <div className="flex gap-2 mb-2">
                {(['NONE', 'TEXT', 'IMAGE'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => u('headerType', t)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      form.headerType === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    )}
                  >
                    {t === 'NONE' ? 'ללא' : t === 'TEXT' ? 'טקסט' : 'תמונה'}
                  </button>
                ))}
              </div>
              {form.headerType === 'TEXT' && (
                <input
                  value={form.headerText}
                  onChange={e => u('headerText', e.target.value)}
                  placeholder="כותרת ההודעה — ניתן להשתמש ב-{{1}}"
                  className={INPUT}
                />
              )}
              {form.headerType === 'IMAGE' && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-center text-sm text-slate-500">
                  <Image size={20} className="mx-auto mb-1 text-slate-400" />
                  תמונה תסופק בזמן שליחה
                </div>
              )}
            </div>

            {/* Body */}
            <div>
              <label className={LABEL}>גוף ההודעה *</label>
              <p className="text-[11px] text-slate-400 mb-1">
                השתמש ב-{'{{1}}'}, {'{{2}}'}, {'{{3}}'} עבור משתנים דינמיים
              </p>
              <textarea
                value={form.body}
                onChange={e => u('body', e.target.value)}
                rows={4}
                placeholder={`היי {{1}}, זו תזכורת לפגישה שלך אצלנו בתאריך {{2}} בשעה {{3}}.\nנשמח לראותך!`}
                className={INPUT + ' resize-none font-mono text-xs'}
              />
              <p className="text-[11px] text-slate-400 mt-1">{form.body.length}/1024 תווים</p>
            </div>

            {/* Variable samples */}
            {allVars.length > 0 && (
              <div>
                <label className={LABEL}>ערכי דוגמה למשתנים</label>
                <p className="text-[11px] text-slate-400 mb-2">נדרש לפני שליחה ל-Meta לאישור</p>
                <div className="space-y-2">
                  {allVars.map(v => (
                    <div key={v} className="flex items-center gap-3">
                      <code className="w-12 text-center text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono shrink-0">
                        {'{{'}{v}{'}}'}
                      </code>
                      <input
                        value={form.samples[v] || ''}
                        onChange={e => u('samples', { ...form.samples, [v]: e.target.value })}
                        placeholder={v === '1' ? 'דנה' : v === '2' ? '12/05/2026' : v === '3' ? '10:30' : `דוגמה ${v}`}
                        className={INPUT + ' text-sm'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div>
              <label className={LABEL}>Footer (אופציונלי)</label>
              <input
                value={form.footer}
                onChange={e => u('footer', e.target.value)}
                placeholder="FlowDesk — לביטול הסרה מהרשימה"
                maxLength={60}
                className={INPUT}
              />
            </div>

            {/* Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={LABEL}>כפתורים (עד 3)</label>
                {form.buttons.length < 3 && (
                  <button onClick={addButton} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ הוסף כפתור</button>
                )}
              </div>
              {form.buttons.length === 0 && (
                <p className="text-xs text-slate-400">אין כפתורים — לחץ הוסף כפתור</p>
              )}
              <div className="space-y-2">
                {form.buttons.map((btn, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <select
                      value={btn.type}
                      onChange={e => updateButton(i, { type: e.target.value as TemplateButton['type'] })}
                      className="border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 shrink-0"
                    >
                      <option value="QUICK_REPLY">Quick Reply</option>
                      <option value="URL">קישור URL</option>
                      <option value="PHONE_NUMBER">טלפון</option>
                    </select>
                    <input
                      value={btn.text}
                      onChange={e => updateButton(i, { text: e.target.value })}
                      placeholder="טקסט הכפתור"
                      maxLength={25}
                      className={INPUT + ' flex-1'}
                    />
                    {btn.type === 'URL' && (
                      <input
                        value={btn.url || ''}
                        onChange={e => updateButton(i, { url: e.target.value })}
                        placeholder="https://..."
                        dir="ltr"
                        className={INPUT + ' flex-1'}
                      />
                    )}
                    {btn.type === 'PHONE_NUMBER' && (
                      <input
                        value={btn.phone_number || ''}
                        onChange={e => updateButton(i, { phone_number: e.target.value })}
                        placeholder="+972501234567"
                        dir="ltr"
                        className={INPUT + ' flex-1'}
                      />
                    )}
                    <button onClick={() => removeButton(i)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0 mt-2">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg flex gap-2 items-start">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                ביטול
              </button>
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'שמור טיוטה'}
              </button>
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> שלח לאישור Meta</>}
              </button>
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="w-72 shrink-0 bg-slate-50 px-5 py-5 flex flex-col items-center justify-start border-r border-slate-100">
            <WhatsAppPreview
              headerType={form.headerType}
              headerText={form.headerText}
              body={form.body}
              footer={form.footer}
              buttons={form.buttons.filter(b => b.text.trim())}
              samples={form.samples}
            />
            {allVars.length > 0 && (
              <div className="mt-4 w-full">
                <p className="text-[11px] font-medium text-slate-500 mb-2">משתנים שזוהו:</p>
                <div className="flex flex-wrap gap-1">
                  {allVars.map(v => (
                    <code key={v} className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                      {'{{'}{v}{'}}'}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionsMenu({
  tpl, onEdit, onDuplicate, onDelete, onSubmit, onCheckStatus,
}: {
  tpl: WhatsAppTemplate
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void
  onSubmit: () => void; onCheckStatus: () => void
}) {
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleCheckStatus() {
    setOpen(false)
    setChecking(true)
    await onCheckStatus()
    setChecking(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors text-xs"
      >
        פעולות <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            <MenuItem icon={Edit3}       label="עריכה"               onClick={() => { setOpen(false); onEdit() }} />
            <MenuItem icon={Copy}        label="שכפול"               onClick={() => { setOpen(false); onDuplicate() }} />
            {['draft', 'rejected'].includes(tpl.meta_status) && (
              <MenuItem icon={Send} label="שלח לאישור Meta" onClick={() => { setOpen(false); onSubmit() }} className="text-indigo-600" />
            )}
            {tpl.meta_status !== 'draft' && (
              <MenuItem icon={checking ? Loader2 : RefreshCw} label="בדוק סטטוס" onClick={handleCheckStatus} />
            )}
            <div className="border-t border-slate-100 my-1" />
            <MenuItem icon={Trash2} label="מחיקה" onClick={() => { setOpen(false); onDelete() }} className="text-red-500" />
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick, className }: { icon: React.ElementType; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx('w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-right', className)}
    >
      <Icon size={13} className="shrink-0" /> {label}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTpl, setEditTpl] = useState<WhatsAppTemplate | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp-templates')
      if (res.ok) {
        const data = await res.json() as WhatsAppTemplate[]
        setTemplates(Array.isArray(data) ? data : [])
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew()    { setEditTpl(null); setShowModal(true) }
  function openEdit(t: WhatsAppTemplate) { setEditTpl(t); setShowModal(true) }

  function handleSaved(t: WhatsAppTemplate) {
    setTemplates(prev => {
      const exists = prev.find(x => x.id === t.id)
      return exists ? prev.map(x => x.id === t.id ? t : x) : [t, ...prev]
    })
    setShowModal(false)
    notify(t.meta_status === 'pending' ? 'תבנית נשלחה ל-Meta לאישור' : 'תבנית נשמרה כטיוטה')
  }

  async function handleDuplicate(t: WhatsAppTemplate) {
    const payload = {
      name: t.name + '_copy', category: t.category, language: t.language,
      header_type: t.header_type, header_text: t.header_text,
      body: t.body, footer: t.footer, buttons: t.buttons,
      variables: t.variables, sample_values: t.sample_values,
    }
    const res = await fetch('/api/whatsapp-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    if (res.ok) { const nt = await res.json() as WhatsAppTemplate; setTemplates(prev => [nt, ...prev]); notify('תבנית שוכפלה') }
    else notify('שכפול נכשל', 'error')
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק את התבנית הזו?')) return
    const res = await fetch(`/api/whatsapp-templates/${id}`, { method: 'DELETE' })
    if (res.ok) { setTemplates(prev => prev.filter(t => t.id !== id)); notify('תבנית נמחקה') }
    else notify('מחיקה נכשלה', 'error')
  }

  async function handleSubmit(t: WhatsAppTemplate) {
    const res = await fetch('/api/meta/templates/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: t.id, name: t.name, category: t.category,
        language: t.language, header_type: t.header_type, header_text: t.header_text,
        body: t.body, footer: t.footer, buttons: t.buttons, sample_values: t.sample_values,
      }),
    })
    const data = await res.json() as { ok: boolean; draft?: boolean; message?: string; error?: string }
    if (data.draft) { notify(data.message || 'נשמר כטיוטה — Meta לא מחובר', 'error'); return }
    if (!data.ok) { notify(data.error || 'שליחה נכשלה', 'error'); return }
    setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, meta_status: 'pending' } : x))
    notify('תבנית נשלחה ל-Meta לאישור')
  }

  async function handleCheckStatus(t: WhatsAppTemplate) {
    const res = await fetch(`/api/meta/templates/status?id=${t.id}`)
    if (!res.ok) { notify('בדיקת סטטוס נכשלה', 'error'); return }
    const data = await res.json() as { status: string; template: WhatsAppTemplate }
    setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, meta_status: data.status as WhatsAppTemplate['meta_status'] } : x))
    notify(`סטטוס עודכן: ${STATUS_CONFIG[data.status]?.label || data.status}`)
  }

  const displayed = statusFilter === 'all' ? templates : templates.filter(t => t.meta_status === statusFilter)
  const counts = templates.reduce((acc, t) => {
    acc[t.meta_status] = (acc[t.meta_status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">תבניות הודעה לוואטסאפ</h1>
          <p className="text-sm text-slate-500">
            צור, אשר ונצל תבניות הודעה מאושרות לקמפיינים, תזכורות ואוטומציות.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> תבנית חדשה
        </button>
      </div>

      {/* Meta notice */}
      {!templates.some(t => t.meta_status !== 'draft') && templates.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3 items-start">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Meta לא מחובר עדיין</p>
            <p className="text-xs text-amber-700 mt-0.5">
              הוסף <code className="bg-amber-100 px-1 rounded">META_ACCESS_TOKEN</code> ו-<code className="bg-amber-100 px-1 rounded">META_WABA_ID</code> ב-Vercel כדי לשלוח תבניות לאישור.
            </p>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {[
          { key: 'all',      label: `הכל (${templates.length})` },
          { key: 'approved', label: `מאושר (${counts.approved || 0})` },
          { key: 'pending',  label: `ממתין (${counts.pending || 0})` },
          { key: 'rejected', label: `נדחה (${counts.rejected || 0})` },
          { key: 'draft',    label: `טיוטה (${counts.draft || 0})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              statusFilter === f.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState onNew={openNew} filtered={statusFilter !== 'all'} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <Th>שם תבנית</Th>
                <Th>קטגוריה</Th>
                <Th>שפה</Th>
                <Th>סטטוס Meta</Th>
                <Th>עודכן</Th>
                <Th>שימושים</Th>
                <Th>פעולות</Th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(tpl => {
                const statusCfg = STATUS_CONFIG[tpl.meta_status] || STATUS_CONFIG.draft
                const StatusIcon = statusCfg.icon
                return (
                  <tr key={tpl.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <Td>
                      <div>
                        <p className="font-medium text-slate-800 font-mono text-xs">{tpl.name}</p>
                        {tpl.meta_template_id && (
                          <p className="text-[10px] text-slate-400 mt-0.5">ID: {tpl.meta_template_id}</p>
                        )}
                        {tpl.rejection_reason && (
                          <p className="text-[10px] text-red-500 mt-0.5 max-w-[200px] truncate" title={tpl.rejection_reason}>
                            ❌ {tpl.rejection_reason}
                          </p>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLOR[tpl.category])}>
                        {CATEGORY_LABEL[tpl.category] || tpl.category}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-600">{tpl.language === 'he' ? 'עברית' : 'English'}</span>
                    </Td>
                    <Td>
                      <span className={clsx('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', statusCfg.color)}>
                        <StatusIcon size={11} /> {statusCfg.label}
                      </span>
                    </Td>
                    <Td><span className="text-xs text-slate-500">{relativeDate(tpl.updated_at)}</span></Td>
                    <Td><span className="text-xs text-slate-600">{tpl.usage_count}</span></Td>
                    <Td>
                      <ActionsMenu
                        tpl={tpl}
                        onEdit={() => openEdit(tpl)}
                        onDuplicate={() => handleDuplicate(tpl)}
                        onDelete={() => handleDelete(tpl.id)}
                        onSubmit={() => handleSubmit(tpl)}
                        onCheckStatus={() => handleCheckStatus(tpl)}
                      />
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TemplateModal onClose={() => setShowModal(false)} onSaved={handleSaved} editTpl={editTpl} />
      )}

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function EmptyState({ onNew, filtered }: { onNew: () => void; filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <FileText size={28} className="text-slate-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-600">
          {filtered ? 'אין תבניות בסטטוס זה' : 'עדיין לא יצרת תבניות הודעה'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {filtered ? 'נסה לשנות את הסינון' : 'צור תבנית ושלח לאישור Meta לשימוש בקמפיינים'}
        </p>
      </div>
      {!filtered && (
        <button
          onClick={onNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} /> צור תבנית ראשונה
        </button>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-right">{children}</td>
}

const LABEL = 'block text-xs font-medium text-slate-600 mb-1'
const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
