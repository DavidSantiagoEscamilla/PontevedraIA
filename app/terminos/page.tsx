export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2"
            style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
            <span className="text-xl font-bold text-background">P</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Condiciones del Servicio</h1>
          <p className="text-sm text-muted-foreground">Pontevedra Condominio y Club Campestre</p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <Section title="1. Descripción del servicio">
            Pontevedra Condominio y Club Campestre ofrece un agente de atención al cliente
            mediante WhatsApp con el fin de brindar información sobre el proyecto inmobiliario,
            resolver dudas y facilitar el proceso de adquisición de lotes.
          </Section>

          <Section title="2. Uso aceptable">
            El servicio está destinado exclusivamente a personas interesadas en obtener
            información sobre el proyecto Pontevedra. Está prohibido el uso del canal para
            fines distintos a los comerciales aquí descritos.
          </Section>

          <Section title="3. Datos personales">
            Al comunicarte con nuestro agente de WhatsApp, tu número de teléfono y los mensajes
            intercambiados podrán ser almacenados con el fin de mejorar la atención y dar
            seguimiento a tu consulta. No compartimos tu información con terceros sin tu
            consentimiento, salvo obligación legal.
          </Section>

          <Section title="4. Inteligencia Artificial">
            Nuestro agente utiliza tecnología de inteligencia artificial para responder
            consultas. Las respuestas son orientativas y no constituyen una oferta comercial
            vinculante. Para condiciones definitivas, consulta directamente con un asesor.
          </Section>

          <Section title="5. Modificaciones">
            Pontevedra se reserva el derecho de modificar estas condiciones en cualquier momento.
            Las modificaciones entrarán en vigor desde su publicación en esta página.
          </Section>

          <Section title="6. Contacto">
            Para cualquier consulta sobre estas condiciones:
            <br />📧 info@pontevedra.com.co
            <br />📍 Km 1 vía Arjona – Turbaco, Bolívar, Colombia
          </Section>
        </div>

        <p className="text-center text-xs text-muted-foreground/40">
          Última actualización: abril 2026
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p>{children}</p>
    </div>
  )
}
