import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Cambia esto por tu dominio verificado en Resend o usa 'onboarding@resend.dev' para pruebas
const EMAIL_FROM = 'POLLNOW Security <onboarding@resend.dev>';

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-verification?token=${token}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Confirma tu cuenta en POLLNOW",
    html: `
      <h1>Bienvenido a POLLNOW</h1>
      <p>Para completar tu registro y verificar que este correo es tuyo, haz clic en el siguiente enlace:</p>
      <a href="${confirmLink}">Confirmar Cuenta</a>
      <p>Si no has solicitado esto, ignora este mensaje.</p>
    `
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-password?token=${token}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Restablecer Contraseña - POLLNOW",
    html: `
      <h1>Recuperación de Cuenta</h1>
      <p>Has solicitado cambiar tu contraseña. Haz clic aquí para crear una nueva:</p>
      <a href="${resetLink}">Restablecer Contraseña</a>
      <p>Este enlace expirará en 1 hora.</p>
    `
  });
}