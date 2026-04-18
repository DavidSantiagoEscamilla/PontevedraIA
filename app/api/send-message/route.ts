import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const WA_API_URL = `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`

export async function POST(request: NextRequest) {
  let body: { conversationId: string; phoneNumber: string; text: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  const { conversationId, phoneNumber, text } = body

  if (!conversationId || !phoneNumber || !text?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Send via WhatsApp
  const res = await fetch(WA_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'text',
      text: { preview_url: false, body: text.trim() },
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('[send-message] WhatsApp error:', errorBody)
    return NextResponse.json({ error: 'WhatsApp send failed', detail: errorBody }, { status: 502 })
  }

  // Save to Supabase
  const { error } = await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: text.trim(),
  })

  if (error) {
    console.error('[send-message] Supabase error:', error)
    return NextResponse.json({ error: 'DB save failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
