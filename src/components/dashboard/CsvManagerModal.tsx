"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, X, Upload, Download, AlertCircle, CheckCircle2, XCircle, RefreshCw, Import } from "lucide-react";
import type { BulkImportResult } from "@/app/lib/csv-actions";

// Resultado de parsear una fila del CSV.
export type ParsedRow =
    | { ok: true; rowIndex: number; value: string; data: unknown }
    | { ok: false; rowIndex: number; value: string; error: string };

export type CsvManagerConfig = {
    /** Título del modal, p.ej. "Nominados", "Tiers", "Preguntas". */
    title: string;
    /** Cabeceras esperadas en el CSV (en orden). La 1ª columna marca "obligatoria". */
    headers: string[];
    /** Cabeceras que deben existir sí o sí en el archivo. */
    requiredHeaders: string[];
    /** Texto de ejemplo del formato (se muestra en un <pre>). */
    example: string;
    /** Lista de ayudas (bullets) sobre las columnas. */
    hints: { col: string; desc: string }[];
    /** Ruta al CSV de ejemplo descargable (en /public). */
    sampleHref: string;
    /** Parsea una fila (header→valor) en datos de importación, o devuelve error. */
    parseRow: (row: Record<string, string>, rowIndex: number) => ParsedRow;
    /** Acción de importación masiva. */
    onImport: (rows: unknown[]) => Promise<BulkImportResult>;
    /** Cabeceras del CSV exportado. */
    exportHeaders: string[];
    /** Filas a exportar (ya construidas por el manager desde sus datos actuales). */
    exportData: string[][];
    /** Nombre del archivo exportado. */
    exportFilename: string;
};

function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (line[i] === "," && !inQuotes) {
            fields.push(current.trim());
            current = "";
        } else current += line[i];
    }
    fields.push(current.trim());
    return fields;
}

function toCsvCell(v: string): string {
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function buildCsv(headers: string[], rows: string[][]): string {
    return [headers, ...rows].map((r) => r.map(toCsvCell).join(",")).join("\n");
}

function downloadCsv(filename: string, content: string) {
    const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function CsvManagerModal({
    config,
    onClose,
    onImported,
}: {
    config: CsvManagerConfig;
    onClose: (didImport: boolean) => void;
    onImported?: () => void;
}) {
    const [tab, setTab] = useState<"import" | "export">("import");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [hasFile, setHasFile] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<BulkImportResult | null>(null);

    const validRows = parsedRows.filter((r): r is Extract<ParsedRow, { ok: true }> => r.ok);
    const invalidRows = parsedRows.filter((r): r is Extract<ParsedRow, { ok: false }> => !r.ok);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setParseError(null); setResult(null); setParsedRows([]);
        if (!file.name.endsWith(".csv")) { setParseError("El archivo debe tener extensión .csv"); return; }

        const text = await file.text();
        const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) { setParseError("El archivo está vacío o solo tiene la cabecera."); return; }

        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s/g, "_"));
        const missing = config.requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length) {
            setParseError(`Faltan columnas obligatorias: ${missing.join(", ")}. Cabecera esperada: ${config.headers.join(",")}`);
            return;
        }

        const parsed = lines.slice(1).map((line, i) => {
            const cols = parseCSVLine(line);
            const record: Record<string, string> = {};
            headers.forEach((h, idx) => { record[h] = cols[idx] ?? ""; });
            return config.parseRow(record, i + 2);
        });
        setHasFile(true);
        setParsedRows(parsed);
    }

    async function handleImport() {
        if (!validRows.length || importing) return;
        setImporting(true);
        const res = await config.onImport(validRows.map((r) => r.data));
        setResult(res);
        setImporting(false);
        if (res.created > 0) onImported?.();
    }

    function resetFile() {
        setHasFile(false); setParsedRows([]); setParseError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !importing && onClose(!!result?.created)}
        >
            <motion.div
                initial={{ scale: 0.97, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0, y: 8 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="relative bg-zinc-950 border-2 border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-400">
                            <FileSpreadsheet size={15} />
                        </div>
                        <h2 className="text-base font-bold text-white">{config.title} · CSV</h2>
                    </div>
                    <button onClick={() => !importing && onClose(!!result?.created)} className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs Importar / Exportar */}
                <div className="px-6 pt-4">
                    <div className="flex gap-1 p-1 bg-white/5 rounded-xl border-2 border-white/8 w-fit">
                        <button onClick={() => setTab("import")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${tab === "import" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                            <Import size={13} /> Importar
                        </button>
                        <button onClick={() => setTab("export")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${tab === "export" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                            <Download size={13} /> Exportar
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {tab === "export" ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">
                                Descarga lo que tienes ahora ({config.exportData.length} fila{config.exportData.length !== 1 ? "s" : ""}) en CSV, con las columnas <code className="text-amber-300">{config.exportHeaders.join(", ")}</code>.
                            </p>
                            <button
                                onClick={() => downloadCsv(config.exportFilename, buildCsv(config.exportHeaders, config.exportData))}
                                disabled={config.exportData.length === 0}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
                            >
                                <Download size={15} /> Descargar CSV ({config.exportData.length})
                            </button>
                            {config.exportData.length === 0 && <p className="text-xs text-gray-600">No hay nada que exportar todavía.</p>}
                        </div>
                    ) : result ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border-2 border-white/8">
                                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white">Importación completada</p>
                                    <p className="text-xs text-emerald-400 mt-0.5">{result.created} fila{result.created !== 1 ? "s" : ""} creada{result.created !== 1 ? "s" : ""}</p>
                                </div>
                            </div>
                            {result.errors.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5"><XCircle size={12} /> {result.errors.length} fila(s) no importada(s):</p>
                                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                                        {result.errors.map((err, i) => (
                                            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-red-500/5 border border-red-500/15 rounded-lg text-xs">
                                                <span className="font-mono text-gray-500 shrink-0">F{err.row}</span>
                                                <span className="text-gray-300 truncate flex-1">{err.value || "—"}</span>
                                                <span className="text-red-400 shrink-0 text-right ml-2">{err.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button onClick={() => onClose(!!result.created)} className="w-full py-2.5 bg-white/8 hover:bg-white/12 border-2 border-white/10 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer">Cerrar</button>
                        </div>
                    ) : !hasFile ? (
                        <div className="space-y-5">
                            <div className="p-4 bg-white/3 border-2 border-white/8 rounded-xl space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Formato esperado</p>
                                <pre className="text-xs text-amber-300/80 font-mono bg-black/40 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre">{config.example}</pre>
                                <ul className="text-[11px] text-gray-500 space-y-1 mt-2">
                                    {config.hints.map((h, i) => (
                                        <li key={i}>• <strong className="text-gray-400">{h.col}</strong>: {h.desc}</li>
                                    ))}
                                </ul>
                            </div>
                            <a href={config.sampleHref} download className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-2 border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-fit cursor-pointer">
                                <Download size={13} /> Descargar CSV de ejemplo
                            </a>
                            {parseError && (
                                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/8 border-2 border-red-500/20 rounded-xl text-xs text-red-400">
                                    <AlertCircle size={13} className="shrink-0 mt-0.5" /><span>{parseError}</span>
                                </div>
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center gap-3 text-gray-500 hover:border-amber-500/30 hover:text-amber-400 transition-colors cursor-pointer group">
                                <Upload size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-semibold">Seleccionar archivo .csv</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <div><p className="text-xs font-bold text-emerald-400">{validRows.length} válidas</p><p className="text-[10px] text-gray-500">listas para importar</p></div>
                                </div>
                                <div className={`flex items-center gap-2 p-3 border rounded-xl ${invalidRows.length > 0 ? "bg-red-500/5 border-red-500/15" : "bg-white/3 border-white/8"}`}>
                                    <XCircle size={16} className={invalidRows.length > 0 ? "text-red-400 shrink-0" : "text-gray-600 shrink-0"} />
                                    <div><p className={`text-xs font-bold ${invalidRows.length > 0 ? "text-red-400" : "text-gray-500"}`}>{invalidRows.length} con errores</p><p className="text-[10px] text-gray-500">no se importarán</p></div>
                                </div>
                            </div>
                            {invalidRows.length > 0 && (
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                    {invalidRows.map((r, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg text-xs">
                                            <span className="font-mono text-gray-600 shrink-0">F{r.rowIndex}</span>
                                            <span className="text-gray-400 truncate flex-1">{r.value || "—"}</span>
                                            <span className="text-red-400 shrink-0">{r.error}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button onClick={resetFile} disabled={importing} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border-2 border-white/10 rounded-xl text-sm font-semibold text-gray-300 transition-colors cursor-pointer disabled:opacity-50">Cambiar archivo</button>
                                <button onClick={handleImport} disabled={!validRows.length || importing} className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30">
                                    {importing ? <><RefreshCw size={14} className="animate-spin" /> Importando...</> : <><FileSpreadsheet size={14} /> Importar {validRows.length}</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
