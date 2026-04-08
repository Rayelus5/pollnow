import LegalLayout from "@/components/legal/LegalLayout";

export default function CookiesPage() {
    return (
        <LegalLayout title="Política de Cookies" date="8 de abril de 2026">
            <section className="space-y-4">
                <p>
                    POLLNOW utiliza cookies y tecnologías similares de almacenamiento local para
                    garantizar el correcto funcionamiento de la plataforma, la integridad de las
                    votaciones y la seguridad de las sesiones de usuario.
                </p>
                <p>
                    Esta Política de Cookies se elabora conforme a la{" "}
                    <strong>Ley 34/2002 de Servicios de la Sociedad de la Información y Comercio
                    Electrónico (LSSI-CE)</strong>, el{" "}
                    <strong>Reglamento (UE) 2016/679 (RGPD)</strong> y las directrices de la{" "}
                    <strong>Agencia Española de Protección de Datos (AEPD)</strong>.
                </p>
            </section>

            {/* Qué es una cookie */}
            <section className="mt-10 space-y-4">
                <h3>1. ¿Qué es una Cookie?</h3>
                <p>
                    Una cookie es un pequeño archivo de texto que se almacena en tu dispositivo
                    (ordenador, teléfono o tableta) cuando visitas un sitio web. Las cookies
                    permiten que el sitio recuerde información sobre tu visita, como tus
                    preferencias o el estado de tu sesión, lo que facilita volver a visitar el
                    sitio y hace que resulte más útil para ti.
                </p>
                <p>
                    Además de cookies, POLLNOW utiliza el{" "}
                    <strong>almacenamiento local del navegador (<em>localStorage</em>)</strong>{" "}
                    para guardar ciertos datos de preferencias que no necesitan ser enviados al
                    servidor. Esta tecnología funciona de forma similar a las cookies, pero los
                    datos solo son accesibles desde el propio navegador del usuario.
                </p>
            </section>

            {/* Tipos de cookies */}
            <section className="mt-10 space-y-4">
                <h3>2. Tipos de Cookies que Utilizamos</h3>
                <p>
                    Utilizamos exclusivamente cookies <strong>técnicas/esenciales</strong> y
                    cookies de <strong>terceros necesarias para el pago</strong>. No utilizamos
                    cookies de publicidad comportamental, seguimiento entre sitios ni analítica de
                    terceros.
                </p>

                {/* Tabla técnicas */}
                <div className="mt-6 space-y-4">
                    <h4 className="text-base font-semibold text-white">
                        2.1 Cookies Técnicas y de Seguridad (Esenciales)
                    </h4>
                    <p>
                        Son imprescindibles para el funcionamiento de la plataforma. No requieren
                        consentimiento y no pueden desactivarse sin afectar al funcionamiento del
                        servicio.
                    </p>

                    <div className="overflow-x-auto mt-3">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-400">
                                    <th className="py-2 pr-4 font-semibold">Nombre</th>
                                    <th className="py-2 pr-4 font-semibold">Finalidad</th>
                                    <th className="py-2 pr-4 font-semibold">Datos personales</th>
                                    <th className="py-2 font-semibold">Duración</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                <tr>
                                    <td className="py-3 pr-4 font-mono text-xs text-violet-300">voter_id</td>
                                    <td className="py-3 pr-4">
                                        Asigna un identificador único aleatorio al navegador para
                                        evitar que un mismo dispositivo vote múltiples veces en la
                                        misma categoría. Es la base del sistema de votación anónima.
                                    </td>
                                    <td className="py-3 pr-4">No</td>
                                    <td className="py-3">1 año</td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-4 font-mono text-xs text-violet-300">voted_[poll.id]</td>
                                    <td className="py-3 pr-4">
                                        Registra si el navegador ya ha emitido un voto en una
                                        categoría concreta (identificada por su ID). Impide la
                                        modificación del voto una vez emitido.
                                    </td>
                                    <td className="py-3 pr-4">No</td>
                                    <td className="py-3">Indefinido</td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-4 font-mono text-xs text-violet-300">selected_[poll.id]</td>
                                    <td className="py-3 pr-4">
                                        Guarda la selección realizada por el usuario en una categoría
                                        concreta, permitiendo mostrar visualmente el nominado elegido
                                        cuando vuelve a cargar la página de votación.
                                    </td>
                                    <td className="py-3 pr-4">No</td>
                                    <td className="py-3">Indefinido</td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-4 font-mono text-xs text-violet-300">authjs.session-token</td>
                                    <td className="py-3 pr-4">
                                        Mantiene la sesión activa de forma segura para los usuarios
                                        registrados. Contiene un token cifrado que permite verificar
                                        la identidad del usuario en cada petición al servidor.
                                    </td>
                                    <td className="py-3 pr-4">Sí (sesión de usuario)</td>
                                    <td className="py-3">Sesión / 30 días</td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-4 font-mono text-xs text-violet-300">authjs.csrf-token</td>
                                    <td className="py-3 pr-4">
                                        Token de seguridad para proteger contra ataques CSRF
                                        (Cross-Site Request Forgery) en las operaciones de
                                        autenticación.
                                    </td>
                                    <td className="py-3 pr-4">No</td>
                                    <td className="py-3">Sesión</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cookies terceros */}
                <div className="mt-8 space-y-4">
                    <h4 className="text-base font-semibold text-white">
                        2.2 Cookies de Terceros (Pagos — Stripe)
                    </h4>
                    <p>
                        Cuando realizas un pago o accedes a funcionalidades de suscripción,{" "}
                        <strong>Stripe</strong> puede instalar cookies propias en tu navegador para:
                    </p>
                    <ul className="space-y-2 list-disc ml-6">
                        <li>Detección de fraudes y verificación de seguridad de la transacción.</li>
                        <li>Recordar detalles de pago para facilitar futuros pagos (si el usuario lo autoriza).</li>
                        <li>Cumplir con requisitos regulatorios de pagos electrónicos.</li>
                    </ul>
                    <p>
                        Stripe es un proveedor certificado PCI DSS Nivel 1. Para más información
                        sobre sus cookies, consulta la{" "}
                        <a
                            href="https://stripe.com/es/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-violet-400"
                        >
                            Política de Privacidad de Stripe
                        </a>
                        .
                    </p>
                </div>
            </section>

            {/* localStorage */}
            <section className="mt-10 space-y-4">
                <h3>3. Almacenamiento Local (localStorage)</h3>
                <p>
                    Además de cookies, POLLNOW utiliza el almacenamiento local del navegador para
                    guardar preferencias de interfaz que no requieren enviarse al servidor y que no
                    contienen datos personales.
                </p>
                <div className="overflow-x-auto mt-3">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400">
                                <th className="py-2 pr-4 font-semibold">Clave</th>
                                <th className="py-2 pr-4 font-semibold">Finalidad</th>
                                <th className="py-2 font-semibold">Duración</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            <tr>
                                <td className="py-3 pr-4 font-mono text-xs text-violet-300">ad_last_shown</td>
                                <td className="py-3 pr-4">
                                    Guarda la marca de tiempo de la última vez que se mostró el
                                    banner de bienvenida en la página principal. Sirve para respetar
                                    un intervalo mínimo de una hora entre visualizaciones, evitando
                                    que aparezca en cada recarga de página.
                                </td>
                                <td className="py-3">Indefinido (se actualiza cada vez que se muestra el banner)</td>
                            </tr>
                            <tr>
                                <td className="py-3 pr-4 font-mono text-xs text-violet-300">cookie_preferences</td>
                                <td className="py-3 pr-4">
                                    Guarda las preferencias de consentimiento de cookies elegidas por
                                    el usuario mediante el panel de consentimiento, para no volver a
                                    mostrar dicho panel en visitas posteriores.
                                </td>
                                <td className="py-3">Indefinido</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Consentimiento y gestión */}
            <section className="mt-10 space-y-4">
                <h3>4. Consentimiento y Gestión de Preferencias</h3>
                <p>
                    Al visitar POLLNOW por primera vez, se muestra un panel de consentimiento en la
                    parte inferior de la pantalla donde puedes elegir qué categorías de cookies
                    aceptas: todas, solo las esenciales, o una selección personalizada.
                </p>
                <p>
                    Las <strong>cookies técnicas esenciales</strong> no requieren consentimiento,
                    ya que son imprescindibles para el funcionamiento del servicio (sistema de
                    votación, inicio de sesión). Si las bloqueas desde la configuración de tu
                    navegador, es posible que partes de la plataforma dejen de funcionar
                    correctamente.
                </p>
                <p>
                    Tus preferencias se guardan en <code>cookie_preferences</code> (localStorage).
                    Para modificar tu consentimiento, puedes borrar los datos de navegación de tu
                    navegador o escribirnos a <strong>contacto@rayelus.com</strong>.
                </p>
            </section>

            {/* Cómo gestionar cookies por navegador */}
            <section className="mt-10 space-y-4">
                <h3>5. Cómo Gestionar Cookies en tu Navegador</h3>
                <p>
                    Puedes configurar tu navegador para aceptar, rechazar o eliminar cookies en
                    cualquier momento. A continuación encontrarás enlaces a las instrucciones de
                    los navegadores más utilizados:
                </p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>
                        <strong>Google Chrome:</strong>{" "}
                        <a
                            href="https://support.google.com/chrome/answer/95647"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-violet-400"
                        >
                            Gestionar cookies en Chrome
                        </a>
                    </li>
                    <li>
                        <strong>Mozilla Firefox:</strong>{" "}
                        <a
                            href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-violet-400"
                        >
                            Gestionar cookies en Firefox
                        </a>
                    </li>
                    <li>
                        <strong>Apple Safari:</strong>{" "}
                        <a
                            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-violet-400"
                        >
                            Gestionar cookies en Safari
                        </a>
                    </li>
                    <li>
                        <strong>Microsoft Edge:</strong>{" "}
                        <a
                            href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-violet-400"
                        >
                            Gestionar cookies en Edge
                        </a>
                    </li>
                </ul>
                <p className="text-sm text-gray-400 mt-2">
                    Ten en cuenta que deshabilitar determinadas cookies puede afectar al
                    funcionamiento de POLLNOW, especialmente las relacionadas con el sistema de
                    votación y la autenticación de usuarios.
                </p>
            </section>

            {/* Actualización */}
            <section className="mt-10 space-y-4">
                <h3>6. Actualización de esta Política</h3>
                <p>
                    Podemos actualizar esta Política de Cookies cuando sea necesario, por ejemplo,
                    si añadimos nuevas funcionalidades que requieran cookies adicionales, o para
                    adaptarnos a cambios normativos. La fecha de última actualización figura
                    siempre al inicio de este documento.
                </p>
                <p>
                    Para cualquier consulta sobre esta política, puedes contactarnos en{" "}
                    <strong>contacto@rayelus.com</strong>.
                </p>
            </section>
        </LegalLayout>
    );
}
