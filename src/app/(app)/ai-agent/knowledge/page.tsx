'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Brain, FileText, Upload, Pencil, Trash2, Eye,
  EyeOff, CheckCircle, AlertCircle, X, Loader2, FileUp,
} from 'lucide-react'
import clsx from 'clsx'
import type { KnowledgeDocument } from '@/types'

const PLACEHOLDERS: Record<string, string> = {
  services:    'דוגמה: שירותי הסרת שיער בלייזר, טיפולי פנים, בוטוקס...',
  prices:      'דוגמה: הסרת שיער — גפיים ₪300, מלא ₪800...',
  hours:       'דוגמה: שעות פתיחה: ראשון-חמישי 09:00-19:00, שישי 09:00-14:00...',
  faq:         'דוגמה: ש: כמה זמן לוקח טיפול? ת: כ-30 דקות...',
  policy:      'דוגמה: ביטול עד 24 שעות מראש ללא חיוב...',
  booking:     'דוגמה: ניתן לקבוע פגישה דרך WhatsApp, אתר או בטלפון...',
  tone:        'דוגמה: פנייה בגוף ראשון, ידידותי ומקצועי, שימוש בשמות פרטיים...',
}

const QUICK_TYPES = [
  { key: 'services', label: 'שירותים ומחירים', icon: '💆' },
  { key: 'hours',    label: 'שעות פעילות',     icon: '🕐' },
  { key: 'faq',      label: 'שאלות נפוצות',    icon: '❓' },
  { key: 'policy',   label: 'מדיניות ביטול',   icon: '📋' },
  { key: 'booking',  label: 'כללי הזמנה',       icon: '📅' },
  { key: 'tone',     label: 'סגנון תגובה',      icon: '🗣️' },
]

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null)
  const [quickType, setQuickType] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/knowledge')
      .then(r => r.ok ? r.json() : [])
      .then((data: KnowledgeDocument[]) => { setDocs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function toggleStatus(doc: KnowledgeDocument) {
    const newStatus = doc.status === 'active' ? 'inactive' : 'active'
    const res = await fetch(`/api/knowledge/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: newStatus } : d))
  }

  async function deleteDoc(id: string) {
    if (!confirm('למחוק את המסמך?')) return
    const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    if (res.ok) setDocs(prev => prev.filter(d => d.id !== id))
  }

  function openNew(type?: string) {
    setQuickType(type ?? null)
    setEditingDoc(null)
    setShowForm(true)
  }

  function openEdit(doc: KnowledgeDocument) {
    setEditingDoc(doc)
    setQuickType(null)
    setShowForm(true)
  }

  const activeCount = docs.filter(d => d.status === 'active').length

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={20} className="text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">מאגר הידע של ה-AI</h1>
          </div>
          <p className="text-sm text-slate-500">
            {activeCount} מסמכים פעילים — ה-AI יענה על שאלות לקוחות רק לפי מידע זה
          </p>
        </div>
        <button
          onClick={() => openNew()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> הוסף מסמך
        </button>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5 text-sm text-indigo-700">
        <p className="font-semibold mb-1">איך זה עובד?</p>
        <p className="text-xs text-indigo-600 leading-relaxed">
          כשלקוח שולח הודעת WhatsApp, ה-AI קורא את מאגר הידע שלך וממליץ על תגובה מתאימה.
          אם השאלה לא מוסברת במסמכים — ה-AI לא ימציא תשובה אלא יציין שיצור קשר.
        </p>
      </div>

      {/* Quick add types */}
      {docs.length === 0 && !loading && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">התחל עם תבנית מהירה</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => openNew(t.key)}
                className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl p-3 text-right transition-colors"
              >
                <span className="text-lg">{t.icon}</span>
                <p className="text-xs font-medium text-slate-700 mt-1">{t.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
          טוען...
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <Brain size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">אין מסמכי ידע עדיין</p>
          <p className="text-slate-400 text-xs mt-1 mb-4">הוסף מידע על העסק כדי לאפשר לAI לענות ללקוחות</p>
          <button
            onClick={() => openNew()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            הוסף מסמך ראשון
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onEdit={() => openEdit(doc)}
              onDelete={() => deleteDoc(doc.id)}
              onToggle={() => toggleStatus(doc)}
              onPreview={() => setPreviewDoc(doc)}
            />
          ))}
        </div>
      )}

      {/* Forms & Modals */}
      {showForm && (
        <DocumentForm
          doc={editingDoc}
          quickType={quickType}
          placeholder={quickType ? PLACEHOLDERS[quickType] : undefined}
          onClose={() => { setShowForm(false); setEditingDoc(null); setQuickType(null) }}
          onSaved={(saved) => {
            if (editingDoc) {
              setDocs(prev => prev.map(d => d.id === saved.id ? saved : d))
            } else {
              setDocs(prev => [saved, ...prev])
            }
            setShowForm(false)
            setEditingDoc(null)
            setQuickType(null)
          }}
        />
      )}

      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}

/* ─── Document Card ─────────────────────────────────────────────────────── */

function DocumentCard({
  doc, onEdit, onDelete, onToggle, onPreview
}: {
  doc: KnowledgeDocument
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onPreview: () => void
}) {
  const isActive = doc.status === 'active'
  const preview = doc.content?.trim().slice(0, 120) ?? ''

  return (
    <div className={clsx(
      'bg-white border rounded-xl p-4 transition-all',
      isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <div className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
        )}>
          <FileText size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-slate-800 text-sm">{doc.title}</h3>
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1',
              isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
            )}>
              {isActive ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
              {isActive ? 'פעיל' : 'מושבת'}
            </span>
            {doc.file_name && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <FileUp size={10} /> {doc.file_name}
              </span>
            )}
          </div>
          {preview ? (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{preview}…</p>
          ) : (
            <p className="text-xs text-slate-400 italic">אין תוכן טקסט — ה-AI לא יכול להשתמש במסמך זה</p>
          )}
          <p className="text-xs text-slate-400 mt-1.5">
            עודכן {new Date(doc.updated_at).toLocaleDateString('he-IL')}
            {doc.content && ` · ${doc.content.length.toLocaleString()} תווים`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onPreview} title="תצוגה מקדימה"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Eye size={14} />
          </button>
          <button onClick={onEdit} title="עריכה"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={onToggle} title={isActive ? 'השבת' : 'הפעל'}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              isActive
                ? 'text-green-600 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
            )}>
            {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={onDelete} title="מחק"
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Document Form ─────────────────────────────────────────────────────── */

function DocumentForm({
  doc, quickType, placeholder, onClose, onSaved
}: {
  doc: KnowledgeDocument | null
  quickType: string | null
  placeholder?: string
  onClose: () => void
  onSaved: (doc: KnowledgeDocument) => void
}) {
  const quickLabel = QUICK_TYPES.find(t => t.key === quickType)?.label
  const [tab, setTab] = useState<'text' | 'file'>('text')
  const [form, setForm] = useState({
    title: doc?.title ?? quickLabel ?? '',
    content: doc?.content ?? '',
    status: doc?.status ?? 'active',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileNote, setFileNote] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (tab === 'file' && file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', form.title || file.name)
        const res = await fetch('/api/knowledge/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'שגיאה'); setLoading(false); return }
        if (data.note) setFileNote(data.note)
        onSaved(data)
      } else {
        const method = doc ? 'PATCH' : 'POST'
        const url = doc ? `/api/knowledge/${doc.id}` : '/api/knowledge'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'שגיאה'); setLoading(false); return }
        onSaved(data)
      }
    } catch {
      setError('שגיאת רשת')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">
            {doc ? 'עריכת מסמך' : quickLabel ? `הוסף: ${quickLabel}` : 'מסמך ידע חדש'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher (only for new docs) */}
        {!doc && (
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setTab('text')}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                tab === 'text' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <FileText size={15} /> הזנת טקסט
            </button>
            <button
              onClick={() => setTab('file')}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                tab === 'file' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Upload size={15} /> העלאת קובץ
            </button>
          </div>
        )}

        <form onSubmit={save} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">כותרת המסמך *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
              className={INPUT}
              placeholder="לדוגמה: שאלות נפוצות, שירותים ומחירים..."
            />
          </div>

          {tab === 'text' ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                תוכן המסמך
                <span className="text-slate-400 font-normal ml-1">— ה-AI ישתמש בתוכן זה לענות ללקוחות</span>
              </label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={12}
                placeholder={placeholder || 'הכנס כאן את המידע שה-AI צריך לדעת...'}
                className={INPUT + ' resize-none font-mono text-xs leading-relaxed'}
              />
              <p className="text-xs text-slate-400 mt-1">
                {form.content.length.toLocaleString()} תווים
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">קובץ</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                {file ? (
                  <div className="text-sm text-slate-700">
                    <FileText size={24} className="mx-auto text-indigo-500 mb-2" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">לחץ להעלאה</p>
                    <p className="text-xs text-slate-400 mt-1">TXT (חילוץ אוטומטי) · PDF · DOCX (עד 10MB)</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.pdf,.docx,.doc"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) { setFile(f); if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, '') })) }
                  }}
                />
              </div>
              {fileNote && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-2">{fileNote}</p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="status"
              checked={form.status === 'active'}
              onChange={e => setForm(p => ({ ...p, status: e.target.checked ? 'active' : 'inactive' }))}
              className="rounded"
            />
            <label htmlFor="status" className="text-xs text-slate-600">
              פעיל — ה-AI ישתמש במסמך זה לענות ללקוחות
            </label>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
              ביטול
            </button>
            <button type="submit" disabled={loading || (tab === 'file' && !file && !doc)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : doc ? 'שמור שינויים' : 'הוסף מסמך'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Preview Modal ─────────────────────────────────────────────────────── */

function PreviewModal({ doc, onClose }: { doc: KnowledgeDocument; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">{doc.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {doc.content?.length.toLocaleString() ?? 0} תווים ·{' '}
              <span className={doc.status === 'active' ? 'text-green-600' : 'text-slate-400'}>
                {doc.status === 'active' ? '✓ פעיל' : '⊘ מושבת'}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {doc.content ? (
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 rounded-lg p-4">
              {doc.content}
            </pre>
          ) : (
            <p className="text-slate-400 text-sm italic text-center py-8">אין תוכן טקסט</p>
          )}
        </div>
      </div>
    </div>
  )
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
