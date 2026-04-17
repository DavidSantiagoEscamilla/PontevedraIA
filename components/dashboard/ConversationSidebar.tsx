'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient, ConversationPreview } from '@/lib/supabase'
import { MessageCircle, Phone, Clock, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  selectedId: string | null
  onSelect: (conv: ConversationPreview) => void
}

export function ConversationSidebar({ selectedId, onSelect }: Props) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchConversations()

    const channel = supabase
      .channel('conversations_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchConversations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('conversation_previews')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[sidebar] fetch error:', error)
    } else {
      setConversations((data as ConversationPreview[]) ?? [])
    }
    setLoading(false)
  }

  const filtered = conversations.filter((c) =>
    c.phone_number.includes(search) ||
    (c.last_message ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside
      className="flex flex-col h-full border-r"
      style={{
        background: 'hsl(var(--sidebar-bg))',
        borderColor: 'hsl(var(--sidebar-border))',
        width: '300px',
        minWidth: '300px',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
            <MessageCircle className="w-3.5 h-3.5 text-background" />
          </div>
          <span className="text-sm font-semibold text-foreground">Conversaciones</span>
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {conversations.length}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por teléfono..."
            className="w-full rounded-lg border border-border bg-muted/50 pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && (
          <div className="flex flex-col gap-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl p-3 animate-pulse" style={{ background: 'hsl(var(--muted))' }}>
                <div className="h-3 rounded bg-border w-1/2 mb-2" />
                <div className="h-2.5 rounded bg-border w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
            <Phone className="w-6 h-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              {search ? 'Sin resultados' : 'Aún no hay conversaciones'}
            </p>
          </div>
        )}

        {!loading && filtered.map((conv) => (
          <ConversationItem
            key={conv.id}
            conv={conv}
            isSelected={conv.id === selectedId}
            onClick={() => onSelect(conv)}
          />
        ))}
      </div>
    </aside>
  )
}

function ConversationItem({
  conv,
  isSelected,
  onClick,
}: {
  conv: ConversationPreview
  isSelected: boolean
  onClick: () => void
}) {
  const snippet = conv.last_message
    ? conv.last_message.length > 52
      ? conv.last_message.slice(0, 52) + '…'
      : conv.last_message
    : 'Sin mensajes'

  const timeAgo = formatDistanceToNow(new Date(conv.updated_at), {
    addSuffix: false,
    locale: es,
  })

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-3 mx-0 transition-all group relative"
      style={{
        background: isSelected ? 'hsl(222 16% 14%)' : 'transparent',
      }}
    >
      {isSelected && (
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ background: 'linear-gradient(180deg, hsl(38 92% 58%), hsl(38 70% 40%))' }} />
      )}

      <div className="flex items-start gap-3 pl-1">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
          style={{
            background: isSelected
              ? 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))'
              : 'hsl(var(--muted))',
            color: isSelected ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
          }}>
          {conv.phone_number.slice(-2)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1 mb-0.5">
            <span className={`text-xs font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
              {conv.contact_name ?? `+${conv.phone_number}`}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate leading-relaxed">
            {conv.last_message_role === 'assistant' && (
              <span className="text-primary/60 mr-1">🤖</span>
            )}
            {snippet}
          </p>
        </div>
      </div>
    </button>
  )
}
