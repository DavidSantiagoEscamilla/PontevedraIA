import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import {
  getOrCreateConversation,
  getLastMessages,
  saveMessage,
} from '@/lib/supabase.server'

const AGENT_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'AGENT_PROMPT.md'),
  'utf-8'
)

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!
const WA_API_URL = `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`

const MAX_MESSAGE_LENGTH = 2000

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
    console.log('[webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  let body: WhatsAppPayload

  try {
    body = await request.json()
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  if (body.object !== 'whatsapp_business_account') {
    return new NextResponse('OK', { status: 200 })
  }

  try {
    const entry   = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value   = changes?.value

    if (!value?.messages?.length) {
      return new NextResponse('OK', { status: 200 })
    }

    const waMessage = value.messages[0]

    if (waMessage.type !== 'text') {
      return new NextResponse('OK', { status: 200 })
    }

    const phoneNumber = waMessage.from
    const contactName = value.contacts?.[0]?.profile?.name ?? undefined
    const rawText     = waMessage.text?.body ?? ''

    // ── Input validation ──────────────────────────────────────────────────────
    if (!/^\d{7,15}$/.test(phoneNumber)) {
      console.warn('[webhook] Invalid phone number format:', phoneNumber)
      return new NextResponse('OK', { status: 200 })
    }

    const userText = rawText.trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!userText) {
      return new NextResponse('OK', { status: 200 })
    }

    console.log(`[webhook] Incoming from ${phoneNumber}: "${userText.slice(0, 80)}"`)

    // ── 1. Get / create conversation ──────────────────────────────────────────
    const conversationId = await getOrCreateConversation(phoneNumber, contactName)

    // ── 2. Retrieve last 5 messages for context ───────────────────────────────
    const history = await getLastMessages(conversationId, 5)

    // ── 3. Call Claude with history ───────────────────────────────────────────
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: AGENT_PROMPT,
      messages: [
        ...history.map((m) => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.content,
        })),
        { role: 'user', content: userText },
      ],
    })

    const assistantReply =
      (response.content[0]?.type === 'text' ? response.content[0].text : '').trim() ||
      'Disculpa, en este momento tengo problemas técnicos. Por favor escríbenos en unos minutos.'

    console.log(`[webhook] Reply to ${phoneNumber}: "${assistantReply.slice(0, 80)}"`)

    // ── 4. Send reply as 2 short messages split at sentence boundary ──────────
    const sentences = assistantReply.match(/[^.!?¿¡]*[.!?]+["']?/g)?.map(s => s.trim()).filter(Boolean) ?? [assistantReply]
    const msg1 = sentences[0] ?? assistantReply
    const msg2 = sentences.slice(1, 3).join(' ').trim()
    await sendWhatsAppMessage(phoneNumber, msg1)
    if (msg2) {
      await new Promise(r => setTimeout(r, 1500))
      await sendWhatsAppMessage(phoneNumber, msg2)
    }

    // ── 5. Persist both messages ──────────────────────────────────────────────
    await saveMessage(conversationId, 'user', userText)
    await saveMessage(conversationId, 'assistant', assistantReply)

    return new NextResponse('OK', { status: 200 })
  } catch (err) {
    console.error('[webhook] Unhandled error:', err)
    return new NextResponse('OK', { status: 200 })
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  const res = await fetch(WA_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('[whatsapp] Send failed:', errorBody)
    throw new Error(`WhatsApp API error: ${res.status}`)
  }

  const result = await res.json()
  console.log('[whatsapp] Message sent, id:', result?.messages?.[0]?.id)
  return result
}

interface WhatsAppPayload {
  object: string
  entry: Array<{
    changes: Array<{
      value: {
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: Array<{
          from: string
          type: string
          text: { body: string }
        }>
      }
    }>
  }>
}
