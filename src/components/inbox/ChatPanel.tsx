'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import type { Lead, Message } from '@/types'

interface Props {
  conversationId: string
  lead: Lead
  onMessagesChange: () => void
}

export default function ChatPanel({ conversationId, lead, onMessagesChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isSendingRef = useRef(false) // used by polling to avoid stomping optimistic state

  const fetchMessages = useCallback(async () => {
    if (isSendingRef.current) return // don't stomp optimistic update
    try {
      const res = await fetch(`/api/messages?conversation_id=${conversationId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('[ChatPanel] fetchMessages error:', err)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    setLoading(true)
    setMessages([])
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll every 5s — paused while sending
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

    // Optimistic insert
    const tempId = `opt-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      direction: 'outbound',
      content,
      status: 'sent',
      created_at: new Date().toISOString(),
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
        // Remove optimistic, show error
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setSendError(data.error || 'Failed to send message')
        setText(content) // restore text so user can retry
      } else {
        // Replace optimistic with real message
        setMessages(prev => prev.map(m =>
          m.id === tempId
            ? { ...data, delivery_failed: undefined }
            : m
        ))
        if (data.delivery_failed) {
          setSendError('Message saved but WhatsApp delivery failed. Check Twilio.')
        }
        onMessagesChange()
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setSendError('Network error — please try again')
      setText(content)
    } finally {
      setSending(false)
      isSendingRef.current = false
      inputRef.current?.focus()
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 shrink-0">
          {lead.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{lead.name}</p>
          <p className="text-xs text-slate-400" dir="ltr">{lead.phone}</p>
        </div>
        {lead.automation_paused && (
          <span className="ml-auto shrink-0 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
            Automation paused
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-1">
            <span className="text-2xl">👋</span>
            <p>No messages yet — send the first one below</p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send error banner */}
      {sendError && (
        <div className="shrink-0 bg-red-50 border-t border-red-200 px-4 py-2 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 flex-1">{sendError}</p>
          <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => { setText(e.target.value); setSendError(null) }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
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
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === 'outbound'
  const isOptimistic = msg.id.startsWith('opt-')
  const isFailed = msg.status === 'failed'

  return (
    <div className={clsx('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-sm lg:max-w-md rounded-2xl px-4 py-2.5 text-sm',
        isOut
          ? clsx('rounded-br-sm', isFailed ? 'bg-red-100 text-red-800' : 'bg-indigo-600 text-white')
          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm',
        isOptimistic && 'opacity-70'
      )}>
        <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
        <div className={clsx('flex items-center gap-1 mt-1', isOut ? 'justify-end' : 'justify-start')}>
          <span className={clsx('text-xs', isOut ? (isFailed ? 'text-red-500' : 'text-indigo-300') : 'text-slate-400')}>
            {format(new Date(msg.created_at), 'HH:mm')}
          </span>
          {isOut && isFailed && (
            <span className="text-xs text-red-500 flex items-center gap-0.5">
              <AlertCircle size={10} /> Not delivered
            </span>
          )}
          {isOptimistic && (
            <span className="text-xs text-indigo-300">Sending…</span>
          )}
        </div>
      </div>
    </div>
  )
}
