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
