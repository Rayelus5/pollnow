import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const alt = "Gala en POLLNOW";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    let title = "Gala en POLLNOW";
    let organizer = "";
    try {
        const event = await prisma.event.findUnique({
            where: { slug },
            select: { title: true, isPublic: true, status: true, user: { select: { name: true } } },
        });
        // Solo mostramos datos reales de eventos públicos aprobados
        if (event && event.isPublic && event.status === "APPROVED") {
            title = event.title;
            organizer = event.user.name;
        }
    } catch {
        // fallback genérico
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: 72,
                    background:
                        "radial-gradient(circle at 25% 15%, #1e3a8a40, transparent 60%), radial-gradient(circle at 85% 90%, #0ea5e930, transparent 55%), #000000",
                    color: "white",
                    fontFamily: "sans-serif",
                }}
            >
                <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#60a5fa", letterSpacing: -1 }}>
                    POLLNOW
                </div>
                <div
                    style={{
                        display: "flex",
                        fontSize: title.length > 40 ? 64 : 80,
                        fontWeight: 800,
                        lineHeight: 1.05,
                        letterSpacing: -2,
                        maxWidth: 1050,
                    }}
                >
                    {title}
                </div>
                <div style={{ display: "flex", fontSize: 30, color: "#9ca3af" }}>
                    {organizer ? `Organizado por ${organizer}` : "Vota por tus favoritos en tiempo real"}
                </div>
            </div>
        ),
        { ...size }
    );
}
