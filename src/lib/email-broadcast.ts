// Shared module — no "use server" / "use client". Used by both the API route and the client preview.

export type TemplateId = 'announcement' | 'maintenance' | 'feature' | 'offer' | 'custom';

export type BroadcastTemplate = {
    id: TemplateId;
    label: string;
    emoji: string;
    badgeText: string;
    badgeBg: string;
    badgeBorder: string;
    badgeColor: string;
    accentGradient: string;
    accentTextColor: string;
    cardBorder: string;
    defaultSubject: string;
    defaultBody: string;
};

export const BROADCAST_TEMPLATES: Record<TemplateId, BroadcastTemplate> = {
    announcement: {
        id: 'announcement',
        label: 'Anuncio',
        emoji: '📢',
        badgeText: 'Comunicado oficial',
        badgeBg: 'rgba(220,38,38,0.12)',
        badgeBorder: 'rgba(248,113,113,0.4)',
        badgeColor: '#fca5a5',
        accentGradient: 'linear-gradient(135deg,#dc2626,#ef4444)',
        accentTextColor: '#ffffff',
        cardBorder: 'rgba(220,38,38,0.25)',
        defaultSubject: 'Comunicado oficial de POLLNOW',
        defaultBody: '',
    },
    maintenance: {
        id: 'maintenance',
        label: 'Mantenimiento',
        emoji: '🔧',
        badgeText: 'Mantenimiento programado',
        badgeBg: 'rgba(234,179,8,0.12)',
        badgeBorder: 'rgba(250,204,21,0.4)',
        badgeColor: '#fde047',
        accentGradient: 'linear-gradient(135deg,#d97706,#f59e0b)',
        accentTextColor: '#0c0a00',
        cardBorder: 'rgba(234,179,8,0.25)',
        defaultSubject: 'Mantenimiento programado en POLLNOW',
        defaultBody:
            'Queremos informarte de que POLLNOW estará en mantenimiento el próximo [fecha] de [hora] a [hora].\n\nDurante este tiempo, el servicio podría no estar disponible. Pedimos disculpas por las molestias causadas.',
    },
    feature: {
        id: 'feature',
        label: 'Nueva función',
        emoji: '✨',
        badgeText: 'Nueva funcionalidad',
        badgeBg: 'rgba(124,58,237,0.12)',
        badgeBorder: 'rgba(167,139,250,0.4)',
        badgeColor: '#c4b5fd',
        accentGradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
        accentTextColor: '#ffffff',
        cardBorder: 'rgba(124,58,237,0.25)',
        defaultSubject: '¡Novedad en POLLNOW!',
        defaultBody: '',
    },
    offer: {
        id: 'offer',
        label: 'Oferta especial',
        emoji: '🎁',
        badgeText: 'Oferta especial',
        badgeBg: 'rgba(5,150,105,0.12)',
        badgeBorder: 'rgba(52,211,153,0.4)',
        badgeColor: '#6ee7b7',
        accentGradient: 'linear-gradient(135deg,#059669,#10b981)',
        accentTextColor: '#ffffff',
        cardBorder: 'rgba(5,150,105,0.25)',
        defaultSubject: 'Oferta especial para ti – POLLNOW',
        defaultBody: '',
    },
    custom: {
        id: 'custom',
        label: 'Personalizado',
        emoji: '✏️',
        badgeText: 'Mensaje de POLLNOW',
        badgeBg: 'rgba(37,99,235,0.12)',
        badgeBorder: 'rgba(99,102,241,0.4)',
        badgeColor: '#a5b4fc',
        accentGradient: 'linear-gradient(135deg,#4f46e5,#6366f1)',
        accentTextColor: '#ffffff',
        cardBorder: 'rgba(99,102,241,0.25)',
        defaultSubject: '',
        defaultBody: '',
    },
};

function esc(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function buildBroadcastEmailHtml(
    template: BroadcastTemplate,
    subject: string,
    body: string,
    ctaLabel?: string,
    ctaUrl?: string,
): string {
    const paragraphs = body
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .map(line => `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.7;color:#e5e7eb;">${esc(line)}</p>`)
        .join('');

    const ctaBlock =
        ctaLabel && ctaUrl
            ? `<a href="${esc(ctaUrl)}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;background:${template.accentGradient};color:${template.accentTextColor};text-align:center;margin:4px 0 20px 0;">${esc(ctaLabel)}</a>`
            : '';

    return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px 0;background-color:#020617;">
<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:0 16px;">
  <div style="border-radius:24px;background-color:#020617;box-shadow:0 18px 45px rgba(15,23,42,0.85);padding:32px 28px;border:1px solid ${template.cardBorder};">

    <div style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:${template.badgeBg};border:1px solid ${template.badgeBorder};margin-bottom:20px;">
      <span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${template.badgeColor};font-weight:600;">${esc(template.badgeText)}</span>
    </div>

    <h2 style="margin:0 0 8px 0;font-size:22px;line-height:1.2;color:#f9fafb;font-weight:800;">${esc(subject || '(sin asunto)')}</h2>

    <div style="margin:20px 0 24px 0;padding:16px 18px;border-radius:16px;background:rgba(15,23,42,0.9);border:1px solid rgba(55,65,81,0.9);">
      ${paragraphs || '<p style="color:#6b7280;font-size:14px;margin:0;">(sin contenido)</p>'}
    </div>

    ${ctaBlock}

    <p style="margin:0;font-size:11px;line-height:1.6;color:#4b5563;">
      Recibes este correo porque tienes una cuenta registrada en POLLNOW.
    </p>
  </div>
  <p style="margin:16px 0 0 0;font-size:11px;line-height:1.6;color:#6b7280;text-align:center;">
    POLLNOW · Gestión de eventos y galas interactivas
  </p>
</div>
</body>
</html>`;
}
