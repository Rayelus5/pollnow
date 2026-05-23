"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import {
    Brush, Eraser, PaintBucket, Minus, Square, Circle as CircleIcon,
    Pipette, Undo2, Redo2, Trash2, MoveVertical,
} from "lucide-react";

export type DrawingCanvasHandle = {
    /** Exporta el dibujo como PNG. Devuelve null si está vacío/falla. */
    exportBlob: () => Promise<Blob | null>;
    isDirty: () => boolean;
};

type Tool = "pencil" | "eraser" | "fill" | "line" | "rect" | "rect-fill" | "circle" | "circle-fill" | "eyedropper";

const CANVAS_W = 900;
const CANVAS_H = 600;
const SIZES = [2, 5, 10, 20, 40];
const MAX_HISTORY = 30;

const TOOLS: { id: Tool; label: string; Icon: typeof Brush }[] = [
    { id: "pencil", label: "Pincel", Icon: Brush },
    { id: "eraser", label: "Goma", Icon: Eraser },
    { id: "fill", label: "Relleno", Icon: PaintBucket },
    { id: "line", label: "Línea", Icon: Minus },
    { id: "rect", label: "Rectángulo", Icon: Square },
    { id: "rect-fill", label: "Rectángulo relleno", Icon: Square },
    { id: "circle", label: "Círculo", Icon: CircleIcon },
    { id: "circle-fill", label: "Círculo relleno", Icon: CircleIcon },
    { id: "eyedropper", label: "Cuentagotas", Icon: Pipette },
];

const DrawingCanvas = forwardRef<DrawingCanvasHandle, { disabled?: boolean }>(function DrawingCanvas(
    { disabled = false },
    ref
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const drawing = useRef(false);
    const startPos = useRef<{ x: number; y: number } | null>(null);
    const snapshot = useRef<ImageData | null>(null);
    const dirty = useRef(false);

    const undoStack = useRef<ImageData[]>([]);
    const redoStack = useRef<ImageData[]>([]);

    const [tool, setTool] = useState<Tool>("pencil");
    const [color, setColor] = useState("#111827");
    const [size, setSize] = useState(5);
    const [opacity, setOpacity] = useState(100);
    const [recent, setRecent] = useState<string[]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [toolbarPos, setToolbarPos] = useState<"top" | "bottom">("top");
    const wrapRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);

    // Init canvas (fondo blanco)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctxRef.current = ctx;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }, []);

    const pushHistory = useCallback(() => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        undoStack.current.push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
        if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
        redoStack.current = [];
        setCanUndo(undoStack.current.length > 0);
        setCanRedo(false);
    }, []);

    const addRecent = useCallback((c: string) => {
        setRecent((prev) => [c, ...prev.filter((x) => x !== c)].slice(0, 6));
    }, []);

    // --- Coordenadas (mapea puntero → píxeles del canvas) ---
    const getPos = (e: React.PointerEvent): { x: number; y: number } => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
            y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
        };
    };

    // --- Cursor custom (punto que escala con el grosor) ---
    const updateCursor = (e: React.PointerEvent) => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        const cur = cursorRef.current;
        if (!canvas || !wrap || !cur) return;
        const rect = canvas.getBoundingClientRect();
        const scale = rect.width / CANVAS_W;
        const d = Math.max(6, size * scale);
        const wrapRect = wrap.getBoundingClientRect();
        cur.style.width = `${d}px`;
        cur.style.height = `${d}px`;
        cur.style.left = `${e.clientX - wrapRect.left}px`;
        cur.style.top = `${e.clientY - wrapRect.top}px`;
        cur.style.display = "block";
    };
    const hideCursor = () => {
        if (cursorRef.current) cursorRef.current.style.display = "none";
    };

    const applyStroke = (ctx: CanvasRenderingContext2D) => {
        ctx.globalAlpha = opacity / 100;
        ctx.lineWidth = size;
        ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
    };

    // --- Flood fill (bote de pintura) ---
    const floodFill = (ctx: CanvasRenderingContext2D, sx: number, sy: number, hex: string) => {
        const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        const data = img.data;
        const x0 = Math.floor(sx), y0 = Math.floor(sy);
        const idx = (x: number, y: number) => (y * CANVAS_W + x) * 4;
        const start = idx(x0, y0);
        const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
        const fill = hexToRgba(hex, opacity / 100);
        const match = (i: number) =>
            Math.abs(data[i] - target[0]) < 8 &&
            Math.abs(data[i + 1] - target[1]) < 8 &&
            Math.abs(data[i + 2] - target[2]) < 8 &&
            Math.abs(data[i + 3] - target[3]) < 8;
        if (fill.every((v, k) => Math.abs(v - target[k]) < 4)) return; // mismo color
        const stack = [[x0, y0]];
        while (stack.length) {
            const [x, y] = stack.pop()!;
            if (x < 0 || y < 0 || x >= CANVAS_W || y >= CANVAS_H) continue;
            const i = idx(x, y);
            if (!match(i)) continue;
            data[i] = fill[0]; data[i + 1] = fill[1]; data[i + 2] = fill[2]; data[i + 3] = fill[3];
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        ctx.putImageData(img, 0, 0);
    };

    const onPointerDown = (e: React.PointerEvent) => {
        if (disabled) return;
        const ctx = ctxRef.current;
        if (!ctx) return;
        const pos = getPos(e);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        if (tool === "eyedropper") {
            const p = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
            const hex = rgbToHex(p[0], p[1], p[2]);
            setColor(hex);
            addRecent(hex);
            return;
        }

        pushHistory();

        if (tool === "fill") {
            floodFill(ctx, pos.x, pos.y, color);
            addRecent(color);
            dirty.current = true;
            return;
        }

        drawing.current = true;
        startPos.current = pos;
        snapshot.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);

        if (tool === "pencil" || tool === "eraser") {
            applyStroke(ctx);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            // Punto inicial (para clics sin arrastre)
            ctx.lineTo(pos.x + 0.01, pos.y + 0.01);
            ctx.stroke();
        }
    };

    const onPointerMove = (e: React.PointerEvent) => {
        updateCursor(e);
        if (!drawing.current || disabled) return;
        const ctx = ctxRef.current;
        if (!ctx || !startPos.current) return;
        const pos = getPos(e);

        if (tool === "pencil" || tool === "eraser") {
            applyStroke(ctx);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            dirty.current = true;
            return;
        }

        // Formas: restaurar snapshot y previsualizar
        if (snapshot.current) ctx.putImageData(snapshot.current, 0, 0);
        applyStroke(ctx);
        const s = startPos.current;
        ctx.beginPath();
        if (tool === "line") {
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (tool === "rect" || tool === "rect-fill") {
            const w = pos.x - s.x, h = pos.y - s.y;
            if (tool === "rect-fill") ctx.fillRect(s.x, s.y, w, h);
            else ctx.strokeRect(s.x, s.y, w, h);
        } else if (tool === "circle" || tool === "circle-fill") {
            const rx = Math.abs(pos.x - s.x) / 2;
            const ry = Math.abs(pos.y - s.y) / 2;
            const cx = (pos.x + s.x) / 2;
            const cy = (pos.y + s.y) / 2;
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            if (tool === "circle-fill") ctx.fill();
            else ctx.stroke();
        }
    };

    const onPointerUp = () => {
        if (!drawing.current) return;
        drawing.current = false;
        startPos.current = null;
        snapshot.current = null;
        dirty.current = true;
        if (ctxRef.current) ctxRef.current.globalAlpha = 1;
        if (tool !== "eraser") addRecent(color);
    };

    const undo = () => {
        const ctx = ctxRef.current;
        if (!ctx || undoStack.current.length === 0) return;
        redoStack.current.push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
        const prev = undoStack.current.pop()!;
        ctx.putImageData(prev, 0, 0);
        setCanUndo(undoStack.current.length > 0);
        setCanRedo(true);
    };

    const redo = () => {
        const ctx = ctxRef.current;
        if (!ctx || redoStack.current.length === 0) return;
        undoStack.current.push(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
        const next = redoStack.current.pop()!;
        ctx.putImageData(next, 0, 0);
        setCanRedo(redoStack.current.length > 0);
        setCanUndo(true);
    };

    const clearAll = () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        pushHistory();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        dirty.current = true;
    };

    // Atajos teclado
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    useImperativeHandle(ref, () => ({
        exportBlob: () =>
            new Promise<Blob | null>((resolve) => {
                const canvas = canvasRef.current;
                if (!canvas) return resolve(null);
                canvas.toBlob((blob) => resolve(blob), "image/png");
            }),
        isDirty: () => dirty.current,
    }), []);

    const toolbar = (
        <div className="rounded-2xl border-2 border-neutral-700 bg-neutral-800/80 backdrop-blur p-2.5 flex flex-wrap items-center gap-3 max-w-5xl mx-auto">
            {/* Herramientas (primero, lo más usado) */}
            <div className="flex items-center gap-1">
                {TOOLS.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTool(id)}
                        title={label}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 cursor-pointer transition-colors ${tool === id ? "border-blue-500 bg-blue-500/15 text-blue-300" : "border-white/15 text-gray-300 hover:border-white/30"}`}
                    >
                        <Icon size={16} fill={id.endsWith("-fill") ? "currentColor" : "none"} />
                    </button>
                ))}
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Color + recientes */}
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent border-2 border-white/15 cursor-pointer p-0"
                    title="Color"
                />
                <input
                    value={color}
                    onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v); }}
                    className="w-[68px] bg-black border-2 border-white/15 rounded-lg px-2 py-1.5 text-white text-xs font-mono outline-none focus:border-blue-500"
                />
                <div className="flex gap-1">
                    {recent.map((c) => (
                        <button key={c} type="button" onClick={() => setColor(c)} className="w-6 h-6 rounded border border-white/20 cursor-pointer" style={{ backgroundColor: c }} title={c} />
                    ))}
                </div>
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Tamaños */}
            <div className="flex items-center gap-1">
                {SIZES.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 cursor-pointer transition-colors ${size === s ? "border-blue-500 bg-blue-500/15" : "border-white/15 hover:border-white/30"}`}
                        title={`${s}px`}
                    >
                        <span className="rounded-full bg-white block" style={{ width: Math.min(s, 20), height: Math.min(s, 20) }} />
                    </button>
                ))}
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Opacidad */}
            <div className="flex items-center gap-2">
                <input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-20 accent-blue-500" title="Opacidad" />
                <span className="text-xs text-white font-mono w-9">{opacity}%</span>
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Historial */}
            <div className="flex items-center gap-1">
                <button type="button" onClick={undo} disabled={!canUndo} className="w-9 h-9 rounded-lg flex items-center justify-center border-2 border-white/15 text-gray-300 hover:border-white/30 cursor-pointer disabled:opacity-30" title="Deshacer (Ctrl+Z)">
                    <Undo2 size={16} />
                </button>
                <button type="button" onClick={redo} disabled={!canRedo} className="w-9 h-9 rounded-lg flex items-center justify-center border-2 border-white/15 text-gray-300 hover:border-white/30 cursor-pointer disabled:opacity-30" title="Rehacer (Ctrl+Y)">
                    <Redo2 size={16} />
                </button>
                <button type="button" onClick={clearAll} className="w-9 h-9 rounded-lg flex items-center justify-center border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer" title="Limpiar todo">
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Mover barra arriba/abajo */}
            <button
                type="button"
                onClick={() => setToolbarPos((p) => (p === "top" ? "bottom" : "top"))}
                className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center border-2 border-white/15 text-gray-400 hover:text-white hover:border-white/30 cursor-pointer"
                title={toolbarPos === "top" ? "Mover herramientas abajo" : "Mover herramientas arriba"}
            >
                <MoveVertical size={16} />
            </button>
        </div>
    );

    return (
        <div className={`select-none flex flex-col gap-3 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
            {toolbarPos === "top" && toolbar}

            {/* Lienzo (altura acotada para no exceder el viewport) */}
            <div
                ref={wrapRef}
                className="relative mx-auto w-full rounded-2xl border-4 border-neutral-700 bg-neutral-700 p-2"
                style={{ maxWidth: `calc(64vh * ${CANVAS_W} / ${CANVAS_H})` }}
            >
                <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    onPointerDown={(e) => { updateCursor(e); onPointerDown(e); }}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerEnter={updateCursor}
                    onPointerLeave={() => { onPointerUp(); hideCursor(); }}
                    className="w-full rounded-xl bg-white touch-none"
                    style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, cursor: "none" }}
                />
                {/* Cursor custom: punto blanco con borde negro, escala con el grosor */}
                <div
                    ref={cursorRef}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        display: "none",
                        background: "rgba(255,255,255,0.55)",
                        border: "1.5px solid #000",
                        boxShadow: "0 0 0 1px #fff",
                    }}
                />
            </div>

            {toolbarPos === "bottom" && toolbar}
        </div>
    );
});

function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16), Math.round(alpha * 255)];
}
function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export default DrawingCanvas;
