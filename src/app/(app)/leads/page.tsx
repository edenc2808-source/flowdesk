'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import type { Lead, LeadStatus } from '@/types'
import AddLeadModal from '@/components/leads/AddLeadModal'

const STATUS_STYLES: Record<LeadStatus, string> = {
  new:         'bg-blue-50 text-blue-700',
  contacted:   'bg-yellow-50 text-yellow-700',
  responded:   'bg-green-50 text-green-700',
  appointment: 'bg-purple-50 text-purple-700',
  no_response: 'bg-red-50 text-red-600',
  closed:      'bg-slate-100 text-slate-600',
}

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'responded', label: 'Responded' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'no_response', label: 'No Response' },
  { value: 'closed', label: 'Closed' },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filter) p.set('status', filter)
    if (search) p.set('search', search)
    const res = await fetch(`/api/leads?${p}`)
    setLeads(await res.json())
    setLoading(false)
  }, [filter, search])

  useEffect(() => { fetch_() }, [fetch_])

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">{leads.length} leads</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> Add Lead
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..."
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-56" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map(s => (
              <button key={s.value} onClick={() => setFilter(s.value)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filter === s.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No leads found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 font-medium border-b border-slate-100">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Tags</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{lead.name}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{lead.phone}</td>
                  <td className="px-5 py-3">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[lead.status])}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{lead.source}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {lead.tags?.slice(0, 3).map(t => (
                        <span key={t} className="bg-indigo-50 text-indigo-600 text-xs px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{format(new Date(lead.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); fetch_() }} />}
    </div>
  )
}
