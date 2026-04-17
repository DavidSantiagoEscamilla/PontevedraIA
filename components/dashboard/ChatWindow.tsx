'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserSupabaseClient, ConversationPreview, Message } from '@/lib/supabase'
import { Bot, User, Phone, MoreVertical, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  conversation: ConversationPreview | null
}

export function ChatWindow({ conversation }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    if (!conversation) return

    fetchMessages(conversation.id)

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages(conversationId: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[chat] fetch messages error:', error)
    } else {
      setMessages((data as Message[]) ?? [])
    }
    setLoading(false)
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center opacity-20"
          style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
          <Bot className="w-8 h-8 text-background" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Selecciona una conversación</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            El historial de WhatsApp aparecerá aquí
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0"
        style={{ background: 'hsl(var(--card))' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
          <Phone className="w-4 h-4 text-background" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {conversation.contact_name ?? `+${conversation.phone_number}`}
          </p>
          {conversation.contact_name && (
            <p className="text-[10px] text-muted-foreground font-mono">
              +{conversation.phone_number}
            </p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-muted-foreground">
              {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <button className="ml-auto p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-3">
        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="rounded-2xl p-3 animate-pulse"
                  style={{
                    background: 'hsl(var(--muted))',
                    width: `${140 + (i * 30) % 120}px`,
                    height: '40px',
                  }} />
              </div>
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-xs text-muted-foreground/50">Sin mensajes aún</p>
          </div>
        )}

        {!loading && messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} prevMessage={messages[i - 1]} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Footer — read-only note */}
      <div className="px-5 py-3 border-t border-border shrink-0"
        style={{ background: 'hsl(var(--card))' }}>
        <p className="text-center text-xs text-muted-foreground/50">
          Vista de solo lectura — Las respuestas se envían automáticamente via IA
        </p>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  prevMessage,
}: {
  message: Message
  prevMessage?: Message
}) {
  const isUser = message.role === 'user'
  const showAvatar = !prevMessage || prevMessage.role !== message.role
  const time = format(new Date(message.created_at), 'HH:mm', { locale: es })

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-opacity ${showAvatar ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
          <Bot className="w-3.5 h-3.5 text-background" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        {showAvatar && (
          <span className="text-[10px] text-muted-foreground/60 px-1">
            {isUser ? 'Cliente' : 'Agente IA · Pontevedra'}
          </span>
        )}

        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm"
          style={isUser
            ? {
                background: 'linear-gradient(135deg, hsl(38 85% 54%), hsl(38 70% 42%))',
                color: 'hsl(var(--bubble-user-fg))',
                borderBottomRightRadius: '4px',
              }
            : {
                background: 'hsl(var(--bubble-ai))',
                color: 'hsl(var(--bubble-ai-fg))',
                borderBottomLeftRadius: '4px',
              }
          }
        >
          {message.content}
        </div>

        <div className="flex items-center gap-1 px-1">
          <Clock className="w-2.5 h-2.5 text-muted-foreground/40" />
          <span className="text-[10px] text-muted-foreground/40 font-mono">{time}</span>
        </div>
      </div>

      {isUser && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-opacity ${showAvatar ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'hsl(var(--muted))' }}>
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
