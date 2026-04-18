'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserSupabaseClient, ConversationPreview, Message, LABELS } from '@/lib/supabase'
import { Bot, User, Phone, MoreVertical, Clock, Send, Archive, Trash2, Tag, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  conversation: ConversationPreview | null
  onDeselect: () => void
}

export function ChatWindow({ conversation, onDeselect }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [localLabels, setLocalLabels] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    setLocalLabels(conversation?.labels ?? [])
  }, [conversation?.id, conversation?.labels])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmDelete(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    if (!conversation) return
    fetchMessages(conversation.id)

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
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
      .from('messages').select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) console.error('[chat] fetch messages error:', error)
    else setMessages((data as Message[]) ?? [])
    setLoading(false)
  }

  async function toggleLabel(labelId: string) {
    if (!conversation) return
    const updated = localLabels.includes(labelId)
      ? localLabels.filter(l => l !== labelId)
      : [...localLabels, labelId]
    setLocalLabels(updated)
    await fetch('/api/conversation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: conversation.id, labels: updated }),
    })
  }

  async function toggleArchive() {
    if (!conversation) return
    await fetch('/api/conversation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: conversation.id, archived: !conversation.archived }),
    })
    setMenuOpen(false)
    onDeselect()
  }

  async function deleteConversation() {
    if (!conversation) return
    await fetch(`/api/conversation?id=${conversation.id}`, { method: 'DELETE' })
    setMenuOpen(false)
    onDeselect()
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
          <p className="text-xs text-muted-foreground/50 mt-1">El historial de WhatsApp aparecerá aquí</p>
        </div>
      </div>
    )
  }

  const activeLabels = LABELS.filter(l => localLabels.includes(l.id))

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0"
        style={{ background: 'hsl(var(--card))' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
          <Phone className="w-4 h-4 text-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {conversation.contact_name ?? `+${conversation.phone_number}`}
          </p>
          {conversation.contact_name && (
            <p className="text-[10px] text-muted-foreground font-mono">+{conversation.phone_number}</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-muted-foreground">
              {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
            </span>
            {activeLabels.map(label => (
              <span key={label.id} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${label.color}`}>
                {label.name}
              </span>
            ))}
            {conversation.archived && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground flex items-center gap-1">
                <Archive className="w-2.5 h-2.5" /> Archivado
              </span>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen(o => !o); setConfirmDelete(false) }}
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
              {/* Labels section */}
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Etiquetas
                </p>
                <div className="flex flex-col gap-0.5">
                  {LABELS.map(label => {
                    const active = localLabels.includes(label.id)
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          active ? label.color : 'text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-current' : 'bg-muted-foreground/40'}`} />
                        {label.name}
                        {active && <X className="w-3 h-3 ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="p-1">
                <button
                  onClick={toggleArchive}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {conversation.archived ? 'Desarchivar' : 'Archivar'}
                </button>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar conversación
                  </button>
                ) : (
                  <div className="px-3 py-2 space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">¿Seguro? No se puede deshacer.</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-1.5 rounded-lg text-xs bg-muted/60 text-muted-foreground"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={deleteConversation}
                        className="flex-1 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-3">
        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="rounded-2xl p-3 animate-pulse"
                  style={{ background: 'hsl(var(--muted))', width: `${140 + (i * 30) % 120}px`, height: '40px' }} />
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

      {/* Footer — message input */}
      <div className="px-4 py-3 border-t border-border shrink-0" style={{ background: 'hsl(var(--card))' }}>
        <form
          className="flex items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!text.trim() || sending) return
            setSending(true)
            try {
              await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conversationId: conversation.id,
                  phoneNumber: conversation.phone_number,
                  text: text.trim(),
                }),
              })
              setText('')
            } finally {
              setSending(false)
            }
          }}
        >
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}
          >
            <Send className="w-4 h-4 text-background" />
          </button>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message, prevMessage }: { message: Message; prevMessage?: Message }) {
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
            ? { background: 'linear-gradient(135deg, hsl(38 85% 54%), hsl(38 70% 42%))', color: 'hsl(var(--bubble-user-fg))', borderBottomRightRadius: '4px' }
            : { background: 'hsl(var(--bubble-ai))', color: 'hsl(var(--bubble-ai-fg))', borderBottomLeftRadius: '4px' }
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
