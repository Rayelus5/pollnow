import LegalLayout from "@/components/legal/LegalLayout";

export default function PrivacyPage() {
    return (
        <LegalLayout title="Política de Privacidad" date="21 de Noviembre, 2025">
            <p>
                En POLLNOW ("la Plataforma"), nos tomamos muy en serio tu privacidad. Esta política describe cómo Raimundo Palma Méndez ("nosotros", "el Responsable") recopila, usa y protege tu información.
            </p>

            <h3>1. Responsable del Tratamiento</h3>
            <p>
                <strong>Titular:</strong> Raimundo Palma Méndez (Rayelus)<br />
                <strong>DNI:</strong> 54184186G<br />
                <strong>Dirección:</strong> Av Montequinto 8, Dos Hermanas, Sevilla, España (41089)<br />
                <strong>Email de contacto:</strong> contacto@rayelus.com
            </p>

            <h3>2. Datos que recopilamos</h3>
            <p>Recopilamos diferentes tipos de información según tu interacción con la Plataforma:</p>
            <ul>
                <li><strong>Usuarios Registrados:</strong> Nombre, dirección de correo electrónico, contraseña (encriptada), imagen de perfil y datos de facturación procesados por Stripe (nosotros no almacenamos tu tarjeta de crédito completa).</li>
                <li><strong>Votantes Anónimos:</strong> No recopilamos datos personales identificables de votantes invitados. Utilizamos cookies técnicas y huellas digitales anonimizadas (`voterHash`) únicamente para prevenir votos duplicados y garantizar la integridad de la votación.</li>
                <li><strong>Datos de Eventos:</strong> Títulos, descripciones y nombres de participantes que introduces al crear una gala.</li>
            </ul>

            <h3>3. Finalidad del Tratamiento</h3>
            <p>Usamos tus datos para:</p>
            <ul>
                <li>Gestionar tu cuenta de usuario y acceso al Dashboard.</li>
                <li>Procesar pagos y suscripciones Premium a través de Stripe.</li>
                <li>Permitir la creación, gestión y votación en eventos.</li>
                <li>Prevenir fraudes y asegurar que cada persona vote una sola vez.</li>
                <li>Enviar comunicaciones transaccionales (ej: recuperación de contraseña, confirmación de pago).</li>
            </ul>

            <h3>4. Base Legal</h3>
            <p>El tratamiento de tus datos se basa en:</p>
            <ul>
                <li><strong>Ejecución de un contrato:</strong> Al registrarte y usar nuestros servicios.</li>
                <li><strong>Interés legítimo:</strong> Para garantizar la seguridad de la plataforma y prevenir el spam en las votaciones.</li>
                <li><strong>Cumplimiento legal:</strong> Obligaciones fiscales y contables.</li>
            </ul>

            <h3>5. Tus Derechos</h3>
            <p>
                Conforme al RGPD, tienes derecho a acceder, rectificar, suprimir, limitar y portar tus datos. Puedes ejercer estos derechos escribiendo a <strong>contacto@rayelus.com</strong>.
            </p>
        </LegalLayout>
    );
}