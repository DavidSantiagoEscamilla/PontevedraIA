'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard] Error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
        <p className="text-sm font-medium text-foreground">Error cargando el dashboard</p>
        <p className="text-xs text-muted-foreground">
          Verifica tu conexión o las credenciales de Supabase.
        </p>
        <button
          onClick={reset}
          className="mt-2 text-xs text-primary hover:underline"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
