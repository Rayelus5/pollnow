import LegalLayout from "@/components/legal/LegalLayout";

export default function PrivacyPage() {
    return (
        <LegalLayout title="Política de Privacidad" date="8 de abril de 2026">
            <section className="space-y-4">
                <p>
                    En POLLNOW (&quot;la Plataforma&quot;), el respeto a tu privacidad es una
                    prioridad. Esta Política de Privacidad describe, de forma transparente y
                    conforme al{" "}
                    <strong>
                        Reglamento (UE) 2016/679 General de Protección de Datos (RGPD)
                    </strong>{" "}
                    y a la{" "}
                    <strong>
                        Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los
                        derechos digitales (LOPDGDD)
                    </strong>
                    , cómo recopilamos, usamos, conservamos y protegemos tu información personal.
                </p>
            </section>

            {/* 1 */}
            <section className="mt-10 space-y-3">
                <h3>1. Responsable del Tratamiento</h3>
                <p className="bg-neutral-800 p-4 rounded-2xl text-gray-400 border-2 border-white/15">
                    <strong>Titular:</strong> Raimundo Palma Méndez
                    <br />
                    <strong>DNI:</strong> 54184186G
                    <br />
                    <strong>Dirección:</strong> Av. Montequinto 8, Dos Hermanas, Sevilla, España
                    (41089)
                    <br />
                    <strong>Email de contacto:</strong> contacto@rayelus.com
                </p>
            </section>

            {/* 2 */}
            <section className="mt-10 space-y-4">
                <h3>2. Datos que Recopilamos</h3>
                <p>
                    Recopilamos únicamente los datos estrictamente necesarios para la prestación
                    del servicio, según el tipo de interacción:
                </p>
                <ul className="space-y-3 list-disc ml-6">
                    <li>
                        <strong>Usuarios registrados:</strong> Nombre o alias, dirección de correo
                        electrónico, contraseña (almacenada de forma cifrada mediante bcrypt),
                        imagen de perfil (propia o de proveedor OAuth), e identificador de cliente
                        de Stripe. Nunca almacenamos los datos completos de tu tarjeta de crédito o
                        débito; estos son gestionados directamente por Stripe.
                    </li>
                    <li>
                        <strong>Datos de eventos:</strong> Títulos, descripciones, fechas de galas,
                        nombres de nominados e imágenes asociadas a los eventos que creas. Estos
                        datos son proporcionados voluntariamente por ti.
                    </li>
                    <li>
                        <strong>Colaboradores:</strong> Cuando invitas a otro usuario registrado
                        como colaborador de un evento, procesamos su dirección de correo electrónico
                        o identificador de usuario para gestionar la invitación y el acceso.
                    </li>
                    <li>
                        <strong>Votantes anónimos:</strong> No recopilamos datos personales
                        identificables de los participantes que votan sin estar registrados. Para
                        garantizar la integridad de las votaciones utilizamos un identificador
                        anonimizado (<code>voterHash</code>) derivado de una huella técnica del
                        navegador y el evento, así como cookies técnicas. Este hash no permite
                        identificar a la persona por sí mismo.
                    </li>
                    <li>
                        <strong>Datos de navegación:</strong> Podemos registrar datos técnicos como
                        la dirección IP (de forma anonimizada para el control de tasas de petición),
                        tipo de navegador y sistema operativo, exclusivamente para prevenir abusos
                        y garantizar la seguridad del servicio.
                    </li>
                </ul>
            </section>

            {/* 3 */}
            <section className="mt-10 space-y-4">
                <h3>3. Finalidad del Tratamiento y Base Legal</h3>
                <p>
                    Tratamos tus datos con las siguientes finalidades y bases legales conforme al
                    artículo 6 del RGPD:
                </p>
                <div className="overflow-x-auto mt-2">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400">
                                <th className="py-2 pr-4 font-semibold">Finalidad</th>
                                <th className="py-2 pr-4 font-semibold">Base legal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            <tr>
                                <td className="py-3 pr-4">Gestión de tu cuenta y acceso al panel de control</td>
                                <td className="py-3 pr-4">Ejecución de contrato (art. 6.1.b)</td>
                            </tr>
                            <tr>
                                <td className="py-3 pr-4">Procesamiento de pagos y suscripciones Premium</td>
                                <td className="py-3 pr-4">Ejecución de contrato (art. 6.1.b)</td>
                            </tr>
                            <tr>
                                <td className="py-3 pr-4">Creación, gestión y participación en eventos de votación</td>
                                <td className="py-3 pr-4">Ejecución de contrato (art. 6.1.b)</td>
                            </tr>
                            <tr>
                                <td className="py-3 pr-4">Prevención de votos duplicados e integridad de la votación</td>
                                <td className="py-3 pr-4">Interés legítimo (art. 6.1.f)</td>
                            </tr>
                            <tr>
                                <td className="py-3 pr-4">Prevención de fraudes, spam y abusos de la plataforma</td>
                                <td className="py-3 pr-4">Interés legítimo (art. 6.1.f)</td>
                            </tr>
                            <tr>
                                <td className="py-3 pr-4">Envío de comunicaciones transaccionales (recuperación de contraseña, confirmación de pago, invitaciones de colaborador)</td>
                                <td className="py-3 pr-4">Ejecución de contrato (art. 6.1.b)</td>
                            </tr>
                            <tr>
                                <td className="py-3 pr-4">Cumplimiento de obligaciones fiscales y contables</td>
                                <td className="py-3 pr-4">Obligación legal (art. 6.1.c)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 font-semibold text-white">Lo que NO hacemos con tus datos:</p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>No vendemos, alquilamos ni cedemos tus datos a terceros con fines comerciales.</li>
                    <li>No compartimos tu información con empresas o proyectos ajenos a la prestación del servicio.</li>
                    <li>No utilizamos tus datos ni el contenido de tus eventos para entrenar modelos de inteligencia artificial.</li>
                    <li>No realizamos perfilado o toma de decisiones automatizada con efectos jurídicos sobre ti.</li>
                </ul>
            </section>

            {/* 4 */}
            <section className="mt-10 space-y-4">
                <h3>4. Plazos de Conservación</h3>
                <p>
                    Conservamos tus datos personales durante el tiempo estrictamente necesario para
                    cumplir con las finalidades para las que fueron recogidos:
                </p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>
                        <strong>Datos de cuenta activa:</strong> Mientras mantengas tu cuenta
                        registrada en POLLNOW.
                    </li>
                    <li>
                        <strong>Datos de facturación y pagos:</strong> 5 años desde la última
                        transacción, conforme a las obligaciones fiscales establecidas en la Ley
                        58/2003 General Tributaria.
                    </li>
                    <li>
                        <strong>Datos de eventos:</strong> Mientras el evento esté activo y durante
                        12 meses adicionales tras su eliminación, para atender posibles reclamaciones.
                    </li>
                    <li>
                        <strong>Tras la eliminación de la cuenta:</strong> Los datos se eliminarán
                        de forma definitiva en un plazo máximo de 30 días, salvo obligación legal
                        de conservación.
                    </li>
                    <li>
                        <strong>Hashes de votación anónima:</strong> Se conservan durante la vida
                        del evento correspondiente para garantizar la integridad de la votación.
                    </li>
                </ul>
            </section>

            {/* 5 */}
            <section className="mt-10 space-y-4">
                <h3>5. Encargados del Tratamiento (Subprocesadores)</h3>
                <p>
                    Para prestar el servicio, compartimos datos con los siguientes proveedores
                    externos que actúan como encargados del tratamiento, con los que mantenemos los
                    acuerdos de tratamiento de datos exigidos por el RGPD:
                </p>
                <ul className="space-y-3 list-disc ml-6">
                    <li>
                        <strong>Stripe, Inc.</strong> (EE. UU.) — Procesamiento de pagos y gestión
                        de suscripciones. Certificado PCI DSS nivel 1. Transferencia a EE. UU.
                        amparada en las Cláusulas Contractuales Tipo de la UE.
                    </li>
                    <li>
                        <strong>Neon, Inc.</strong> (EE. UU.) — Alojamiento de la base de datos
                        PostgreSQL. Transferencia a EE. UU. amparada en las Cláusulas Contractuales
                        Tipo de la UE. Los datos se alojan en la región{" "}
                        <em>eu-central-1</em> (Europa, Frankfurt).
                    </li>
                    <li>
                        <strong>Vercel, Inc.</strong> (EE. UU.) — Infraestructura de alojamiento
                        de la aplicación web. Transferencia a EE. UU. amparada en las Cláusulas
                        Contractuales Tipo de la UE.
                    </li>
                    <li>
                        <strong>Pusher Ltd.</strong> (Reino Unido) — Servicio de comunicación en
                        tiempo real para la funcionalidad de colaboración. El Reino Unido cuenta con
                        una decisión de adecuación de la Comisión Europea.
                    </li>
                    <li>
                        <strong>Resend, Inc.</strong> (EE. UU.) — Envío de correos electrónicos
                        transaccionales (recuperación de contraseña, invitaciones). Transferencia a
                        EE. UU. amparada en las Cláusulas Contractuales Tipo de la UE.
                    </li>
                    <li>
                        <strong>Pollinations AI</strong> — Generación de imágenes mediante
                        inteligencia artificial para los planes de pago. Los prompts enviados no
                        contienen datos personales identificables de los usuarios.
                    </li>
                </ul>
            </section>

            {/* 6 */}
            <section className="mt-10 space-y-4">
                <h3>6. Transferencias Internacionales de Datos</h3>
                <p>
                    Algunos de nuestros proveedores están ubicados fuera del Espacio Económico
                    Europeo (EEE), concretamente en Estados Unidos. Estas transferencias se realizan
                    con las garantías adecuadas exigidas por el Capítulo V del RGPD, mediante
                    Cláusulas Contractuales Tipo adoptadas por la Comisión Europea (Decisión de
                    Ejecución 2021/914/UE), lo que garantiza un nivel de protección equivalente al
                    del EEE.
                </p>
                <p>
                    Puedes solicitar más información sobre las garantías aplicables a estas
                    transferencias escribiendo a <strong>contacto@rayelus.com</strong>.
                </p>
            </section>

            {/* 7 */}
            <section className="mt-10 space-y-4">
                <h3>7. Tus Derechos</h3>
                <p>
                    Conforme al RGPD y la LOPDGDD, tienes los siguientes derechos respecto a tus
                    datos personales:
                </p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>
                        <strong>Acceso (art. 15 RGPD):</strong> Conocer qué datos tuyos tratamos.
                    </li>
                    <li>
                        <strong>Rectificación (art. 16 RGPD):</strong> Corregir datos inexactos o
                        incompletos. Puedes actualizar la mayoría de tus datos directamente desde
                        la configuración de tu cuenta.
                    </li>
                    <li>
                        <strong>Supresión (art. 17 RGPD):</strong> Solicitar la eliminación de tus
                        datos cuando ya no sean necesarios, retires el consentimiento o te opongas
                        al tratamiento, salvo obligación legal de conservación.
                    </li>
                    <li>
                        <strong>Limitación del tratamiento (art. 18 RGPD):</strong> Solicitar que
                        suspendamos el tratamiento de tus datos en determinados supuestos.
                    </li>
                    <li>
                        <strong>Portabilidad (art. 20 RGPD):</strong> Recibir tus datos en un
                        formato estructurado, de uso común y lectura mecánica.
                    </li>
                    <li>
                        <strong>Oposición (art. 21 RGPD):</strong> Oponerte al tratamiento basado
                        en interés legítimo.
                    </li>
                    <li>
                        <strong>No ser objeto de decisiones automatizadas (art. 22 RGPD):</strong>{" "}
                        No aplicamos perfilado automatizado con efectos jurídicos.
                    </li>
                </ul>
                <p>
                    Para ejercer cualquiera de estos derechos, escríbenos a{" "}
                    <strong>contacto@rayelus.com</strong> indicando tu nombre, el derecho que
                    deseas ejercer y adjuntando una copia de tu DNI u otro documento identificativo.
                    Responderemos en el plazo máximo de <strong>un mes</strong> desde la recepción
                    de tu solicitud (art. 12 RGPD).
                </p>
            </section>

            {/* 8 */}
            <section className="mt-10 space-y-4">
                <h3>8. Derecho a Presentar una Reclamación ante la AEPD</h3>
                <p>
                    Si consideras que el tratamiento de tus datos personales vulnera la normativa
                    de protección de datos, tienes derecho a presentar una reclamación ante la
                    autoridad de control competente en España:
                </p>
                <p className="bg-neutral-800 p-4 rounded-2xl text-gray-400 border-2 border-white/15">
                    <strong>Agencia Española de Protección de Datos (AEPD)</strong>
                    <br />
                    C/ Jorge Juan, 6, 28001 Madrid
                    <br />
                    <strong>Web:</strong>{" "}
                    <a
                        href="https://www.aepd.es"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-violet-400"
                    >
                        www.aepd.es
                    </a>
                    <br />
                    <strong>Sede electrónica:</strong>{" "}
                    <a
                        href="https://sedeagpd.gob.es"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-violet-400"
                    >
                        sedeagpd.gob.es
                    </a>
                </p>
                <p>
                    Te recomendamos que, antes de presentar una reclamación ante la AEPD, te
                    pongas en contacto con nosotros para intentar resolver la situación de forma
                    directa y eficaz.
                </p>
            </section>

            {/* 9 */}
            <section className="mt-10 space-y-4">
                <h3>9. Seguridad de los Datos</h3>
                <p>
                    Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos
                    personales contra el acceso no autorizado, la divulgación, la alteración o la
                    destrucción. Estas medidas incluyen, entre otras: cifrado de contraseñas
                    (bcrypt), transmisión de datos mediante HTTPS/TLS, control de acceso basado en
                    roles y auditoría de acciones críticas.
                </p>
                <p>
                    En caso de producirse una violación de seguridad que afecte a tus datos, te
                    notificaremos sin dilación indebida y, en todo caso, en el plazo máximo de{" "}
                    <strong>72 horas</strong> desde que tengamos conocimiento de ella, conforme al
                    artículo 33 del RGPD.
                </p>
            </section>

            {/* 10 */}
            <section className="mt-10 space-y-4">
                <h3>10. Actualización de esta Política</h3>
                <p>
                    Podemos actualizar esta Política de Privacidad para reflejar cambios en
                    nuestras prácticas, en los servicios o en la legislación aplicable. Cuando
                    realicemos cambios significativos, te lo notificaremos mediante un aviso
                    destacado en la plataforma o por correo electrónico con antelación suficiente.
                    La fecha de la última actualización figura siempre al inicio de este documento.
                </p>
            </section>
        </LegalLayout>
    );
}
