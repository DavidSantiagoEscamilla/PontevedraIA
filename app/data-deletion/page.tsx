export default function DataDeletionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2"
          style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
          <span className="text-2xl font-bold text-background">P</span>
        </div>

        <h1 className="text-xl font-semibold text-foreground">
          Eliminación de datos
        </h1>

        <p className="text-sm text-muted-foreground">
          Para solicitar la eliminación de tus datos de conversación con el agente de Pontevedra,
          escríbenos directamente por WhatsApp o al correo indicando tu número de teléfono.
        </p>

        <div className="rounded-xl border border-border bg-card p-5 text-left space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Contacto
          </p>
          <p className="text-sm text-foreground">
            📧 Correo: <span className="text-primary">info@pontevedra.com.co</span>
          </p>
          <p className="text-sm text-foreground">
            📍 Km 1 vía Arjona – Turbaco, Bolívar
          </p>
        </div>

        <p className="text-xs text-muted-foreground/50">
          Procesamos tu solicitud en un plazo máximo de 30 días hábiles.
        </p>
      </div>
    </div>
  )
}
