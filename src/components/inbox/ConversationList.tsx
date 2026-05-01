'use client'

import { Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import type { Conversation } from '@/types'

const STATUS_DOT: Record<string, string> = {
  new:         'bg-blue-500',
  contacted:   'bg-yellow-500',
  responded:   'bg-green-500',
  appointment: 'bg-purple-500',
  no_response: 'bg-red-400',
  closed:      'bg-slate-400',
}

interface Props {
  conversations: Conversation[]
  selectedId: string | null
  search: string
  onSearchChange: (v: string) => void
  onSelect: (c: Conversation) => void
  loading: boolean
}

export default function ConversationList({ conversations, selectedId, search, onSearchChange, onSelect, loading }: Props) {
  return (
    <div className="w-72 shrink-0 flex flex-col bg-white border-r border-slate-200 h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800 mb-3">Inbox</h2>
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No conversations yet</div>
        ) : (
          conversations.map(conv => {
            const lead = conv.lead
            const isSelected = conv.id === selectedId
            const hasUnread = conv.unread_count > 0
            const status = (lead as { status?: string })?.status ?? 'new'

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={clsx(
                  'w-full text-left px-4 py-3 transition-colors border-b border-slate-50',
                  isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                      {(lead?.name?.[0] ?? '?').toUpperCase()}
                    </div>
                    <span className={clsx('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white', STATUS_DOT[status] || 'bg-slate-400')} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={clsx('text-sm truncate', hasUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>
                        {lead?.name ?? 'Unknown'}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0 ml-1">
                        {conv.last_message_at
                          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })
                              .replace('about ', '')
                              .replace(' minutes', 'm')
                              .replace(' hours', 'h')
                              .replace(' days', 'd')
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={clsx('text-xs truncate', hasUnread ? 'text-slate-700' : 'text-slate-400')}>
                        {conv.last_message ?? 'No messages yet'}
                      </p>
                      {hasUnread ? (
                        <span className="shrink-0 ml-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
