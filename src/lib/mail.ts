import { Resend } from 'resend';
import { BroadcastTemplate, buildBroadcastEmailHtml } from './email-broadcast';

const resend = new Resend(process.env.RESEND_API_KEY);

// --- CONFIGURACIÓN DEL REMITENTE ---
const EMAIL_FROM = 'POLLNOW App <contacto@rayelus.com>';
// Email donde el admin recibe notificaciones del sistema (bug reports, retiros, etc.)
const ADMIN_NOTIFICATION_EMAIL = 'contacto@rayelus.com';
// ----------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${BASE_URL}/auth/new-verification?token=${token}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Confirma tu cuenta en POLLNOW",
    text: `Bienvenido a POLLNOW.\n\nConfirma tu dirección de correo haciendo clic en el enlace:\n${confirmLink}\n\n---\nSi no has creado una cuenta, puedes ignorar este mensaje.\npollnow.es`,
    html: `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:24px 0; background-color:#020617;">
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:0 16px;">
      
      <div style="border-radius:24px; border-2:1px solid #1f2937; background-color:#020617; box-shadow:0 18px 45px rgba(15,23,42,0.85); padding:32px 28px;">
        
        <!-- Badge superior -->
        <div style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; background:rgba(37,99,235,0.12); border-2:1px solid rgba(129,140,248,0.4); margin-bottom:20px;">
          <span style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#bfdbfe; font-weight:600;">
            Verificación de cuenta
          </span>
        </div>

        <!-- Cabecera -->
        <h1 style="margin:0 0 8px 0; font-size:24px; line-height:1.2; color:#f9fafb; font-weight:800;">
          Bienvenido a POLLNOW
        </h1>
        <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#9ca3af;">
          Gracias por registrarte. Antes de empezar a crear eventos y galas, necesitamos verificar tu dirección de correo electrónico.
        </p>

        <!-- Bloque destacado -->
        <div style="margin:20px 0 24px 0; padding:16px 18px; border-radius:16px; background:rgba(15,23,42,0.9); border-2:1px solid rgba(55,65,81,0.9);">
          <p style="margin:0; font-size:13px; line-height:1.6; color:#e5e7eb;">
            Haz clic en el botón de abajo para confirmar tu cuenta y acceder a todas las funciones de POLLNOW.
          </p>
        </div>

        <!-- Botón principal -->
        <a href="${confirmLink}"
           style="
             display:inline-block;
             padding:12px 26px;
             font-size:14px;
             font-weight:600;
             text-decoration:none;
             border-radius:999px;
             background:linear-gradient(135deg,#4f46e5,#6366f1);
             color:#0b1120;
             border-2:1px solid rgba(191,219,254,0.9);
             text-align:center;
             margin:4px 0 18px 0;
           ">
          Confirmar mi cuenta
        </a>

        <!-- Texto secundario -->
        <p style="margin:0 0 4px 0; font-size:12px; line-height:1.7; color:#6b7280;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:
        </p>
        <p style="margin:0 0 20px 0; font-size:11px; line-height:1.6; color:#9ca3af; word-break:break-all;">
          ${confirmLink}
        </p>

        <!-- Footer legal -->
        <p style="margin:0; font-size:11px; line-height:1.6; color:#4b5563;">
          Si no has creado una cuenta en POLLNOW, puedes ignorar este mensaje. Tu correo no será utilizado.
        </p>
      </div>

      <!-- Pie pequeño -->
      <p style="margin:16px 0 0 0; font-size:11px; line-height:1.6; color:#6b7280; text-align:center;">
        POLLNOW · Gestión de eventos y galas interactivas
      </p>
    </div>
  </body>
</html>
        `
  });
}

export async function sendSystemNotificationEmail(
  email: string,
  message: string,
  link: string,
  unsubscribeUrl: string
) {
  const actionUrl = `${BASE_URL}${link}`;
  // Asunto específico: eliminar emojis y truncar el mensaje real
  const cleanMessage = message.replace(/^[^\w¡¿]+/, '').trim();
  const subject = cleanMessage.length > 60
    ? `${cleanMessage.slice(0, 57)}… – POLLNOW`
    : `${cleanMessage} – POLLNOW`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:contacto@rayelus.com?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Entity-Ref-ID': `pollnow-notification-${Date.now()}`,
    },
    text: `${message}\n\nVer en POLLNOW: ${actionUrl}\n\n---\nRecibes este correo porque tienes una cuenta en POLLNOW.\nCancelar suscripción: ${unsubscribeUrl}\npollnow.es`,
    html: `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:24px 0; background-color:#020617;">
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:0 16px;">

      <div style="border-radius:24px; background-color:#020617; box-shadow:0 18px 45px rgba(15,23,42,0.85); padding:32px 28px;">

        <!-- Badge superior -->
        <div style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; background:rgba(37,99,235,0.12); border:1px solid rgba(99,102,241,0.4); margin-bottom:20px;">
          <span style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#a5b4fc; font-weight:600;">
            Aviso de cuenta
          </span>
        </div>

        <!-- Cabecera -->
        <h2 style="margin:0 0 8px 0; font-size:22px; line-height:1.2; color:#f9fafb; font-weight:800;">
          Actividad en tu evento
        </h2>
        <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#9ca3af;">
          Ha ocurrido algo en uno de tus eventos en POLLNOW.
        </p>

        <!-- Bloque del mensaje -->
        <div style="margin:20px 0 24px 0; padding:16px 18px; border-radius:16px; background:rgba(15,23,42,0.9); border:1px solid rgba(55,65,81,0.9);">
          <p style="margin:0; font-size:14px; line-height:1.6; color:#e5e7eb;">
            ${message}
          </p>
        </div>

        <!-- Botón principal -->
        <a href="${actionUrl}"
           style="
             display:inline-block;
             padding:12px 26px;
             font-size:14px;
             font-weight:600;
             text-decoration:none;
             border-radius:999px;
             background:linear-gradient(135deg,#4f46e5,#6366f1);
             color:#ffffff;
             text-align:center;
             margin:4px 0 18px 0;
           ">
          Ver en POLLNOW
        </a>

        <!-- Footer legal -->
        <p style="margin:0 0 16px 0; font-size:11px; line-height:1.6; color:#4b5563;">
          Recibes este correo porque tienes una cuenta en POLLNOW. Si no reconoces esta actividad, puedes ignorar este mensaje.
        </p>

        <!-- Unsubscribe -->
        <div style="padding-top:16px; border-top:1px solid rgba(255,255,255,0.06); text-align:center;">
          <a href="${unsubscribeUrl}"
             style="font-size:11px; color:#4b5563; text-decoration:underline;">
            Cancelar suscripción a este tipo de correos
          </a>
        </div>
      </div>

      <!-- Pie pequeño -->
      <p style="margin:16px 0 0 0; font-size:11px; line-height:1.6; color:#6b7280; text-align:center;">
        POLLNOW · Gestión de eventos y galas interactivas
      </p>
    </div>
  </body>
</html>
    `,
  });
}

export async function sendCollaborationInviteEmail(
  email: string,
  invitedUserName: string,
  ownerName: string,
  eventTitle: string,
  link: string,
  unsubscribeUrl: string
) {
  const actionUrl = `${BASE_URL}${link}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `${ownerName} te ha dado acceso a "${eventTitle}" en POLLNOW`,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:contacto@rayelus.com?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Entity-Ref-ID': `pollnow-collab-${Date.now()}`,
    },
    text: `Hola ${invitedUserName},\n\n${ownerName} te ha dado acceso para cogestionar el evento "${eventTitle}" en POLLNOW.\n\nVer en POLLNOW: ${actionUrl}\n\n---\nSi no esperabas este acceso, puedes ignorar este correo.\nCancelar suscripción: ${unsubscribeUrl}\npollnow.es`,
    html: `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:24px 0; background-color:#020617;">
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:0 16px;">

      <div style="border-radius:24px; background-color:#020617; box-shadow:0 18px 45px rgba(15,23,42,0.85); padding:32px 28px; border:1px solid rgba(217,119,6,0.2);">

        <!-- Badge superior -->
        <div style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; background:rgba(217,119,6,0.12); border:1px solid rgba(251,191,36,0.4); margin-bottom:20px;">
          <span style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#fcd34d; font-weight:600;">
            Invitación de colaboración
          </span>
        </div>

        <!-- Cabecera -->
        <h2 style="margin:0 0 8px 0; font-size:24px; line-height:1.2; color:#f9fafb; font-weight:800;">
          ¡Te han invitado a colaborar!
        </h2>
        <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#9ca3af;">
          Hola <strong style="color:#e5e7eb;">${invitedUserName}</strong>, <strong style="color:#e5e7eb;">${ownerName}</strong> te ha invitado a colaborar en su evento en POLLNOW.
        </p>

        <!-- Bloque del evento -->
        <div style="margin:0 0 24px 0; padding:18px 20px; border-radius:16px; background:rgba(217,119,6,0.06); border:1px solid rgba(217,119,6,0.25);">
          <p style="margin:0 0 4px 0; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#92400e; font-weight:600;">Evento</p>
          <p style="margin:0; font-size:18px; font-weight:700; color:#fde68a; line-height:1.3;">
            ${eventTitle}
          </p>
        </div>

        <!-- Descripción -->
        <p style="margin:0 0 24px 0; font-size:13px; line-height:1.7; color:#9ca3af;">
          Como colaborador podrás gestionar el evento junto a su propietario. Acepta o rechaza la invitación desde tu panel de control.
        </p>

        <!-- Botón principal -->
        <a href="${actionUrl}"
           style="
             display:inline-block;
             padding:13px 28px;
             font-size:14px;
             font-weight:700;
             text-decoration:none;
             border-radius:999px;
             background:linear-gradient(135deg,#d97706,#f59e0b);
             color:#0c0a00;
             text-align:center;
             margin:4px 0 20px 0;
           ">
          Ver invitación
        </a>

        <!-- Footer legal -->
        <p style="margin:0 0 16px 0; font-size:11px; line-height:1.6; color:#4b5563;">
          Si no esperabas este acceso, puedes ignorar este correo. No se realizará ninguna acción si no respondes.
        </p>

        <!-- Unsubscribe -->
        <div style="padding-top:16px; border-top:1px solid rgba(217,119,6,0.12); text-align:center;">
          <a href="${unsubscribeUrl}"
             style="font-size:11px; color:#78350f; text-decoration:underline;">
            No quiero recibir más correos de colaboración
          </a>
        </div>
      </div>

      <!-- Pie pequeño -->
      <p style="margin:16px 0 0 0; font-size:11px; line-height:1.6; color:#6b7280; text-align:center;">
        POLLNOW · Gestión de eventos y galas interactivas
      </p>
    </div>
  </body>
</html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${BASE_URL}/auth/new-password?token=${token}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Restablecer contraseña - POLLNOW",
    text: `Restablece tu contraseña de POLLNOW:\n${resetLink}\n\nEste enlace es válido durante 1 hora.\n\n---\nSi no has solicitado este cambio, ignora este correo.\npollnow.es`,
    html: `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:24px 0; background-color:#020617;">
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:0 16px;">

      <div style="border-radius:24px; border-2:1px solid #1f2937; background-color:#020617; box-shadow:0 18px 45px rgba(15,23,42,0.85); padding:32px 28px;">
        
        <!-- Badge superior -->
        <div style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; background:rgba(15,23,42,0.9); border-2:1px solid rgba(75,85,99,0.9); margin-bottom:20px;">
          <span style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#e5e7eb; font-weight:600;">
            Seguridad de la cuenta
          </span>
        </div>

        <!-- Cabecera -->
        <h2 style="margin:0 0 8px 0; font-size:22px; line-height:1.2; color:#f9fafb; font-weight:800;">
          Restablecer contraseña
        </h2>
        <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#9ca3af;">
          Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en POLLNOW.
        </p>

        <!-- Bloque destacado -->
        <div style="margin:20px 0 24px 0; padding:16px 18px; border-radius:16px; background:rgba(15,23,42,0.9); border-2:1px solid rgba(55,65,81,0.9);">
          <p style="margin:0; font-size:13px; line-height:1.6; color:#e5e7eb;">
            Haz clic en el botón de abajo para establecer una nueva contraseña. 
            Por seguridad, este enlace es válido durante 1 hora.
          </p>
        </div>

        <!-- Botón principal -->
        <a href="${resetLink}"
           style="
             display:inline-block;
             padding:12px 26px;
             font-size:14px;
             font-weight:600;
             text-decoration:none;
             border-radius:999px;
             background:#020617;
             color:#f9fafb;
             border-2:1px solid rgba(148,163,184,0.9);
             text-align:center;
             margin:4px 0 18px 0;
           ">
          Cambiar contraseña
        </a>

        <!-- Texto secundario -->
        <p style="margin:0 0 4px 0; font-size:12px; line-height:1.7; color:#6b7280;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:
        </p>
        <p style="margin:0 0 20px 0; font-size:11px; line-height:1.6; color:#9ca3af; word-break:break-all;">
          ${resetLink}
        </p>

        <!-- Aviso -->
        <p style="margin:0; font-size:11px; line-height:1.6; color:#4b5563;">
          Si tú no has solicitado este cambio, te recomendamos ignorar este correo. Tu contraseña actual seguirá siendo válida.
        </p>
      </div>

      <!-- Pie pequeño -->
      <p style="margin:16px 0 0 0; font-size:11px; line-height:1.6; color:#6b7280; text-align:center;">
        POLLNOW · Gestión de eventos y galas interactivas
      </p>
    </div>
  </body>
</html>
        `
  });
}

// ─── Admin broadcast (batch) ─────────────────────────────────────────────────

const BATCH_SIZE = 100;

export async function sendAdminBroadcastBatch(
  emails: string[],
  subject: string,
  body: string,
  template: BroadcastTemplate,
  ctaLabel?: string,
  ctaUrl?: string,
): Promise<{ sent: number; failed: number }> {
  const html = buildBroadcastEmailHtml(template, subject, body, ctaLabel, ctaUrl);
  const text = [
    subject,
    '',
    body,
    ...(ctaLabel && ctaUrl ? ['', `${ctaLabel}: ${ctaUrl}`] : []),
    '',
    '---',
    'pollnow.es',
  ].join('\n');

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    try {
      const result = await resend.batch.send(
        chunk.map(to => ({ from: EMAIL_FROM, to, subject, text, html }))
      );
      if (result.error) {
        failed += chunk.length;
      } else {
        sent += chunk.length;
      }
    } catch {
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de plantilla (estilo oscuro coherente con los emails existentes)
// ─────────────────────────────────────────────────────────────────────────────

/** Envuelve el contenido en la tarjeta oscura estándar de POLLNOW. */
function wrapEmail(opts: { badge: string; title: string; bodyHtml: string }): string {
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:24px 0; background-color:#020617;">
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:0 16px;">
      <div style="border-radius:24px; border:1px solid #1f2937; background-color:#020617; box-shadow:0 18px 45px rgba(15,23,42,0.85); padding:32px 28px;">
        <div style="display:inline-block; padding:4px 10px; border-radius:999px; background:rgba(15,23,42,0.9); border:1px solid rgba(75,85,99,0.9); margin-bottom:20px;">
          <span style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#e5e7eb; font-weight:600;">${opts.badge}</span>
        </div>
        <h2 style="margin:0 0 16px 0; font-size:22px; line-height:1.2; color:#f9fafb; font-weight:800;">${opts.title}</h2>
        ${opts.bodyHtml}
      </div>
      <p style="margin:16px 0 0 0; font-size:11px; line-height:1.6; color:#6b7280; text-align:center;">
        POLLNOW · Gestión de eventos y galas interactivas
      </p>
    </div>
  </body>
</html>`;
}

/** Botón CTA estándar (oscuro con borde). */
function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block; padding:12px 26px; font-size:14px; font-weight:600; text-decoration:none; border-radius:999px; background:#020617; color:#f9fafb; border:1px solid rgba(148,163,184,0.9); text-align:center; margin:8px 0 4px 0;">${label}</a>`;
}

const SEVERITY_LABEL: Record<string, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" };
const SEVERITY_COLOR: Record<string, string> = { LOW: "#3b82f6", MEDIUM: "#eab308", HIGH: "#f97316", CRITICAL: "#ef4444" };

// ─────────────────────────────────────────────────────────────────────────────
// BUG BOUNTY
// ─────────────────────────────────────────────────────────────────────────────

export async function sendBugReportToAdmin(params: {
  reportId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  pageUrl: string;
  description: string;
  screenshotUrl?: string | null;
  reporterName: string;
  reporterEmail: string;
  reporterId: string;
}) {
  const color = SEVERITY_COLOR[params.severity];
  const sevLabel = SEVERITY_LABEL[params.severity];
  const body = `
    <p style="margin:0 0 4px 0; font-size:13px; color:#9ca3af;">Severidad</p>
    <p style="margin:0 0 16px 0;"><span style="display:inline-block; padding:4px 12px; border-radius:999px; background:${color}22; color:${color}; border:1px solid ${color}55; font-size:12px; font-weight:700; text-transform:uppercase;">${sevLabel}</span></p>

    <p style="margin:0 0 4px 0; font-size:13px; color:#9ca3af;">Usuario que reporta</p>
    <p style="margin:0 0 16px 0; font-size:14px; color:#e5e7eb;">
      ${params.reporterName} · ${params.reporterEmail}<br/>
      <a href="${BASE_URL}/admin/users/${params.reporterId}" style="color:#60a5fa; font-size:12px;">Ver perfil en el panel</a>
    </p>

    <p style="margin:0 0 4px 0; font-size:13px; color:#9ca3af;">Página donde ocurre</p>
    <p style="margin:0 0 16px 0; font-size:14px;"><a href="${params.pageUrl}" style="color:#60a5fa; word-break:break-all;">${params.pageUrl}</a></p>

    <p style="margin:0 0 4px 0; font-size:13px; color:#9ca3af;">Descripción</p>
    <div style="margin:0 0 16px 0; padding:14px 16px; border-radius:12px; background:rgba(15,23,42,0.9); border:1px solid rgba(55,65,81,0.9); font-size:14px; line-height:1.6; color:#e5e7eb; white-space:pre-wrap;">${escapeHtml(params.description)}</div>

    ${params.screenshotUrl ? `<p style="margin:0 0 16px 0;"><a href="${params.screenshotUrl}" style="color:#60a5fa; font-size:13px;">Ver captura adjunta</a></p>` : ""}

    ${emailButton(`${BASE_URL}/admin/bugs/${params.reportId}`, "Ver reporte en el panel")}
  `;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `BUG REPORT - ${params.severity}: ${params.title}`,
    text: `Nuevo bug report (${sevLabel})\nTítulo: ${params.title}\nUsuario: ${params.reporterName} (${params.reporterEmail})\nPágina: ${params.pageUrl}\n\n${params.description}\n\nVer: ${BASE_URL}/admin/bugs/${params.reportId}`,
    html: wrapEmail({ badge: "Bug Bounty", title: `Nuevo reporte: ${escapeHtml(params.title)}`, bodyHtml: body }),
  });
}

export async function sendBugReplyToUser(params: { to: string; subject: string; message: string }) {
  const body = `
    <div style="margin:0 0 20px 0; padding:16px 18px; border-radius:12px; background:rgba(15,23,42,0.9); border:1px solid rgba(55,65,81,0.9); font-size:14px; line-height:1.7; color:#e5e7eb; white-space:pre-wrap;">${escapeHtml(params.message)}</div>
    ${emailButton(`${BASE_URL}/bug-bounty`, "Ir al programa Bug Bounty")}
  `;
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    text: params.message,
    html: wrapEmail({ badge: "Bug Bounty", title: "Respuesta a tu reporte", bodyHtml: body }),
  });
}

/** Escapa HTML básico para insertar texto de usuario en los emails. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE INGRESOS
// ─────────────────────────────────────────────────────────────────────────────

/** Formatea un importe en euros (formato español: €X,XX). */
function eur(n: number): string {
  return `€${n.toFixed(2).replace(".", ",")}`;
}

function infoRow(label: string, value: string): string {
  return `<p style="margin:0 0 4px 0; font-size:13px; color:#9ca3af;">${label}</p><p style="margin:0 0 16px 0; font-size:15px; color:#e5e7eb; font-weight:600;">${value}</p>`;
}

/** Usuario: ha recibido un pago de ingresos. */
export async function sendRevenuePaymentReceived(params: {
  to: string;
  amount: number;
  eventTitle: string;
  eventId: string;
  currentBalance: number;
  adminNote?: string | null;
}) {
  const body = `
    ${infoRow("Cantidad recibida", eur(params.amount))}
    ${infoRow("Evento", params.eventTitle)}
    ${infoRow("Saldo actual", eur(params.currentBalance))}
    ${params.adminNote ? `<p style="margin:0 0 4px 0; font-size:13px; color:#9ca3af;">Nota</p><div style="margin:0 0 16px 0; padding:12px 14px; border-radius:12px; background:rgba(15,23,42,0.9); border:1px solid rgba(55,65,81,0.9); font-size:14px; color:#e5e7eb; white-space:pre-wrap;">${escapeHtml(params.adminNote)}</div>` : ""}
    ${emailButton(`${BASE_URL}/dashboard?tab=ingresos`, "Ver mis ingresos")}
  `;
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `💰 Has recibido ${eur(params.amount)} en Pollnow`,
    text: `Has recibido ${eur(params.amount)} por el evento "${params.eventTitle}". Saldo actual: ${eur(params.currentBalance)}.`,
    html: wrapEmail({ badge: "Ingresos", title: `Has recibido ${eur(params.amount)}`, bodyHtml: body }),
  });
}

/** Usuario: confirmación de solicitud de retiro. */
export async function sendWithdrawalRequestedUser(params: {
  to: string;
  amount: number;
  processingDays: number;
}) {
  const body = `
    ${infoRow("Cantidad solicitada", eur(params.amount))}
    ${infoRow("Método", "Bizum")}
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#9ca3af;">Procesaremos la transferencia en un plazo aproximado de ${params.processingDays} días hábiles.</p>
    ${emailButton(`${BASE_URL}/dashboard?tab=ingresos`, "Ver estado del retiro")}
  `;
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Solicitud de retiro recibida — ${eur(params.amount)}`,
    text: `Hemos recibido tu solicitud de retiro de ${eur(params.amount)} por Bizum. Plazo estimado: ${params.processingDays} días hábiles.`,
    html: wrapEmail({ badge: "Ingresos", title: "Solicitud de retiro recibida", bodyHtml: body }),
  });
}

/** Admin: nueva solicitud de retiro pendiente. */
export async function sendWithdrawalRequestedAdmin(params: {
  userName: string;
  userEmail: string;
  amount: number;
  recipientPhone: string;
  recipientName: string;
}) {
  const body = `
    ${infoRow("Usuario", `${params.userName} · ${params.userEmail}`)}
    ${infoRow("Cantidad", eur(params.amount))}
    ${infoRow("Bizum (teléfono)", params.recipientPhone)}
    ${infoRow("Destinatario", params.recipientName)}
    ${emailButton(`${BASE_URL}/admin/ingresos/retiros`, "Ver solicitud en el panel")}
  `;
  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `Nueva solicitud de retiro — ${params.userName} ${eur(params.amount)}`,
    text: `${params.userName} (${params.userEmail}) solicita retirar ${eur(params.amount)} por Bizum a ${params.recipientName} (${params.recipientPhone}).`,
    html: wrapEmail({ badge: "Ingresos · Admin", title: "Nueva solicitud de retiro", bodyHtml: body }),
  });
}

/** Usuario: retiro aprobado/pagado. */
export async function sendWithdrawalApproved(params: {
  to: string;
  amount: number;
  totalEarned: number;
}) {
  const body = `
    ${infoRow("Cantidad", eur(params.amount))}
    ${infoRow("Método", "Bizum")}
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#9ca3af;">Hemos procesado tu retiro. Deberías ver el Bizum en tu cuenta en breve.</p>
    ${infoRow("Total histórico ganado", eur(params.totalEarned))}
    ${emailButton(`${BASE_URL}/dashboard?tab=ingresos`, "Ver mis ingresos")}
  `;
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `✅ Tu retiro de ${eur(params.amount)} ha sido procesado`,
    text: `Tu retiro de ${eur(params.amount)} por Bizum ha sido procesado. Total histórico ganado: ${eur(params.totalEarned)}.`,
    html: wrapEmail({ badge: "Ingresos", title: "Retiro procesado", bodyHtml: body }),
  });
}

/** Usuario: retiro rechazado (con motivo). */
export async function sendWithdrawalRejected(params: {
  to: string;
  amount: number;
  reason: string;
}) {
  const body = `
    ${infoRow("Cantidad solicitada", eur(params.amount))}
    <p style="margin:0 0 4px 0; font-size:13px; color:#9ca3af;">Motivo del rechazo</p>
    <div style="margin:0 0 16px 0; padding:12px 14px; border-radius:12px; background:rgba(127,29,29,0.25); border:1px solid rgba(239,68,68,0.4); font-size:14px; color:#fecaca; white-space:pre-wrap;">${escapeHtml(params.reason)}</div>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#9ca3af;">Tu saldo sigue disponible y puedes volver a solicitar el retiro cuando quieras.</p>
    ${emailButton(`${BASE_URL}/dashboard?tab=ingresos`, "Ver mis ingresos")}
  `;
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Tu solicitud de retiro ha sido rechazada",
    text: `Tu solicitud de retiro de ${eur(params.amount)} ha sido rechazada. Motivo: ${params.reason}. Tu saldo sigue disponible.`,
    html: wrapEmail({ badge: "Ingresos", title: "Solicitud de retiro rechazada", bodyHtml: body }),
  });
}
