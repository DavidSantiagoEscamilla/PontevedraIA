export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2"
            style={{ background: 'linear-gradient(135deg, hsl(38 92% 52%), hsl(38 70% 38%))' }}>
            <span className="text-xl font-bold text-background">P</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Política de Privacidad</h1>
          <p className="text-sm text-muted-foreground">Pontevedra Condominio y Club Campestre</p>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <Section title="1. Responsable del tratamiento">
            Pontevedra Condominio y Club Campestre, con domicilio en Km 1 vía Arjona – Turbaco,
            Bolívar, Colombia, es responsable del tratamiento de los datos personales recopilados
            a través de nuestro canal de WhatsApp.
          </Section>

          <Section title="2. Datos que recopilamos">
            Al interactuar con nuestro agente de WhatsApp recopilamos:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Número de teléfono de WhatsApp</li>
              <li>Nombre de perfil de WhatsApp (cuando está disponible)</li>
              <li>Contenido de los mensajes intercambiados</li>
              <li>Fecha y hora de las conversaciones</li>
            </ul>
          </Section>

          <Section title="3. Finalidad del tratamiento">
            Los datos recopilados se utilizan exclusivamente para:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Responder consultas sobre el proyecto inmobiliario</li>
              <li>Dar seguimiento a tu proceso de compra</li>
              <li>Mejorar la calidad de atención al cliente</li>
            </ul>
          </Section>

          <Section title="4. Conservación de datos">
            Los datos se conservan mientras sean necesarios para la finalidad descrita o hasta
            que solicites su eliminación. Puedes solicitar la eliminación en cualquier momento
            en nuestra página de{' '}
            <a href="/data-deletion" className="text-primary hover:underline">
              eliminación de datos
            </a>.
          </Section>

          <Section title="5. Compartición de datos">
            No vendemos ni compartimos tus datos personales con terceros, salvo:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Proveedores tecnológicos necesarios para operar el servicio (Supabase, Google)</li>
              <li>Cuando sea requerido por obligación legal</li>
            </ul>
          </Section>

          <Section title="6. Tus derechos">
            De conformidad con la Ley 1581 de 2012 (Colombia), tienes derecho a:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Conocer, actualizar y rectificar tus datos</li>
              <li>Solicitar prueba de la autorización otorgada</li>
              <li>Ser informado sobre el uso de tus datos</li>
              <li>Revocar la autorización y solicitar la supresión de tus datos</li>
            </ul>
          </Section>

          <Section title="7. Contacto">
            Para ejercer tus derechos o resolver dudas sobre esta política:
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
