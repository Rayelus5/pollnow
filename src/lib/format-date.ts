// Formateo de fechas normalizado a la zona horaria de España (Europe/Madrid).
//
// Por qué: el servidor (Vercel) corre en UTC y el cliente en la zona del usuario.
// Usar `date-fns format` directo muestra las fechas en la zona de cada runtime,
// provocando desajustes (p. ej. un envío hecho a las 01:00 en España aparecía a
// las 00:00 / día anterior en el panel). `Intl` con `timeZone` fijo devuelve el
// mismo resultado en servidor y cliente.

export const APP_TIMEZONE = "Europe/Madrid";

/**
 * Formatea una fecha en hora de España.
 * @param date Date o string ISO (acepta null/undefined → "").
 * @param withTime Si true, añade " HH:mm".
 */
export function formatDate(date: Date | string | null | undefined, withTime = false): string {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";

    const datePart = new Intl.DateTimeFormat("es-ES", {
        timeZone: APP_TIMEZONE,
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    }).format(d);

    if (!withTime) return datePart;

    const timePart = new Intl.DateTimeFormat("es-ES", {
        timeZone: APP_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(d);

    return `${datePart} ${timePart}`;
}

/** Offset de Madrid (ej. "+02:00" en verano, "+01:00" en invierno) para una fecha YYYY-MM-DD. */
function madridOffset(dateStr: string): string {
    const d = new Date(`${dateStr}T12:00:00Z`); // mediodía UTC: dentro del día con seguridad
    const name = new Intl.DateTimeFormat("en-US", {
        timeZone: APP_TIMEZONE,
        timeZoneName: "longOffset",
    })
        .formatToParts(d)
        .find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
    const offset = name.replace("GMT", "");
    return offset || "+00:00"; // "+02:00"
}

/** Inicio del día (00:00 hora de Madrid) de una fecha YYYY-MM-DD, como instante UTC para filtrar en BD. */
export function madridDayStart(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00${madridOffset(dateStr)}`);
}

/** Fin del día (23:59:59.999 hora de Madrid) de una fecha YYYY-MM-DD, como instante UTC para filtrar en BD. */
export function madridDayEnd(dateStr: string): Date {
    return new Date(`${dateStr}T23:59:59.999${madridOffset(dateStr)}`);
}
