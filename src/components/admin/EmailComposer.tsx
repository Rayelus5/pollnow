"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Megaphone, Wrench, Sparkles, Gift, PenLine,
    Users, Crown, UserMinus, UserSearch,
    Send, Eye, X, CheckCircle, AlertTriangle,
    Mail, ChevronDown, Loader2, Link2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { BROADCAST_TEMPLATES, TemplateId, buildBroadcastEmailHtml } from "@/lib/email-broadcast";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecipientMode = "all" | "premium" | "free" | "custom";

type SearchUser = {
    id: string;
    name: string;
    email: string;
    username: string;
    subscriptionStatus: string;
};

type Props = {
    totalUsers: number;
    premiumUsers: number;
    freeUsers: number;
};

// ─── Template icons ───────────────────────────────────────────────────────────

const TEMPLATE_ICONS: Record<TemplateId, React.ReactNode> = {
    announcement: <Megaphone size={18} />,
    maintenance: <Wrench size={18} />,
    feature: <Sparkles size={18} />,
    offer: <Gift size={18} />,
    custom: <PenLine size={18} />,
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailComposer({ totalUsers, premiumUsers, freeUsers }: Props) {
    const [templateId, setTemplateId] = useState<TemplateId>("announcement");
    const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
    const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [subject, setSubject] = useState(BROADCAST_TEMPLATES.announcement.defaultSubject);
    const [messageBody, setMessageBody] = useState(BROADCAST_TEMPLATES.announcement.defaultBody);
    const [ctaEnabled, setCtaEnabled] = useState(false);
    const [ctaLabel, setCtaLabel] = useState("");
    const [ctaUrl, setCtaUrl] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
    const [activePanel, setActivePanel] = useState<"compose" | "preview">("compose");
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const template = BROADCAST_TEMPLATES[templateId];

    // Recipient count
    const recipientCount =
        recipientMode === "all"
            ? totalUsers
            : recipientMode === "premium"
            ? premiumUsers
            : recipientMode === "free"
            ? freeUsers
            : selectedUsers.length;

    // When template changes, pre-fill defaults only if fields are empty / unchanged
    const handleTemplateChange = (id: TemplateId) => {
        const tpl = BROADCAST_TEMPLATES[id];
        setTemplateId(id);
        if (!subject || subject === BROADCAST_TEMPLATES[templateId].defaultSubject) {
            setSubject(tpl.defaultSubject);
        }
        if (!messageBody || messageBody === BROADCAST_TEMPLATES[templateId].defaultBody) {
            setMessageBody(tpl.defaultBody);
        }
    };

    // User search (debounced)
    const handleSearchChange = useCallback((q: string) => {
        setSearchQuery(q);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (q.length < 2) { setSearchResults([]); return; }
        setIsSearching(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/admin/email-recipients?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                setSearchResults(data.users ?? []);
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, []);

    const addUser = (user: SearchUser) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(prev => [...prev, user]);
        }
        setSearchQuery("");
        setSearchResults([]);
    };

    const removeUser = (id: string) => {
        setSelectedUsers(prev => prev.filter(u => u.id !== id));
    };

    // Close search dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Update iframe preview
    useEffect(() => {
        if (!iframeRef.current) return;
        const html = buildBroadcastEmailHtml(
            template,
            subject,
            messageBody,
            ctaEnabled && ctaLabel ? ctaLabel : undefined,
            ctaEnabled && ctaUrl ? ctaUrl : undefined,
        );
        iframeRef.current.srcdoc = html;
    }, [template, subject, messageBody, ctaEnabled, ctaLabel, ctaUrl]);

    // Send handler
    const handleSend = async () => {
        setShowConfirm(false);
        setIsSending(true);
        setResult(null);
        try {
            const res = await fetch("/api/admin/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipients: recipientMode,
                    customEmails:
                        recipientMode === "custom" ? selectedUsers.map(u => u.email) : undefined,
                    subject,
                    messageBody,
                    templateId,
                    ctaLabel: ctaEnabled ? ctaLabel : undefined,
                    ctaUrl: ctaEnabled ? ctaUrl : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error desconocido");
            setResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al enviar";
            alert(`Error: ${message}`);
        } finally {
            setIsSending(false);
        }
    };

    const canSend =
        subject.trim() &&
        messageBody.trim() &&
        recipientCount > 0 &&
        !isSending;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total usuarios", value: totalUsers, icon: <Users size={16} />, color: "text-blue-400" },
                    { label: "Usuarios Premium", value: premiumUsers, icon: <Crown size={16} />, color: "text-amber-400" },
                    { label: "Usuarios gratuitos", value: freeUsers, icon: <UserMinus size={16} />, color: "text-gray-400" },
                ].map(stat => (
                    <div key={stat.label} className="bg-neutral-900 border-2 border-white/10 rounded-xl p-4 flex items-center gap-3">
                        <div className={`${stat.color}`}>{stat.icon}</div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Result banner */}
            {result && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-xl text-green-300">
                    <CheckCircle size={20} className="shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Envío completado</p>
                        <p className="text-xs text-green-400/70">
                            {result.sent} enviados · {result.failed} fallidos · {result.total} destinatarios totales
                        </p>
                    </div>
                    <button onClick={() => setResult(null)} className="ml-auto text-green-500/50 hover:text-green-300 cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Template selector */}
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Plantilla</p>
                <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(BROADCAST_TEMPLATES) as TemplateId[]).map(id => {
                        const tpl = BROADCAST_TEMPLATES[id];
                        const active = templateId === id;
                        return (
                            <button
                                key={id}
                                onClick={() => handleTemplateChange(id)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer text-center
                                    ${active
                                        ? "border-white/30 bg-white/5 text-white"
                                        : "border-white/5 bg-neutral-900 text-gray-500 hover:border-white/15 hover:text-gray-300"
                                    }`}
                            >
                                <span className="text-xl">{tpl.emoji}</span>
                                <span className="text-xs font-semibold leading-tight">{tpl.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main area: compose + preview */}
            <div className="grid grid-cols-2 gap-6">
                {/* ── LEFT: Compose ─────────────────────────────────────────── */}
                <div className="space-y-5">
                    {/* Recipients */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Destinatarios
                        </label>
                        <div className="relative">
                            <select
                                value={recipientMode}
                                onChange={e => setRecipientMode(e.target.value as RecipientMode)}
                                className="w-full bg-neutral-900 border-2 border-white/10 rounded-xl px-4 py-3 text-white text-sm appearance-none outline-none focus:border-white/30 cursor-pointer"
                            >
                                <option value="all">Todos los usuarios ({totalUsers.toLocaleString()})</option>
                                <option value="premium">Solo usuarios Premium ({premiumUsers.toLocaleString()})</option>
                                <option value="free">Solo usuarios gratuitos ({freeUsers.toLocaleString()})</option>
                                <option value="custom">Usuarios específicos</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>

                        {/* Custom user search */}
                        {recipientMode === "custom" && (
                            <div className="mt-3 space-y-2" ref={searchRef}>
                                <div className="relative">
                                    <UserSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        value={searchQuery}
                                        onChange={e => handleSearchChange(e.target.value)}
                                        placeholder="Buscar por nombre, email o usuario..."
                                        className="w-full bg-neutral-900 border-2 border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm outline-none focus:border-white/30 placeholder-gray-600"
                                    />
                                    {isSearching && (
                                        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                                    )}

                                    {/* Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-neutral-800 border-2 border-white/10 rounded-xl overflow-hidden shadow-2xl">
                                            {searchResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => addUser(user)}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors cursor-pointer"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                        {user.name?.[0]?.toUpperCase() ?? "?"}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white font-medium truncate">{user.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                    </div>
                                                    {user.subscriptionStatus !== "free" && (
                                                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                                                            PRO
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected users tags */}
                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-3 bg-neutral-900 border-2 border-white/5 rounded-xl">
                                        {selectedUsers.map(user => (
                                            <span
                                                key={user.id}
                                                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300"
                                            >
                                                {user.name}
                                                <button
                                                    onClick={() => removeUser(user.id)}
                                                    className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Asunto
                        </label>
                        <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Escribe el asunto del correo..."
                            maxLength={120}
                            className="w-full bg-neutral-900 border-2 border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/30 placeholder-gray-600"
                        />
                        <p className="text-xs text-gray-600 mt-1 text-right">{subject.length}/120</p>
                    </div>

                    {/* Message body */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Cuerpo del mensaje
                        </label>
                        <textarea
                            value={messageBody}
                            onChange={e => setMessageBody(e.target.value)}
                            placeholder="Escribe el contenido del correo. Cada línea en blanco crea un párrafo nuevo."
                            rows={8}
                            className="w-full bg-neutral-900 border-2 border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/30 placeholder-gray-600 resize-none leading-relaxed"
                        />
                    </div>

                    {/* CTA section */}
                    <div className="bg-neutral-900 border-2 border-white/5 rounded-xl p-4 space-y-3">
                        <button
                            onClick={() => setCtaEnabled(p => !p)}
                            className="flex items-center justify-between w-full cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Link2 size={14} className="text-gray-400" />
                                <span className="text-sm font-semibold text-gray-300">Botón de acción (CTA)</span>
                            </div>
                            {ctaEnabled
                                ? <ToggleRight size={22} className="text-violet-400" />
                                : <ToggleLeft size={22} className="text-gray-600" />
                            }
                        </button>
                        {ctaEnabled && (
                            <div className="space-y-2 pt-1">
                                <input
                                    value={ctaLabel}
                                    onChange={e => setCtaLabel(e.target.value)}
                                    placeholder="Texto del botón (ej: Ver más)"
                                    maxLength={60}
                                    className="w-full bg-neutral-800 border-2 border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/20 placeholder-gray-600"
                                />
                                <input
                                    value={ctaUrl}
                                    onChange={e => setCtaUrl(e.target.value)}
                                    placeholder="URL destino (ej: https://pollnow.es/...)"
                                    className="w-full bg-neutral-800 border-2 border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/20 placeholder-gray-600"
                                />
                            </div>
                        )}
                    </div>

                    {/* Send button */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-neutral-900 border-2 border-white/5 rounded-xl">
                            <Mail size={13} className="text-gray-500" />
                            <span className="text-xs text-gray-400">
                                {recipientCount > 0
                                    ? <><strong className="text-white">{recipientCount.toLocaleString()}</strong> destinatario{recipientCount !== 1 ? "s" : ""}</>
                                    : <span className="text-gray-600">Sin destinatarios</span>
                                }
                            </span>
                        </div>
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={!canSend}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isSending ? (
                                <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                            ) : (
                                <><Send size={14} /> Enviar email</>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: Preview ─────────────────────────────────────────── */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <Eye size={14} className="text-gray-500" />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vista previa en tiempo real</p>
                    </div>
                    <div className="flex-1 bg-neutral-950 border-2 border-white/10 rounded-xl overflow-hidden">
                        <div className="p-2 bg-neutral-900 border-b border-white/5 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                            <span className="ml-2 text-[10px] text-gray-600 font-mono truncate">
                                {subject || "(sin asunto)"}
                            </span>
                        </div>
                        <iframe
                            ref={iframeRef}
                            title="Email preview"
                            className="w-full bg-[#020617]"
                            style={{ height: "560px", border: "none" }}
                            sandbox="allow-same-origin"
                        />
                    </div>
                </div>
            </div>

            {/* ── Confirm modal ─────────────────────────────────────────────── */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <AlertTriangle size={22} className="text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Confirmar envío masivo</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Esta acción enviará el correo a{" "}
                                    <strong className="text-white">{recipientCount.toLocaleString()} usuarios</strong>.
                                    No se puede deshacer.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-5 p-3 bg-black/30 rounded-xl border border-white/5 text-sm">
                            <div className="flex gap-2">
                                <span className="text-gray-500 shrink-0">Plantilla:</span>
                                <span className="text-gray-200 font-medium">
                                    {template.emoji} {template.label}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-500 shrink-0">Asunto:</span>
                                <span className="text-gray-200 truncate">{subject}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-500 shrink-0">Destinatarios:</span>
                                <span className="text-gray-200">
                                    {recipientMode === "all" && "Todos los usuarios"}
                                    {recipientMode === "premium" && "Usuarios Premium"}
                                    {recipientMode === "free" && "Usuarios gratuitos"}
                                    {recipientMode === "custom" && `${recipientCount} usuarios específicos`}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border-2 border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-semibold transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSend}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                <Send size={14} /> Confirmar envío
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
