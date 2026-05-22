import { ImageResponse } from "next/og";

export const alt = "POLLNOW — Crea tu propia gala digital";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                        "radial-gradient(circle at 30% 20%, #1e3a8a33, transparent 60%), radial-gradient(circle at 80% 80%, #0ea5e933, transparent 55%), #000000",
                    color: "white",
                    fontFamily: "sans-serif",
                }}
            >
                <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: -6 }}>POLLNOW</div>
                <div style={{ fontSize: 38, color: "#9ca3af", marginTop: 12 }}>
                    Crea tu propia gala digital
                </div>
            </div>
        ),
        { ...size }
    );
}
