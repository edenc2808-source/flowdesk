'use client'

import { Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import clsx from 'clsx'
import type { Conversation } from '@/types'

export type InboxFilter = 'all' | 'unread' | 'waiting_us' | 'follow_up' | 'appointment' | 'no_show' | 'closed'

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: 'all',        label: 'הכל' },
  { key: 'unread',     label: 'לא נקרא' },
  { key: 'waiting_us', label: 'ממתין לתגובה' },
  { key: 'follow_up',  label: 'מעקב' },
  { key: 'appointment',label: 'פגישה' },
  { key: 'no_show',    label: 'לא הגיע' },
  { key: 'closed',     label: 'סגור' },
]

const STATUS_DOT: Record<string, string> = {
  new:         'bg-blue-500',
  responded:   'bg-amber-400',
  contacted:   'bg-yellow-400',
  appointment: 'bg-purple-500',
  no_response: 'bg-red-400',
  closed:      'bg-slate-400',
}

const STATUS_LABEL: Record<string, string> = {
  new:         'חדש',
  responded:   'ממתין לתגובה',
  contacted:   'ממתין ללקוח',
  appointment: 'פגישה',
  no_response: 'נדרש מעקב',
  closed:      'סגור',
}

interface Props {
  conversations: Conversation[]
  selectedId: string | null
  search: string
  filter: InboxFilter
  onSearchChange: (v: string) => void
  onFilterChange: (f: InboxFilter) => void
  onSelect: (c: Conversation) => void
  loading: boolean
}

function matchesFilter(conv: Conversation, filter: InboxFilter): boolean {
  const status = (conv.lead as { status?: string })?.status ?? 'new'
  if (filter === 'all') return true
  if (filter === 'unread') return conv.unread_count > 0
  if (filter === 'waiting_us') return status === 'responded'
  if (filter === 'follow_up') return status === 'no_response'
  if (filter === 'appointment') return status === 'appointment'
  if (filter === 'no_show') return status === 'no_response' && !conv.unread_count
  if (filter === 'closed') return status === 'closed'
  return true
}

export default function ConversationList({
  conversations, selectedId, search, filter,
  onSearchChange, onFilterChange, onSelect, loading,
}: Props) {
  const filtered = conversations.filter(c => matchesFilter(c, filter))
  const counts: Partial<Record<InboxFilter, number>> = {
    unread:     conversations.filter(c => c.unread_count > 0).length,
    waiting_us: conversations.filter(c => (c.lead as { status?: string })?.status === 'responded').length,
    follow_up:  conversations.filter(c => (c.lead as { status?: string })?.status === 'no_response').length,
    appointment:conversations.filter(c => (c.lead as { status?: string })?.status === 'appointment').length,
  }

  return (
    <div className="w-72 shrink-0 flex flex-col bg-white border-l border-slate-200 h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-slate-100 shrink-0">
        <h2 className="font-bold text-slate-800 mb-3 text-base">תיבת דואר</h2>
        <div className="relative mb-3">
          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="חיפוש שיחות..."
            className="w-full pr-8 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
        {/* Filters */}
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={clsx(
                'text-xs px-2 py-1 rounded-lg font-medium transition-colors whitespace-nowrap',
                filter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {f.label}
              {counts[f.key] ? (
                <span className={clsx('mr-1 text-[10px]', filter === f.key ? 'text-indigo-200' : 'text-slate-400')}>
                  {counts[f.key]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">אין שיחות</div>
        ) : (
          filtered.map(conv => {
            const lead = conv.lead
            const isSelected = conv.id === selectedId
            const hasUnread = conv.unread_count > 0
            const status = (lead as { status?: string })?.status ?? 'new'

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={clsx(
                  'w-full text-right px-4 py-3 transition-colors border-b border-slate-50',
                  isSelected ? 'bg-indigo-50 border-r-2 border-r-indigo-500' : 'hover:bg-slate-50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-sm font-bold text-white">
                      {(lead?.name?.[0] ?? '?').toUpperCase()}
                    </div>
                    <span className={clsx(
                      'absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-white',
                      STATUS_DOT[status] || 'bg-slate-400'
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={clsx(
                        'text-sm truncate',
                        hasUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                      )}>
                        {lead?.name ?? 'לא ידוע'}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {conv.last_message_at
                          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: he })
                              .replace('לפני ', '').replace('דקות', 'ד׳').replace('דקה', 'ד׳')
                              .replace('שעות', 'ש׳').replace('שעה', 'ש׳')
                          : ''}
                      </span>
                    </div>
                    <p className={clsx('text-xs truncate mt-0.5', hasUnread ? 'text-slate-700 font-medium' : 'text-slate-400')}>
                      {conv.last_message ?? 'אין הודעות'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={clsx(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                        status === 'appointment' ? 'bg-purple-50 text-purple-600' :
                        status === 'responded'   ? 'bg-amber-50 text-amber-600' :
                        status === 'no_response' ? 'bg-red-50 text-red-500' :
                        status === 'new'         ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      )}>
                        {STATUS_LABEL[status] ?? status}
                      </span>
                      {hasUnread ? (
                        <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
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
