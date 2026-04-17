import { createClient } from '@supabase/supabase-js'
import type { MessageRole } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-only admin client — never import this in Client Components
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export async function getOrCreateConversation(
  phoneNumber: string,
  contactName?: string
): Promise<string> {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('phone_number', phoneNumber)
    .single()

  if (existing?.id) {
    // Update name if we now have one and didn't before
    if (contactName) {
      await supabaseAdmin
        .from('conversations')
        .update({ contact_name: contactName })
        .eq('id', existing.id)
        .is('contact_name', null)
    }
    return existing.id
  }

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[supabase] getOrCreateConversation fetch error:', fetchError)
    throw fetchError
  }

  const { data: created, error: insertError } = await supabaseAdmin
    .from('conversations')
    .insert({ phone_number: phoneNumber, contact_name: contactName ?? null })
    .select('id')
    .single()

  if (insertError || !created) {
    console.error('[supabase] getOrCreateConversation insert error:', insertError)
    throw insertError
  }

  return created.id
}

export async function getLastMessages(
  conversationId: string,
  limit = 5
): Promise<{ role: MessageRole; content: string }[]> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[supabase] getLastMessages error:', error)
    throw error
  }

  return (data ?? []).reverse() as { role: MessageRole; content: string }[]
}

export async function saveMessage(
  conversationId: string,
  role: MessageRole,
  content: string
): Promise<void> {
  const { error } = await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
  })

  if (error) {
    console.error('[supabase] saveMessage error:', error)
    throw error
  }
}
