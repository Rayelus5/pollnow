import LegalLayout from "@/components/legal/LegalLayout";

export default function CookiesPage() {
    return (
        <LegalLayout title="Política de Cookies" date="21 de Noviembre, 2025">
            <section className="space-y-4">
                <p>
                    POLLNOW utiliza cookies y tecnologías similares para garantizar el correcto
                    funcionamiento de la plataforma y la integridad de las votaciones. No utilizamos
                    cookies de terceros para publicidad comportamental.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>¿Qué es una cookie?</h3>
                <p>
                    Una cookie es un pequeño archivo de texto que se almacena en tu navegador cuando
                    visitas casi cualquier página web. Su utilidad es que la web sea capaz de recordar
                    tu visita cuando vuelvas a navegar por esa página.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>Cookies que utilizamos</h3>

                <div className="mt-4 space-y-6">
                    <div>
                        <h4 className="text-base font-semibold text-white">
                            1. Cookies Técnicas y de Seguridad (Esenciales)
                        </h4>
                        <p className="mt-1">
                            Son necesarias para que la web funcione y no pueden desactivarse.
                        </p>
                        <ul className="mt-3 space-y-3 list-disc ml-6">
                            <li>
                                <strong>voter_id:</strong> Esta cookie es fundamental para nuestro
                                sistema de votación anónima. Asigna un identificador único aleatorio a tu
                                navegador para evitar que se vote múltiples veces en la misma categoría. No
                                contiene datos personales.
                                <br />
                                <em className="text-xs text-gray-500">Duración: 1 año.</em>
                            </li>
                            <li>
                                <strong>voted_[poll.id]:</strong> Esta cookie es fundamental para nuestro
                                sistema de votación anónima. Asigna un identificador único aleatorio a tu
                                navegador para evitar que se vote múltiples veces en la misma categoría. No
                                contiene datos personales.
                                <br />
                                <em className="text-xs text-gray-500">Duración: Indefinido.</em>
                            </li>
                            <li>
                                <strong>selected_[poll.id]:</strong> Esta cookie es fundamental para nuestro
                                sistema de votación anónima. Asigna un identificador único a tu selección. No
                                contiene datos personales.
                                <br />
                                <em className="text-xs text-gray-500">Duración: Indefinido.</em>
                            </li>
                            <li>
                                <strong>authjs.session-token:</strong> Se utiliza para mantener tu sesión
                                iniciada de forma segura si eres un usuario registrado.
                                <br />
                                <em className="text-xs text-gray-500">Duración: Sesión / Persistente.</em>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base font-semibold text-white">
                            2. Cookies de Terceros (Pagos)
                        </h4>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <strong>Stripe:</strong> Utilizamos Stripe para procesar pagos. Stripe puede
                                instalar cookies para la detección de fraudes y el procesamiento seguro de las
                                transacciones.
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mt-10 space-y-4">
                <h3>Almacenamiento Local (localStorage)</h3>
                <p>
                    Además de cookies, POLLNOW utiliza el almacenamiento local del navegador
                    (<em>localStorage</em>) para guardar preferencias de sesión que no requieren
                    ser enviadas al servidor.
                </p>
                <div className="mt-4">
                    <h4 className="text-base font-semibold text-white">Entradas de localStorage</h4>
                    <ul className="mt-3 space-y-3 list-disc ml-6">
                        <li>
                            <strong>ad_last_shown:</strong> Guarda la marca de tiempo (timestamp)
                            del momento en que se mostró por última vez el banner de bienvenida al
                            visitar la página principal. Se utiliza para respetar un intervalo mínimo
                            de una hora entre visualizaciones consecutivas del banner, evitando
                            mostrarlo en cada recarga de página. No contiene datos personales.
                            <br />
                            <em className="text-xs text-gray-500">Duración: Indefinido (se actualiza cada vez que se muestra el banner).</em>
                        </li>
                        <li>
                            <strong>cookie_preferences:</strong> Guarda las preferencias de cookies
                            establecidas mediante el panel de consentimiento. No contiene datos personales.
                            <br />
                            <em className="text-xs text-gray-500">Duración: Indefinido.</em>
                        </li>
                    </ul>
                </div>
            </section>

            <section className="mt-10 space-y-4">
                <h3>Gestión de Cookies</h3>
                <p>
                    Al visitar POLLNOW por primera vez, aparecerá un panel de consentimiento en la parte
                    inferior de la pantalla donde podrás elegir qué categorías de cookies aceptas. Puedes
                    aceptar todas, solo las esenciales, o personalizar tus preferencias activando o
                    desactivando cada categoría de forma individual.
                </p>
                <p>
                    Las cookies esenciales no pueden desactivarse ya que son imprescindibles para el
                    correcto funcionamiento de la plataforma (votación, inicio de sesión). Puedes
                    bloquearlas desde la configuración de tu navegador, aunque es probable que la
                    plataforma deje de funcionar correctamente.
                </p>
                <p>
                    Tus preferencias se guardan en la cookie <strong>cookie_preferences</strong> durante
                    un año. Para modificarlas, borra las cookies de tu navegador o contacta con nosotros.
                </p>
            </section>
        </LegalLayout>
    );
}
