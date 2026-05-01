'use client'

import { useState, useEffect } from 'react'
import { Plus, Send, Users, Eye, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react'
import clsx from 'clsx'
import type { Campaign, WhatsAppTemplate } from '@/types'
import { DEMO_CAMPAIGNS } from '@/lib/demo-data'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: 'טיוטה',      color: 'bg-slate-100 text-slate-500' },
  scheduled: { label: 'מתוכנן',     color: 'bg-blue-50 text-blue-600' },
  running:   { label: 'בריצה',      color: 'bg-green-50 text-green-600' },
  completed: { label: 'הושלם',      color: 'bg-indigo-50 text-indigo-600' },
  paused:    { label: 'מושהה',      color: 'bg-amber-50 text-amber-600' },
}

export default function CampaignsPage() {
  const [campaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS)
  const [showForm, setShowForm] = useState(false)

  const totalSent = campaigns.reduce((s, c) => s + c.sent_count, 0)
  const totalReplies = campaigns.reduce((s, c) => s + c.reply_count, 0)

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">קמפיינים</h1>
          <p className="text-sm text-slate-500">{campaigns.length} קמפיינים · {totalSent} הודעות נשלחו</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> קמפיין חדש
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard icon={Send} label="סה״כ נשלחו" value={totalSent.toLocaleString()} color="text-indigo-600" bg="bg-indigo-50" />
        <KpiCard icon={Eye} label="סה״כ נקראו" value={campaigns.reduce((s, c) => s + c.read_count, 0).toLocaleString()} color="text-purple-600" bg="bg-purple-50" />
        <KpiCard icon={MessageSquare} label="סה״כ ענו" value={totalReplies.toLocaleString()} color="text-green-600" bg="bg-green-50" />
      </div>

      {/* Campaign list */}
      <div className="space-y-4">
        {campaigns.map(camp => {
          const cfg = STATUS_CONFIG[camp.status] ?? STATUS_CONFIG.draft
          const deliveryRate = camp.sent_count > 0 ? Math.round((camp.delivered_count / camp.sent_count) * 100) : 0
          const readRate = camp.delivered_count > 0 ? Math.round((camp.read_count / camp.delivered_count) * 100) : 0
          const replyRate = camp.read_count > 0 ? Math.round((camp.reply_count / camp.read_count) * 100) : 0

          return (
            <div key={camp.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{camp.name}</h3>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>{cfg.label}</span>
                  </div>
                  {camp.scheduled_at && (
                    <p className="text-xs text-slate-400">
                      {camp.status === 'completed' ? 'נשלח' : 'מתוכנן ל'}: {new Date(camp.scheduled_at).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
                {camp.status === 'draft' && (
                  <button className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5">
                    <Send size={12} /> שלח
                  </button>
                )}
              </div>

              {camp.sent_count > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  <Metric label="נשלח" value={camp.sent_count} total={camp.audience_size} />
                  <Metric label="נמסר" value={camp.delivered_count} total={camp.sent_count} rate={deliveryRate} />
                  <Metric label="נקרא" value={camp.read_count} total={camp.delivered_count} rate={readRate} />
                  <Metric label="ענו" value={camp.reply_count} total={camp.read_count} rate={replyRate} highlight />
                </div>
              )}

              {camp.sent_count === 0 && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                  <Users size={13} />
                  <span>קמפיין בטיוטה — בחר קהל ותבנית לפני שליחה</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showForm && <CampaignForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center mb-2', bg)}>
        <Icon size={16} className={color} />
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function Metric({ label, value, total, rate, highlight }: { label: string; value: number; total: number; rate?: number; highlight?: boolean }) {
  return (
    <div className={clsx('rounded-lg p-3 text-center', highlight ? 'bg-green-50 border border-green-100' : 'bg-slate-50')}>
      <p className={clsx('text-lg font-bold', highlight ? 'text-green-700' : 'text-slate-800')}>{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {rate !== undefined && <p className={clsx('text-xs font-semibold mt-0.5', highlight ? 'text-green-600' : 'text-slate-500')}>{rate}%</p>}
    </div>
  )
}

function CampaignForm({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')

  useEffect(() => {
    fetch('/api/whatsapp-templates')
      .then(r => r.ok ? r.json() : [])
      .then((data: WhatsAppTemplate[]) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const approved   = templates.filter(t => t.meta_status === 'approved')
  const unapproved = templates.filter(t => t.meta_status !== 'approved')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-5">
          <Send size={18} className="text-indigo-600" />
          <h2 className="font-bold text-slate-900">קמפיין חדש</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">שם הקמפיין</label>
            <input placeholder="לדוגמה: מבצע קיץ" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">תבנית הודעה</label>
            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className={INPUT}>
              <option value="">בחר תבנית מאושרת...</option>
              {approved.length > 0 && (
                <optgroup label="✅ מאושרות">
                  {approved.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </optgroup>
              )}
              {unapproved.length > 0 && (
                <optgroup label="⏳ לא מאושרות (לא ניתן לשלוח)">
                  {unapproved.map(t => <option key={t.id} value={t.id} disabled>{t.name} ({t.meta_status === 'pending' ? 'ממתין' : t.meta_status === 'draft' ? 'טיוטה' : 'נדחה'})</option>)}
                </optgroup>
              )}
            </select>
            {templates.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                אין תבניות — <a href="/templates" className="text-indigo-600 hover:underline">צור תבנית ושלח לאישור Meta</a>
              </p>
            )}
            {selectedTemplate && approved.find(t => t.id === selectedTemplate) && (
              <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <CheckCircle size={11} /> תבנית מאושרת — ניתן לשלוח
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">קהל יעד</label>
            <select className={INPUT}>
              <option>כל אנשי הקשר</option>
              <option>לקוחות לא פעילים 30 יום</option>
              <option>לקוחות עם פגישה הושלמה</option>
              <option>לפי תגית: VIP</option>
            </select>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start">
            <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">שליחת הודעות ב-WhatsApp Business API דורשת תבניות מאושרות בלבד.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">ביטול</button>
          <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium">שמור טיוטה</button>
        </div>
      </div>
    </div>
  )
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
