import LegalLayout from "@/components/legal/LegalLayout";

export default function TermsPage() {
    return (
        <LegalLayout
            title="Términos y Condiciones de Uso"
            date="8 de abril de 2026"
        >
            <section className="space-y-4">
                <p>
                    Estos Términos y Condiciones de Uso
                    (&quot;Términos&quot;) regulan el acceso y uso de la plataforma POLLNOW,
                    accesible en <a href="https://pollnow.es" className="underline text-violet-400">
                        pollnow.es
                    </a>{" "} y sus subdominios, operada por
                    Raimundo Palma Méndez (&quot;el Titular&quot;, &quot;nosotros&quot;).
                </p>
                <p>
                    Al acceder o utilizar POLLNOW, aceptas quedar vinculado por estos Términos y
                    por nuestra{" "}
                    <a href="/legal/privacy" className="underline text-violet-400">
                        Política de Privacidad
                    </a>{" "}
                    y{" "}
                    <a href="/legal/cookies" className="underline text-violet-400">
                        Política de Cookies
                    </a>
                    . Si no estás de acuerdo con alguno de estos documentos, te pedimos que no
                    utilices el servicio.
                </p>
                <p>
                    Este servicio se presta desde España y se rige íntegramente por la legislación
                    española y europea, incluyendo la Ley 34/2002 de Servicios de la Sociedad de la
                    Información y Comercio Electrónico (LSSI-CE), el Reglamento General de
                    Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos
                    Personales y garantía de los derechos digitales (LOPDGDD).
                </p>
            </section>

            {/* 1 */}
            <section className="mt-10 space-y-4">
                <h3>1. Descripción del Servicio</h3>
                <p>
                    POLLNOW es una plataforma de Software como Servicio (SaaS) que permite a sus
                    usuarios crear, personalizar y gestionar eventos de votación social
                    (&quot;Galas&quot;), añadir nominados y categorías, invitar a colaboradores y
                    recopilar votos de audiencias tanto registradas como anónimas.
                </p>
                <p>
                    La plataforma ofrece un plan gratuito con funcionalidades básicas y distintos
                    planes de pago (Premium, Plus, Unlimited y Enterprise) con funcionalidades
                    extendidas como generación de imágenes con inteligencia artificial, estadísticas
                    avanzadas, colaboración en tiempo real y eliminación de anuncios. Las
                    características exactas de cada plan se detallan en la{" "}
                    <a href="/#pricing" className="underline text-violet-400">
                        página de precios
                    </a>
                    .
                </p>
            </section>

            {/* 2 */}
            <section className="mt-10 space-y-4">
                <h3>2. Requisitos de Uso y Edad Mínima</h3>
                <p>
                    Para utilizar POLLNOW debes tener al menos <strong>14 años</strong>, conforme a
                    lo establecido en el artículo 7 de la LOPDGDD. Si eres menor de 14 años, no
                    puedes registrarte ni crear una cuenta. Los menores de 18 años deben contar con
                    el consentimiento de sus padres o tutores legales para utilizar el servicio.
                </p>
                <p>
                    Al aceptar estos Términos, declaras y garantizas que cumples con el requisito
                    de edad mínima y que la información que proporcionas es veraz, completa y
                    actualizada.
                </p>
            </section>

            {/* 3 */}
            <section className="mt-10 space-y-4">
                <h3>3. Registro, Cuenta y Seguridad</h3>
                <p>
                    Para crear y gestionar eventos es necesario registrarse mediante correo
                    electrónico o a través de un proveedor de autenticación OAuth (Google). Eres el
                    único responsable de mantener la confidencialidad de tus credenciales de acceso
                    y de todas las actividades que se realicen desde tu cuenta.
                </p>
                <p>
                    Debes notificarnos inmediatamente a{" "}
                    <strong>contacto@rayelus.com</strong> si detectas cualquier uso no autorizado
                    de tu cuenta o cualquier vulneración de seguridad. El Titular no será responsable
                    de los daños o pérdidas causados por el incumplimiento de esta obligación.
                </p>
                <p>
                    Nos reservamos el derecho de suspender o eliminar cuentas que hayan sido
                    creadas con datos falsos, que utilicen métodos automatizados para el registro
                    masivo, o cuya actividad suponga un riesgo para la plataforma o terceros.
                </p>
            </section>

            {/* 4 */}
            <section className="mt-10 space-y-4">
                <h3>4. Uso Aceptable y Contenido Prohibido</h3>
                <p>
                    POLLNOW está diseñado para fomentar la diversión, el reconocimiento entre
                    amigos y la participación social. Al usar la plataforma, te comprometes a
                    utilizarla de forma lícita, ética y responsable.
                </p>
                <p>
                    <strong>Queda terminantemente prohibido:</strong>
                </p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>
                        Crear eventos, categorías o nominados con contenido de odio, discriminatorio,
                        racista, xenófobo, sexista, homófobo, transfóbico, difamatorio, pornográfico,
                        violento o que atente contra la dignidad de las personas.
                    </li>
                    <li>
                        Utilizar la plataforma para acosar, intimidar o hacer{" "}
                        <em>bullying</em> a terceros, incluida la creación de categorías o encuestas
                        con el propósito de humillar o denigrar a personas reales.
                    </li>
                    <li>
                        Manipular los resultados de las votaciones mediante bots, scripts, proxies,
                        VPNs, granjas de clics o cualquier otro método automatizado.
                    </li>
                    <li>
                        Publicar contenido que infrinja derechos de propiedad intelectual, secretos
                        comerciales o datos personales de terceros sin su consentimiento.
                    </li>
                    <li>
                        Intentar acceder sin autorización a cuentas de otros usuarios, sistemas
                        internos o bases de datos de la plataforma.
                    </li>
                    <li>
                        Realizar ingeniería inversa, descompilar o intentar extraer el código fuente
                        de la plataforma.
                    </li>
                    <li>
                        Usar la plataforma para actividades ilegales conforme a la legislación
                        española o europea aplicable.
                    </li>
                </ul>
                <p>
                    El Titular se reserva el derecho de eliminar cualquier evento, categoría,
                    nominado o cuenta que viole estas normas, sin previo aviso y sin derecho a
                    reembolso, y de reportar el contenido a las autoridades competentes si así lo
                    requiere la ley.
                </p>
            </section>

            {/* 5 */}
            <section className="mt-10 space-y-4">
                <h3>5. Propiedad Intelectual</h3>
                <p>
                    Todos los elementos de POLLNOW —incluyendo el diseño, logotipos, código fuente,
                    interfaz, textos, gráficos y marca— son propiedad exclusiva de Raimundo Palma
                    Méndez o de sus licenciantes, y están protegidos por las leyes españolas y
                    europeas de propiedad intelectual e industrial.
                </p>
                <p>
                    Se te concede una licencia limitada, no exclusiva, no transferible y revocable
                    para acceder y utilizar la plataforma exclusivamente conforme a estos Términos.
                    Queda prohibida cualquier reproducción, distribución, comunicación pública o
                    transformación total o parcial del servicio sin autorización escrita del Titular.
                </p>
                <p>
                    El contenido que tú creas dentro de la plataforma (títulos de eventos,
                    descripciones, nombres de nominados) sigue siendo de tu propiedad. Sin embargo,
                    al introducirlo en POLLNOW, nos otorgas una licencia no exclusiva y gratuita para
                    almacenarlo, procesarlo y mostrarlo a los usuarios que acceden a tu evento,
                    durante el tiempo que este permanezca activo en la plataforma.
                </p>
            </section>

            {/* 6 */}
            <section className="mt-10 space-y-4">
                <h3>6. Generación de Imágenes con Inteligencia Artificial</h3>
                <p>
                    Los planes de pago incluyen acceso a la generación de imágenes mediante
                    inteligencia artificial a través de modelos externos (actualmente Pollinations AI).
                    Este servicio está sujeto a las siguientes condiciones:
                </p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>
                        <strong>Uso justo (<em>fair use</em>):</strong> La generación de imágenes está
                        pensada para ilustrar nominados en tus galas. Queda prohibido su uso masivo,
                        automatizado o con fines distintos a los establecidos en la plataforma.
                    </li>
                    <li>
                        <strong>Contenido generado:</strong> No puedes utilizar prompts que soliciten
                        la generación de imágenes de personas reales identificables, contenido sexual,
                        violento, discriminatorio o que infrinja derechos de terceros.
                    </li>
                    <li>
                        <strong>Propiedad:</strong> Las imágenes generadas mediante IA dentro de
                        POLLNOW son de uso libre para el usuario que las crea, dentro del contexto de
                        la plataforma. El Titular no garantiza la originalidad ni la ausencia de
                        similitudes con otras obras.
                    </li>
                    <li>
                        <strong>Disponibilidad:</strong> Este servicio depende de terceros y puede
                        presentar tiempos de respuesta variables o interrupciones. No garantizamos
                        su disponibilidad continua.
                    </li>
                </ul>
            </section>

            {/* 7 */}
            <section className="mt-10 space-y-4">
                <h3>7. Colaboración en Tiempo Real</h3>
                <p>
                    Los planes Premium, Plus, Unlimited y Enterprise permiten invitar a colaboradores
                    para co-gestionar eventos. Al invitar a otro usuario como colaborador:
                </p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>
                        Eres responsable de las acciones que realicen esos colaboradores dentro de tu
                        evento.
                    </li>
                    <li>
                        Puedes revocar el acceso de cualquier colaborador en cualquier momento desde
                        tu panel de control.
                    </li>
                    <li>
                        El número máximo de colaboradores simultáneos depende del plan contratado (1,
                        5 o 15 según el plan).
                    </li>
                </ul>
            </section>

            {/* 8 */}
            <section className="mt-10 space-y-4">
                <h3>8. Planes, Precios y Pagos</h3>
                <p>
                    Los planes de pago se facturan mediante <strong>suscripción mensual</strong>.
                    Los precios incluyen el IVA aplicable conforme a la normativa española vigente.
                    Los pagos son procesados de forma segura por <strong>Stripe</strong>, un
                    proveedor de pagos externo. POLLNOW no almacena ni tiene acceso a los datos
                    completos de tu tarjeta de crédito o débito.
                </p>
                <p>
                    Al suscribirte a un plan de pago, autorizas a Stripe a realizar el cargo
                    mensual de forma recurrente hasta que canceles tu suscripción. En caso de
                    impago o disputa, el acceso a las funcionalidades Premium puede ser suspendido
                    de forma inmediata.
                </p>
                <p>
                    El Titular se reserva el derecho de modificar los precios de los planes
                    notificándote con al menos <strong>30 días de antelación</strong> por correo
                    electrónico. Si no estás de acuerdo con el nuevo precio, podrás cancelar tu
                    suscripción antes de que se aplique el cambio.
                </p>
            </section>

            {/* 9 */}
            <section className="mt-10 space-y-4">
                <h3>9. Cancelación y Política de Reembolsos</h3>
                <p>
                    Puedes cancelar tu suscripción en cualquier momento desde tu panel de control.
                    Una vez cancelada, seguirás teniendo acceso a las funcionalidades de tu plan
                    hasta el final del periodo de facturación en curso, a partir de ese momento, tu
                    cuenta pasará automáticamente al plan gratuito.
                </p>
                <p>
                    <strong>No ofrecemos reembolsos por periodos parciales no utilizados.</strong>{" "}
                    Si tienes algún problema con el servicio que justifique una reclamación, escríbenos
                    a <strong>contacto@rayelus.com</strong> y lo estudiaremos de forma individual.
                </p>
                <p>
                    No obstante lo anterior, conforme al artículo 103 del Real Decreto Legislativo
                    1/2007 (TRLGDCU), el derecho de desistimiento de 14 días no aplica a los
                    servicios digitales cuya ejecución haya comenzado con el consentimiento expreso
                    del consumidor. Al activar tu suscripción y comenzar a usar las funcionalidades
                    Premium, renuncias expresamente a este derecho de desistimiento.
                </p>
            </section>

            {/* 10 */}
            <section className="mt-10 space-y-4">
                <h3>10. Suspensión y Terminación</h3>
                <p>
                    El Titular puede suspender o cancelar tu cuenta de forma inmediata, con o sin
                    previo aviso, si:
                </p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>Incumples cualquiera de los presentes Términos.</li>
                    <li>Utilizas la plataforma para actividades ilegales o fraudulentas.</li>
                    <li>Tu cuenta permanece inactiva durante más de 24 meses consecutivos.</li>
                    <li>
                        Es requerido por una autoridad judicial, administrativa o policial
                        competente.
                    </li>
                </ul>
                <p>
                    En caso de cancelación por incumplimiento, no tendrás derecho a reembolso
                    alguno. Puedes solicitar la eliminación voluntaria de tu cuenta y todos los datos
                    asociados escribiendo a <strong>contacto@rayelus.com</strong>.
                </p>
            </section>

            {/* 11 */}
            <section className="mt-10 space-y-4">
                <h3>11. Limitación de Responsabilidad</h3>
                <p>
                    El servicio se proporciona <strong>&quot;tal cual&quot;</strong> y{" "}
                    <strong>&quot;según disponibilidad&quot;</strong>, sin garantías de ningún tipo,
                    expresas o implícitas. En la medida en que lo permita la legislación aplicable,
                    el Titular no será responsable de:
                </p>
                <ul className="space-y-2 list-disc ml-6">
                    <li>
                        Daños indirectos, incidentales, especiales o consecuentes derivados del uso
                        o imposibilidad de uso de la plataforma.
                    </li>
                    <li>
                        Pérdida o corrupción de datos almacenados en la plataforma.
                    </li>
                    <li>
                        Interrupciones del servicio debidas a mantenimiento, fallos técnicos,
                        problemas con proveedores externos o causas de fuerza mayor.
                    </li>
                    <li>
                        El contenido creado por los usuarios en sus eventos, ya sean públicos o
                        privados, siendo estos los únicos responsables de dicho contenido.
                    </li>
                    <li>
                        El funcionamiento de servicios de terceros integrados en la plataforma
                        (Stripe, Pusher, Pollinations AI, etc.).
                    </li>
                </ul>
                <p>
                    Aunque trabajamos para garantizar una alta disponibilidad del servicio, no
                    constituye un compromiso contractual de nivel de servicio (SLA).
                </p>
            </section>

            {/* 12 */}
            <section className="mt-10 space-y-4">
                <h3>12. Fuerza Mayor</h3>
                <p>
                    El Titular no será responsable del incumplimiento de sus obligaciones cuando
                    este sea causado por circunstancias ajenas a su control razonable, incluyendo
                    pero no limitándose a: desastres naturales, conflictos armados, pandemias,
                    ciberataques, fallos de infraestructura de terceros (servidores, proveedores de
                    telecomunicaciones, servicios en la nube) o actuaciones de autoridades públicas.
                </p>
            </section>

            {/* 13 */}
            <section className="mt-10 space-y-4">
                <h3>13. Modificación de los Términos</h3>
                <p>
                    El Titular se reserva el derecho de modificar estos Términos en cualquier
                    momento. Cuando los cambios sean significativos, te notificaremos por correo
                    electrónico o mediante un aviso destacado en la plataforma con al menos{" "}
                    <strong>15 días de antelación</strong> a su entrada en vigor.
                </p>
                <p>
                    El uso continuado de POLLNOW tras la fecha de entrada en vigor de los nuevos
                    Términos implica tu aceptación de los mismos. Si no estás de acuerdo con los
                    cambios, debes dejar de utilizar el servicio y, si lo deseas, solicitar la
                    eliminación de tu cuenta.
                </p>
            </section>

            {/* 14 */}
            <section className="mt-10 space-y-4">
                <h3>14. Legislación Aplicable y Jurisdicción</h3>
                <p>
                    Estos Términos se rigen e interpretan conforme a la legislación española. Para
                    la resolución de cualquier controversia derivada del uso de la plataforma, ambas
                    partes se someten a los Juzgados y Tribunales de <strong>Sevilla</strong>,
                    renunciando expresamente a cualquier otro fuero que pudiera corresponderles,
                    salvo que la legislación de protección al consumidor aplicable establezca un
                    fuero imperativo diferente en favor del usuario.
                </p>
                <p>
                    En caso de controversia con consumidores de la Unión Europea, puedes recurrir
                    a la plataforma de resolución de litigios en línea de la Comisión Europea,
                    disponible en{" "}
                    <a
                        href="https://ec.europa.eu/consumers/odr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-violet-400"
                    >
                        ec.europa.eu/consumers/odr
                    </a>
                    .
                </p>
            </section>

            {/* 15 */}
            <section className="mt-10 space-y-4">
                <h3>15. Contacto</h3>
                <p>
                    Para cualquier consulta legal, reporte de contenido inapropiado o solicitud
                    relacionada con estos Términos, puedes contactarnos en:
                </p>
                <p className="bg-neutral-800 p-4 rounded-2xl text-gray-400 border-2 border-white/15">
                    <strong>Raimundo Palma Méndez</strong>
                    <br />
                    Av. Montequinto 8, Dos Hermanas, Sevilla, España (41089)
                    <br />
                    <strong>Email:</strong> contacto@rayelus.com
                </p>
            </section>
        </LegalLayout>
    );
}
