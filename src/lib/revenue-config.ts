// Reglas de negocio del sistema de ingresos. Compartidas cliente + servidor.
// Los guards de seguridad se aplican SIEMPRE en el servidor; estos valores
// también se usan en la UI para feedback inmediato.

export const MAX_BALANCE = 10; // Saldo máximo acumulable (€)
export const MIN_WITHDRAWAL = 5; // Mínimo para solicitar un retiro (€)
export const WITHDRAWAL_PROCESSING_DAYS = 5; // Plazo estimado de pago (días hábiles)

/** Formatea un importe en euros con formato español: €X,XX */
export function formatEur(n: number | null | undefined): string {
    if (n == null || isNaN(n)) return "€0,00";
    return `€${n.toFixed(2).replace(".", ",")}`;
}
