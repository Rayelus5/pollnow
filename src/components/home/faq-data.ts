// Fuente única de las preguntas frecuentes de la landing.
// La usan tanto la sección visible (LandingClient) como el FAQPage JSON-LD
// (app/page.tsx), para que el contenido indexado y el visible nunca se desincronicen.

export type FaqEntry = { question: string; answer: string };

export const LANDING_FAQ: FaqEntry[] = [
    {
        question: "¿Pollnow es gratis?",
        answer:
            "Sí. Puedes crear tu primer evento y empezar a votar gratis, sin tarjeta. Los planes de pago (Premium, Plus, Unlimited y Enterprise) amplían los límites: más eventos, categorías, nominados, colaboradores y modos avanzados como el concurso de dibujo.",
    },
    {
        question: "¿Hace falta registrarse para votar?",
        answer:
            "No. Cualquier persona puede votar desde el enlace del evento sin crear una cuenta. Usamos una huella digital anónima para garantizar un voto por persona sin pedir registro. Solo necesitas cuenta para crear y gestionar tus propios eventos.",
    },
    {
        question: "¿Qué modos de evento puedo crear?",
        answer:
            "Cuatro: Gala (estilo premios, con resultados sellados hasta la fecha), Tierlist (el público arrastra nominados a tus tiers), Preguntas (encuestas tipo formulario con resultados privados) y Dibujo (un concurso inspirado en Gartic Phone: dibujar, votar y ver el ranking).",
    },
    {
        question: "¿Los votos son realmente anónimos?",
        answer:
            "Sí, por defecto. Pollnow no expone quién votó qué; cada votante se identifica mediante una huella anónima que impide votos duplicados. En los planes superiores puedes desactivar el voto anónimo si necesitas votación identificada.",
    },
    {
        question: "¿Puedo organizar el evento con más gente?",
        answer:
            "Sí. Puedes invitar a colaboradores para gestionar un evento en tiempo real contigo. El número de colaboradores por evento depende de tu plan, y puedes consultarlo en la página de límites.",
    },
    {
        question: "¿Puedo importar y exportar datos?",
        answer:
            "Sí. Puedes importar nominados, categorías, tiers y preguntas mediante archivos CSV, y exportar los datos de tu evento. Además, puedes generar imágenes de nominados con IA o buscarlas por internet directamente desde el panel.",
    },
];
