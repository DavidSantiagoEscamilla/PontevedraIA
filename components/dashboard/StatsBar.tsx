'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { MessageSquare, Users, TrendingUp, LogOut, Zap } from 'lucide-react'

export function StatsBar() {
  const [stats, setStats] = useState({ conversations: 0, messages: 0, responseRate: 100 })
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: convCount },
        { count: userMsgCount },
        { count: assistantMsgCount },
      ] = await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'assistant'),
      ])

      const user = userMsgCount ?? 0
      const assistant = assistantMsgCount ?? 0
      const rate = user > 0 ? Math.round((assistant / user) * 100) : 100

      setStats({
        conversations: convCount ?? 0,
        messages: (user + assistant),
        responseRate: Math.min(rate, 100),
      })
    }
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header
      className="flex items-center gap-4 px-5 py-3 border-b border-border shrink-0"
      style={{ background: 'hsl(var(--card))' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
          <Zap className="w-4 h-4 text-background" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-none">Pontevedra</p>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Sales Intelligence</p>
        </div>
      </div>

      <div className="h-5 w-px bg-border mx-1" />

      {/* KPIs */}
      <div className="flex items-center gap-5">
        <Stat icon={<Users className="w-3.5 h-3.5" />} label="Leads activos" value={stats.conversations} />
        <Stat icon={<MessageSquare className="w-3.5 h-3.5" />} label="Mensajes totales" value={stats.messages} />
        <Stat
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Tasa respuesta"
          value={`${stats.responseRate}%`}
          color="text-emerald-400"
        />
      </div>

      {/* Live badge */}
      <div className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-medium text-emerald-400">En vivo</span>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Salir
      </button>
    </header>
  )
}

function Stat({
  icon, label, value, color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className={`text-sm font-bold leading-none ${color ?? 'text-foreground'}`}>
          {value}
        </p>
        <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{label}</p>
      </div>
    </div>
  )
}
