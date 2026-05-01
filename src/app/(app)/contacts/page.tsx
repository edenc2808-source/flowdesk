'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, MessageSquare, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import type { Lead, LeadStatus } from '@/types'
import { DEMO_CONTACTS } from '@/lib/demo-data'
import AddLeadModal from '@/components/leads/AddLeadModal'
import BookAppointmentModal from '@/components/appointments/BookAppointmentModal'

const STATUS_STYLES: Record<LeadStatus, string> = {
  new:         'bg-blue-50 text-blue-700',
  contacted:   'bg-yellow-50 text-yellow-700',
  responded:   'bg-amber-50 text-amber-700',
  appointment: 'bg-purple-50 text-purple-700',
  no_response: 'bg-red-50 text-red-600',
  closed:      'bg-slate-100 text-slate-600',
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new:         'חדש',
  contacted:   'ממתין ללקוח',
  responded:   'ממתין לתגובה',
  appointment: 'פגישה',
  no_response: 'נדרש מעקב',
  closed:      'סגור',
}

const FILTERS = [
  { value: '', label: 'הכל' },
  { value: 'new', label: 'חדש' },
  { value: 'responded', label: 'ממתין לתגובה' },
  { value: 'appointment', label: 'פגישה' },
  { value: 'no_response', label: 'נדרש מעקב' },
  { value: 'closed', label: 'סגור' },
]

const SOURCE_LABELS: Record<string, string> = {
  manual: 'ידני', website: 'אתר', referral: 'הפניה',
  social: 'רשתות', email: 'אימייל', other: 'אחר',
}

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Lead[]>(DEMO_CONTACTS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filter) p.set('status', filter)
      if (search) p.set('search', search)
      const res = await fetch(`/api/leads?${p}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setContacts(data)
      }
    } catch {
      // keep demo data
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">אנשי קשר</h1>
          <p className="text-sm text-slate-500">{contacts.length} אנשי קשר</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> הוסף איש קשר
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם..."
              className="pr-9 pl-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-56"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(s => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filter === s.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">טוען...</div>
        ) : contacts.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">לא נמצאו אנשי קשר</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-slate-500 font-medium border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3">שם</th>
                <th className="px-5 py-3">טלפון</th>
                <th className="px-5 py-3">סטטוס</th>
                <th className="px-5 py-3">מקור</th>
                <th className="px-5 py-3">תגיות</th>
                <th className="px-5 py-3">נוצר</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {contacts.map(contact => (
                <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {contact.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs" dir="ltr">{contact.phone}</td>
                  <td className="px-5 py-3">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[contact.status])}>
                      {STATUS_LABELS[contact.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{SOURCE_LABELS[contact.source] ?? contact.source}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags?.slice(0, 2).map(t => (
                        <span key={t} className="bg-indigo-50 text-indigo-600 text-xs px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {format(new Date(contact.created_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        title="פתח שיחה"
                        onClick={() => router.push(`/inbox?lead_id=${contact.id}`)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <MessageSquare size={15} />
                      </button>
                      <button
                        title="קבע פגישה"
                        onClick={() => setBookingLead(contact)}
                        className="text-slate-400 hover:text-purple-600 transition-colors"
                      >
                        <Calendar size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load() }}
        />
      )}

      {bookingLead && (
        <BookAppointmentModal
          leadId={bookingLead.id}
          leadName={bookingLead.name}
          onClose={() => setBookingLead(null)}
          onBooked={() => setBookingLead(null)}
        />
      )}
    </div>
  )
}
