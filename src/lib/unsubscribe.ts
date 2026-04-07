import { createHmac } from 'crypto';

const secret = () => process.env.NEXTAUTH_SECRET ?? 'pollnow-unsubscribe-fallback';

/**
 * Genera un token firmado con HMAC-SHA256 para el enlace de unsubscribe.
 * Formato interno (antes de base64url): `userId:type:hmac`
 */
export function generateUnsubscribeToken(userId: string, type: 'notifications' | 'collaborations'): string {
  const payload = `${userId}:${type}`;
  const hmac = createHmac('sha256', secret()).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

/**
 * Verifica el token y devuelve { userId, type } si es válido, null si no.
 */
export function verifyUnsubscribeToken(
  token: string
): { userId: string; type: 'notifications' | 'collaborations' } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    // Formato: uuid(con guiones):type:hmac64chars
    // Separamos desde el final para no romper el UUID
    const lastColon = decoded.lastIndexOf(':');
    const secondLastColon = decoded.lastIndexOf(':', lastColon - 1);
    if (lastColon === -1 || secondLastColon === -1) return null;

    const userId = decoded.slice(0, secondLastColon);
    const type = decoded.slice(secondLastColon + 1, lastColon) as 'notifications' | 'collaborations';
    const hmac = decoded.slice(lastColon + 1);

    if (type !== 'notifications' && type !== 'collaborations') return null;

    const expected = createHmac('sha256', secret()).update(`${userId}:${type}`).digest('hex');
    if (hmac !== expected) return null;

    return { userId, type };
  } catch {
    return null;
  }
}

/**
 * Construye la URL completa de unsubscribe para incluir en emails.
 */
export function buildUnsubscribeUrl(
  baseUrl: string,
  userId: string,
  type: 'notifications' | 'collaborations'
): string {
  const token = generateUnsubscribeToken(userId, type);
  return `${baseUrl}/unsubscribe?token=${token}`;
}
