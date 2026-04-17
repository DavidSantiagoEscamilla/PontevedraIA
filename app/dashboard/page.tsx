'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient, ConversationPreview } from '@/lib/supabase'
import { ConversationSidebar } from '@/components/dashboard/ConversationSidebar'
import { ChatWindow } from '@/components/dashboard/ChatWindow'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const [selectedConv, setSelectedConv] = useState<ConversationPreview | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
      } else {
        setAuthChecked(true)
      }
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <StatsBar />
      <div className="flex flex-1 overflow-hidden">
        <ConversationSidebar
          selectedId={selectedConv?.id ?? null}
          onSelect={setSelectedConv}
        />
        <ChatWindow conversation={selectedConv} />
      </div>
    </div>
  )
}
