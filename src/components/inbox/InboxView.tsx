'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ConversationList from './ConversationList'
import ChatPanel from './ChatPanel'
import LeadDetails from './LeadDetails'
import type { Conversation, Lead } from '@/types'

const POLL_INTERVAL = 8000

export default function InboxView() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  // Stable ref avoids re-creating the interval on every search change
  const searchRef = useRef(search)
  searchRef.current = search

  const fetchConversations = useCallback(async () => {
    try {
      const params = searchRef.current ? `?search=${encodeURIComponent(searchRef.current)}` : ''
      const res = await fetch(`/api/conversations${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('[InboxView] fetch conversations error:', err)
    } finally {
      setLoading(false)
    }
  }, []) // stable — no deps that change

  // Initial load + re-fetch when search changes (debounced)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(fetchConversations, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search, fetchConversations])

  // Single polling interval — uses searchRef so it always sees current search
  useEffect(() => {
    const t = setInterval(fetchConversations, POLL_INTERVAL)
    return () => clearInterval(t)
  }, [fetchConversations])

  function selectConversation(conv: Conversation) {
    setSelectedConvId(conv.id)
    setSelectedLead((conv.lead as Lead) ?? null)
    fetch(`/api/conversations/${conv.id}/read`, { method: 'POST' }).then(() => {
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
      )
    }).catch(console.warn)
  }

  function onLeadUpdated(updated: Lead) {
    setSelectedLead(updated)
    setConversations(prev =>
      prev.map(c => c.lead_id === updated.id ? { ...c, lead: updated } : c)
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        conversations={conversations}
        selectedId={selectedConvId}
        search={search}
        onSearchChange={setSearch}
        onSelect={selectConversation}
        loading={loading}
      />

      <div className="flex-1 min-w-0 flex flex-col border-x border-slate-200">
        {selectedConvId && selectedLead ? (
          <ChatPanel
            key={selectedConvId} // unmount/remount on conversation change — clears all state cleanly
            conversationId={selectedConvId}
            lead={selectedLead}
            onMessagesChange={fetchConversations}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      <div className="w-72 shrink-0 bg-white border-l border-slate-100">
        {selectedLead ? (
          <LeadDetails
            key={selectedLead.id} // remount on lead change — clears local form state
            lead={selectedLead}
            onUpdated={onLeadUpdated}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm px-4 text-center">
            Select a conversation to see lead details
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p className="text-sm font-medium">Select a conversation</p>
      <p className="text-xs text-slate-300">Or add a new lead from the Leads page</p>
    </div>
  )
}
