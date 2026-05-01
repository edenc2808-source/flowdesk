'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ConversationList, { type InboxFilter } from './ConversationList'
import ChatPanel from './ChatPanel'
import ContactPanel from './ContactPanel'
import type { Conversation, Lead } from '@/types'
import { DEMO_CONVERSATIONS } from '@/lib/demo-data'

const POLL_INTERVAL = 8000

export default function InboxView() {
  const [conversations, setConversations] = useState<Conversation[]>(DEMO_CONVERSATIONS)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(search)
  searchRef.current = search

  const fetchConversations = useCallback(async () => {
    try {
      const params = searchRef.current ? `?search=${encodeURIComponent(searchRef.current)}` : ''
      const res = await fetch(`/api/conversations${params}`)
      if (!res.ok) return // keep demo data when not authenticated
      const data = await res.json()
      if (Array.isArray(data)) setConversations(data)
    } catch {
      // keep demo data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(fetchConversations, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search, fetchConversations])

  useEffect(() => {
    const t = setInterval(fetchConversations, POLL_INTERVAL)
    return () => clearInterval(t)
  }, [fetchConversations])

  function selectConversation(conv: Conversation) {
    setSelectedConvId(conv.id)
    setSelectedLead((conv.lead as Lead) ?? null)
    fetch(`/api/conversations/${conv.id}/read`, { method: 'POST' })
      .then(() => {
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
      })
      .catch(() => {})
  }

  function onLeadUpdated(updated: Lead) {
    setSelectedLead(updated)
    setConversations(prev => prev.map(c => c.lead_id === updated.id ? { ...c, lead: updated } : c))
  }

  // Filter by search client-side too
  const displayed = search
    ? conversations.filter(c => c.lead?.name?.toLowerCase().includes(search.toLowerCase()))
    : conversations

  return (
    <div className="flex h-full overflow-hidden">
      {/* Column 1 — Conversation list (right in RTL) */}
      <ConversationList
        conversations={displayed}
        selectedId={selectedConvId}
        search={search}
        filter={filter}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onSelect={selectConversation}
        loading={loading}
      />

      {/* Column 2 — Chat window */}
      <div className="flex-1 min-w-0 flex flex-col border-x border-slate-200">
        {selectedConvId && selectedLead ? (
          <ChatPanel
            key={selectedConvId}
            conversationId={selectedConvId}
            lead={selectedLead}
            onMessagesChange={fetchConversations}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Column 3 — Contact details (left in RTL) */}
      <div className="w-64 shrink-0 bg-white border-r border-slate-100 overflow-hidden">
        {selectedLead ? (
          <ContactPanel
            key={selectedLead.id}
            lead={selectedLead}
            conversationId={selectedConvId}
            assignedAgentId={conversations.find(c => c.id === selectedConvId)?.assigned_agent_id ?? null}
            onUpdated={onLeadUpdated}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm px-4 text-center">
            בחר שיחה לצפייה בפרטי הלקוח
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-600">בחר שיחה להתחלה</p>
        <p className="text-xs text-slate-400 mt-1">או הוסף איש קשר חדש מהתפריט</p>
      </div>
    </div>
  )
}
