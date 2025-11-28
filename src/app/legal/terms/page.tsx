import LegalLayout from "@/components/legal/LegalLayout";

export default function TermsPage() {
    return (
        <LegalLayout
            title="Términos y Condiciones de Uso"
            date="21 de Noviembre, 2025"
        >
            <section className="space-y-4">
                <p>
                    Bienvenido a POLLNOW. Al acceder o utilizar nuestra plataforma, aceptas estar
                    legalmente vinculado por estos Términos y Condiciones. Si no estás de acuerdo, por
                    favor, no utilices el servicio.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>1. Descripción del Servicio</h3>
                <p>
                    POLLNOW es una plataforma SaaS (Software as a Service) que permite a los usuarios
                    crear, gestionar y participar en eventos de votación social (&quot;Galas&quot;).
                    Ofrecemos planes gratuitos y de pago (Premium) con funcionalidades extendidas.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>2. Registro y Seguridad</h3>
                <p>
                    Para crear eventos, debes registrarte. Eres responsable de mantener la
                    confidencialidad de tu contraseña. Nos reservamos el derecho de suspender cuentas
                    que utilicen datos falsos o temporales con fines maliciosos.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>3. Uso Aceptable y Contenido Prohibido</h3>
                <p>
                    POLLNOW fomenta la diversión y la amistad.{" "}
                    <strong>Está terminantemente prohibido:</strong>
                </p>
                <ul className="space-y-2">
                    <li>
                        Crear encuestas con contenido de odio, discriminatorio, difamatorio, pornográfico
                        o ilegal.
                    </li>
                    <li>
                        Utilizar nombres de participantes o categorías para acosar (bullying) a terceros.
                    </li>
                    <li>
                        Intentar manipular los resultados de las votaciones mediante bots o scripts.
                    </li>
                </ul>
                <p>
                    Raimundo Palma Méndez se reserva el derecho de eliminar cualquier evento o cuenta
                    que viole estas normas sin previo aviso y sin derecho a reembolso.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>4. Planes y Pagos</h3>
                <p>
                    Los servicios Premium se facturan por suscripción (mensual). Los pagos son
                    procesados de forma segura por Stripe. Puedes cancelar tu suscripción en cualquier
                    momento desde tu panel de control; el servicio continuará activo hasta el final del
                    periodo facturado. No ofrecemos reembolsos por periodos parciales no utilizados.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>5. Limitación de Responsabilidad</h3>
                <p>
                    El servicio se proporciona &quot;tal cual&quot;. Raimundo Palma Méndez no será
                    responsable de daños indirectos, pérdida de datos o interrupciones del servicio,
                    aunque trabajamos para garantizar una disponibilidad del 99.9%. No nos hacemos
                    responsables del contenido generado por los usuarios en sus eventos privados o
                    públicos.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>6. Legislación Aplicable</h3>
                <p>
                    Estos términos se rigen por las leyes de España. Para cualquier disputa, ambas
                    partes se someten a los juzgados y tribunales de Sevilla, renunciando a cualquier
                    otro fuero que pudiera corresponderles.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>7. Contacto</h3>
                <p>
                    Para cualquier duda legal o reporte de contenido inapropiado, contáctanos en:{" "}
                    <strong>contacto@rayelus.com</strong>.
                </p>
            </section>
        </LegalLayout>
    );
}