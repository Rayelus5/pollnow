"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cookie,
  X,
  ChevronDown,
  Shield,
  CreditCard,
  Check,
  Settings2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CookieCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  required: boolean;
  cookies: { name: string; purpose: string; duration: string }[];
}

interface CookiePreferences {
  essential: boolean;
  payments: boolean;
  timestamp: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: CookieCategory[] = [
  {
    id: "essential",
    name: "Esenciales",
    icon: <Shield size={14} />,
    description:
      "Son imprescindibles para que la plataforma funcione. No pueden desactivarse.",
    required: true,
    cookies: [
      {
        name: "voter_id",
        purpose: "Identificador anónimo para evitar votos duplicados.",
        duration: "1 año",
      },
      {
        name: "voted_[poll.id]",
        purpose: "Registra que ya has votado en una encuesta concreta.",
        duration: "Indefinido",
      },
      {
        name: "selected_[poll.id]",
        purpose: "Guarda tu selección dentro de una encuesta.",
        duration: "Indefinido",
      },
      {
        name: "authjs.session-token",
        purpose: "Mantiene tu sesión iniciada de forma segura.",
        duration: "Sesión / Persistente",
      },
      {
        name: "cookie_preferences",
        purpose: "Guarda tus preferencias de cookies para no volver a pedirlas.",
        duration: "1 año",
      },
    ],
  },
  {
    id: "payments",
    name: "Pagos (Stripe)",
    icon: <CreditCard size={14} />,
    description:
      "Cookies de Stripe necesarias para el procesamiento seguro de pagos y detección de fraudes.",
    required: false,
    cookies: [
      {
        name: "__stripe_mid",
        purpose: "Identifica el dispositivo para protección antifraude.",
        duration: "1 año",
      },
      {
        name: "__stripe_sid",
        purpose: "Rastrea la sesión activa durante el proceso de pago.",
        duration: "30 minutos",
      },
    ],
  },
];

const STORAGE_KEY = "cookie_preferences";

function readPreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Also set a browser cookie for server-side access (1 year)
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `cookie_preferences=${JSON.stringify(prefs)}; expires=${expires}; path=/; SameSite=Lax`;
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none
        ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
        ${checked ? "bg-blue-500" : "bg-white/15"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={`block h-3.5 w-3.5 rounded-full bg-white shadow`}
        style={{ x: checked ? 20 : 4 }}
      />
    </button>
  );
}

// ─── Category Row ──────────────────────────────────────────────────────────────

function CategoryRow({
  cat,
  enabled,
  onToggle,
}: {
  cat: CookieCategory;
  enabled: boolean;
  onToggle: (id: string, v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border-2 border-white/8 overflow-hidden bg-white/3">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-blue-400 shrink-0">{cat.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{cat.name}</span>
            {cat.required && (
              <span className="text-[10px] uppercase tracking-wider text-blue-400 border-2 border-blue-400/30 rounded-full px-1.5 py-0.5 leading-none">
                Requerida
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{cat.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Toggle
            checked={enabled}
            onChange={(v) => onToggle(cat.id, v)}
            disabled={cat.required}
          />
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-0.5"
            aria-label="Ver cookies"
          >
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Cookie list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-white/8 px-4 py-3 space-y-2">
              {cat.cookies.map((c) => (
                <div key={c.name} className="flex gap-3 text-xs text-gray-400">
                  <code className="text-blue-300 font-mono shrink-0 text-[11px] mt-px">
                    {c.name}
                  </code>
                  <span className="flex-1">{c.purpose}</span>
                  <span className="shrink-0 text-gray-500 italic">{c.duration}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    essential: true,
    payments: true,
  });

  useEffect(() => {
    const saved = readPreferences();
    if (!saved) {
      // Delay so the page has time to paint first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function handleToggle(id: string, value: boolean) {
    setPreferences((prev) => ({ ...prev, [id]: value }));
  }

  function accept(all = true) {
    const prefs: CookiePreferences = {
      essential: true,
      payments: all ? true : preferences.payments,
      timestamp: Date.now(),
    };
    savePreferences(prefs);
    setVisible(false);
    setExpanded(false);
  }

  function saveCustom() {
    const prefs: CookiePreferences = {
      essential: true,
      payments: preferences.payments,
      timestamp: Date.now(),
    };
    savePreferences(prefs);
    setVisible(false);
    setExpanded(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop blur when expanded */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setExpanded(false)}
              />
            )}
          </AnimatePresence>

          {/* Panel */}
          <motion.div
            key="cookie-panel"
            initial={{ y: 100, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
            style={{ x: "-50%" }}
          >
            <div className="relative rounded-2xl border-2 border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

              {/* ── Compact header (always visible) ── */}
              <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 border-2 border-blue-500/20 text-blue-400">
                  <Cookie size={15} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Usamos cookies</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                    Utilizamos cookies esenciales para que la plataforma funcione correctamente.{" "}
                    <Link
                      href="/legal/cookies"
                      className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-0.5"
                    >
                      Saber más <ExternalLink size={10} />
                    </Link>
                  </p>
                </div>

                <button
                  onClick={() => accept(false)}
                  className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-1 -mt-1 -mr-1"
                  aria-label="Cerrar sin guardar preferencias"
                >
                  <X size={15} />
                </button>
              </div>

              {/* ── Expanded: category toggles ── */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-2">
                      <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">
                        Preferencias de cookies
                      </p>
                      {CATEGORIES.map((cat) => (
                        <CategoryRow
                          key={cat.id}
                          cat={cat}
                          enabled={preferences[cat.id] ?? true}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Actions ── */}
              <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
                {expanded ? (
                  <>
                    <button
                      onClick={saveCustom}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-full border-2 border-white/15 py-2 px-4 text-xs font-medium text-white hover:bg-white/5 transition-colors"
                    >
                      <Check size={12} />
                      Guardar selección
                    </button>
                    <button
                      onClick={() => accept(true)}
                      className="flex-1 min-w-0 rounded-full bg-white py-2 px-4 text-xs font-semibold text-black hover:bg-gray-100 transition-colors"
                    >
                      Aceptar todo
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setExpanded(true)}
                      className="flex items-center gap-1.5 rounded-full border-2 border-white/15 py-2 px-4 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings2 size={12} />
                      Gestionar
                    </button>
                    <button
                      onClick={() => accept(false)}
                      className="flex-1 rounded-full border-2 border-white/15 py-2 px-4 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Solo esenciales
                    </button>
                    <button
                      onClick={() => accept(true)}
                      className="flex-1 rounded-full bg-white py-2 px-4 text-xs font-semibold text-black hover:bg-gray-100 transition-colors"
                    >
                      Aceptar todo
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
