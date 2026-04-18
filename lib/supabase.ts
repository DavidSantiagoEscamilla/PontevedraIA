import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — safe for Client Components
export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Types
export type MessageRole = 'user' | 'assistant'

export interface Conversation {
  id: string
  phone_number: string
  contact_name: string | null
  archived: boolean
  labels: string[]
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface ConversationPreview extends Conversation {
  last_message: string | null
  last_message_role: MessageRole | null
}

export const LABELS = [
  { id: 'interesado',     name: 'Interesado',      color: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'seguimiento',    name: 'Seguimiento',      color: 'bg-blue-500/20 text-blue-400'       },
  { id: 'reserva',        name: 'Reserva',          color: 'bg-amber-500/20 text-amber-400'     },
  { id: 'no-interesado',  name: 'No interesado',    color: 'bg-zinc-500/20 text-zinc-400'       },
] as const
