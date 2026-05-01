'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, AlertCircle, FileText, Calendar, StickyNote, Sparkles, ThumbsUp, X, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import type { Lead, Message, Template, AiSuggestion } from '@/types'
import { DEMO_MESSAGES, DEMO_TEMPLATES } from '@/lib/demo-data'
import BookAppointmentModal from '@/components/appointments/BookAppointmentModal'

interface Props {
  conversationId: string
  lead: Lead
  onMessagesChange: () => void
}

export default function ChatPanel({ conversationId, lead, onMessagesChange }: Props) {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES[conversationId] ?? [])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isSendingRef = useRef(false)

  const fetchMessages = useCallback(async () => {
    if (isSendingRef.current) return
    try {
      const res = await fetch(`/api/messages?conversation_id=${conversationId}`)
      if (!res.ok) return // keep demo data
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) setMessages(data)
    } catch {
      // keep demo data
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    setLoading(true)
    setMessages(DEMO_MESSAGES[conversationId] ?? [])
    setSuggestion(null)
    fetchMessages()
    // Load AI suggestion for this conversation
    fetch(`/api/ai/suggest?conversation_id=${conversationId}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: AiSuggestion | null) => { if (data?.id) setSuggestion(data) })
      .catch(() => {})
  }, [fetchMessages, conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const t = setInterval(fetchMessages, 5000)
    return () => clearInterval(t)
  }, [fetchMessages])

  async function send() {
    const content = text.trim()
    if (!content || sending) return

    setSending(true)
    isSendingRef.current = true
    setSendError(null)
    setText('')

    const tempId = `opt-${Date.now()}`
    const optimistic: Message = {
      id: tempId, conversation_id: conversationId, direction: 'outbound',
      content, status: 'sent', created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, content }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setSendError(data.error || 'שליחה נכשלה')
        setText(content)
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...data } : m))
        if (data.delivery_failed) setSendError('ההודעה נשמרה אך לא נמסרה דרך WhatsApp. בדוק Twilio.')
        onMessagesChange()
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setSendError('שגיאת רשת — נסה שוב')
      setText(content)
    } finally {
      setSending(false)
      isSendingRef.current = false
      inputRef.current?.focus()
    }
  }

  async function dismissSuggestion() {
    if (!suggestion) return
    setSuggestion(null)
    fetch('/api/ai/suggest', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: suggestion.id, status: 'dismissed' }),
    }).catch(() => {})
  }

  function useSuggestion() {
    if (!suggestion) return
    setText(suggestion.suggested_reply)
    setSuggestion(null)
    inputRef.current?.focus()
    fetch('/api/ai/suggest', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: suggestion.id, status: 'approved' }),
    }).catch(() => {})
  }

  async function regenerateSuggestion() {
    const lastInbound = [...messages].reverse().find(m => m.direction === 'inbound')
    if (!lastInbound) return
    setSuggestionLoading(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, message: lastInbound.content }),
      })
      if (res.ok) {
        const data: AiSuggestion = await res.json()
        if (data?.id) setSuggestion(data)
      }
    } finally {
      setSuggestionLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function insertTemplate(tpl: Template) {
    const msg = tpl.content
      .replace(/\{\{customer_name\}\}/g, lead.name)
      .replace(/\{\{name\}\}/g, lead.name)
    setText(msg)
    setShowTemplates(false)
    inputRef.current?.focus()
  }

  const STATUS_LABEL: Record<string, string> = {
    new: 'חדש', responded: 'ממתין לתגובה', contacted: 'ממתין ללקוח',
    appointment: 'פגישה', no_response: 'נדרש מעקב', closed: 'סגור',
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {lead.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">{lead.name}</p>
          <p className="text-xs text-slate-400" dir="ltr">{lead.phone}</p>
        </div>
        <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
          lead.status === 'appointment' ? 'bg-purple-100 text-purple-700' :
          lead.status === 'responded'   ? 'bg-amber-100 text-amber-700' :
          lead.status === 'no_response' ? 'bg-red-100 text-red-600' :
          lead.status === 'new'         ? 'bg-blue-100 text-blue-700' :
          lead.status === 'closed'      ? 'bg-slate-100 text-slate-500' :
          'bg-green-100 text-green-700'
        )}>
          {STATUS_LABEL[lead.status] ?? lead.status}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-slate-50">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
            <span className="text-3xl">💬</span>
            <p>אין הודעות עדיין — שלח את הראשונה</p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {sendError && (
        <div className="shrink-0 bg-red-50 border-t border-red-200 px-4 py-2 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 flex-1">{sendError}</p>
          <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>
      )}

      {/* AI Suggested Reply */}
      {suggestionLoading ? (
        <div className="shrink-0 border-t border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center gap-2 text-xs text-indigo-600">
          <Loader2 size={13} className="animate-spin shrink-0" />
          ה-AI מכין תגובה מוצעת...
        </div>
      ) : suggestion && (
        <div className="shrink-0 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 min-w-0">
              <Sparkles size={12} className="shrink-0" />
              תגובה מוצעת ע&quot;י AI
              {suggestion.source_doc_titles?.length > 0 && (
                <span className="text-indigo-400 font-normal truncate">
                  · {suggestion.source_doc_titles.join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={regenerateSuggestion} title="צור מחדש"
                className="p-1 text-indigo-400 hover:text-indigo-700 transition-colors">
                <RefreshCw size={12} />
              </button>
              <button onClick={dismissSuggestion} title="סגור"
                className="p-1 text-indigo-400 hover:text-indigo-700 transition-colors">
                <X size={12} />
              </button>
            </div>
          </div>
          <div className="px-4 pb-3">
            <p className="text-xs text-slate-700 leading-relaxed bg-white border border-indigo-100 rounded-lg px-3 py-2 mb-2">
              {suggestion.suggested_reply}
            </p>
            <button
              onClick={useSuggestion}
              className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <ThumbsUp size={11} /> השתמש בתגובה זו
            </button>
          </div>
        </div>
      )}

      {/* Template picker */}
      {showTemplates && (
        <div className="shrink-0 border-t border-slate-200 bg-white max-h-60 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100 flex justify-between items-center">
            <span>בחר תבנית</span>
            <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          {DEMO_TEMPLATES.filter(t => t.approval_status === 'approved').map(tpl => (
            <button
              key={tpl.id}
              onClick={() => insertTemplate(tpl)}
              className="w-full text-right px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors"
            >
              <p className="text-sm font-medium text-slate-800">{tpl.name}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{tpl.content.substring(0, 80)}...</p>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-4 pt-2 pb-3 shrink-0">
        {/* Action toolbar */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            title="הכנס תבנית"
            className={clsx(
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors',
              showTemplates ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            <FileText size={13} /> תבנית
          </button>
          <button
            onClick={() => setShowBook(true)}
            title="קבע פגישה"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Calendar size={13} /> פגישה
          </button>
          <button
            title="הוסף הערה פנימית"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <StickyNote size={13} /> הערה
          </button>
          <button
            onClick={regenerateSuggestion}
            disabled={suggestionLoading}
            title="תגובה מוצעת ע״י AI"
            className={clsx(
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors mr-auto',
              suggestion
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
            )}
          >
            {suggestionLoading
              ? <Loader2 size={13} className="animate-spin" />
              : <Sparkles size={13} />}
            AI
          </button>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => { setText(e.target.value); setSendError(null) }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="כתוב הודעה… (Enter לשליחה, Shift+Enter לשורה חדשה)"
            disabled={sending}
            className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent max-h-32 disabled:bg-slate-50"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="shrink-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>

      {showBook && (
        <BookAppointmentModal
          leadId={lead.id}
          leadName={lead.name}
          onClose={() => setShowBook(false)}
          onBooked={() => { setShowBook(false); onMessagesChange() }}
        />
      )}
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === 'outbound'
  const isNote = msg.type === 'note'
  const isOptimistic = msg.id.startsWith('opt-')
  const isFailed = msg.status === 'failed'

  if (isNote) {
    return (
      <div className="flex justify-center">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-lg max-w-md">
          📝 {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('flex', isOut ? 'justify-start' : 'justify-end')}>
      <div className={clsx(
        'max-w-sm lg:max-w-md rounded-2xl px-4 py-2.5 text-sm',
        isOut
          ? clsx('rounded-bl-sm', isFailed ? 'bg-red-100 text-red-800' : 'bg-indigo-600 text-white')
          : 'bg-white border border-slate-200 text-slate-800 rounded-br-sm shadow-sm',
        isOptimistic && 'opacity-70'
      )}>
        <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
        <div className={clsx('flex items-center gap-1 mt-1', isOut ? 'justify-start' : 'justify-end')}>
          <span className={clsx('text-xs', isOut ? (isFailed ? 'text-red-500' : 'text-indigo-300') : 'text-slate-400')}>
            {format(new Date(msg.created_at), 'HH:mm')}
          </span>
          {isOut && isFailed && (
            <span className="text-xs text-red-500 flex items-center gap-0.5">
              <AlertCircle size={10} /> לא נמסר
            </span>
          )}
          {isOptimistic && <span className="text-xs text-indigo-300">שולח...</span>}
        </div>
      </div>
    </div>
  )
}
