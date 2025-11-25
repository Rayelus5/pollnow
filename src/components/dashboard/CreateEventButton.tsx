"use client";

import { useState } from "react";
import { createEvent } from "@/app/lib/dashboard-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import { Plus, X } from "lucide-react";

type CreateEventButtonProps = {
    planSlug: string;
    /**
     * Callback opcional para avisar al padre (DashboardTabs)
     * de que estamos creando un evento. Ideal para mostrar loaders globales.
     */
    onCreatingChange?: (isCreating: boolean) => void;
};

export default function CreateEventButton({
    planSlug,
    onCreatingChange,
}: CreateEventButtonProps) {
    const isPremium = planSlug === "premium" || planSlug === "plus";

    const [isOpen, setIsOpen] = useState(false);
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingPremium, setLoadingPremium] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [title, setTitle] = useState("");

    const router = useRouter();

    // Filtro de título (bloquea emojis / símbolos raros)
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const allowed = /^[\w\s\-\.,:;!¡?¿()'`´"áéíóúÁÉÍÓÚñÑüÜ]*$/;

        if (allowed.test(value)) {
            setTitle(value);
            setServerError(null);
        }
    };

    async function handleSubmit(formData: FormData) {
        setServerError(null);
        setIsSubmitting(true);
        onCreatingChange?.(true);

        const res = await createEvent(formData);

        if (res?.success && res.eventId) {
            setIsQuotaExceeded(false);
            setIsOpen(false);
            setTitle("");
            router.push(`/dashboard/event/${res.eventId}`);
        } else {
            if (res?.error && res.error.toLowerCase().includes("límite")) {
                setIsQuotaExceeded(true);
            } else {
                setServerError(res?.error || "Ha ocurrido un error al crear el evento.");
            }
        }

        setIsSubmitting(false);
        onCreatingChange?.(false);
    }

    const closeModal = () => {
        if (isSubmitting) return; // Evitar cerrar mientras envía
        setIsOpen(false);
        setIsQuotaExceeded(false);
        setServerError(null);
    };

    return (
        <>
            {/* Botón principal que abre el modal */}
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer"
            >
                <Plus size={20} /> Nuevo Evento
            </button>

            {/* MODAL PRINCIPAL */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        {/* Botón cerrar */}
                        <button
                            onClick={closeModal}
                            className="absolute right-4 top-4 text-gray-400 hover:text-white"
                            disabled={isSubmitting}
                        >
                            <X size={18} />
                        </button>

                        {/* CASO: LÍMITE ALCANZADO → UPGRADE */}
                        {isQuotaExceeded ? (
                            <>
                                <h4 className="text-xl font-bold text-indigo-400 mb-4 pb-2 border-b border-indigo-600">
                                    Límite alcanzado
                                </h4>
                                <p className="text-white mb-6 text-sm">
                                    Has llegado al número máximo de eventos para tu plan actual.
                                    <br />
                                    Para crear más eventos, necesitas unirte a{" "}
                                    <b>{isPremium ? "Premium+" : "Premium"}</b>.
                                </p>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                                        disabled={loadingPremium}
                                    >
                                        Cerrar
                                    </button>
                                    <Link
                                        href="/premium"
                                        onClick={() => setLoadingPremium(true)}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold transition-colors text-center flex justify-center items-center disabled:opacity-50"
                                    >
                                        {loadingPremium ? (
                                            <Bouncy size="28" speed="1.75" color="#fff" />
                                        ) : (
                                            "Unirme ahora"
                                        )}
                                    </Link>
                                </div>
                            </>
                        ) : (
                            /* CASO NORMAL: FORMULARIO DE CREACIÓN */
                            <>
                                <h2 className="text-xl font-bold text-white mb-4">
                                    Crear Nuevo Evento
                                </h2>

                                <form action={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">
                                            Nombre del Evento
                                        </label>
                                        <input
                                            name="title"
                                            required
                                            maxLength={40}
                                            value={title}
                                            onChange={handleTitleChange}
                                            placeholder="Ej: Premios Verano 2025"
                                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                            autoFocus
                                            disabled={isSubmitting}
                                        />
                                        <p className="text-[10px] text-gray-600 mt-1">
                                            Solo letras, números y puntuación básica.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">
                                            Descripción
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            maxLength={100}
                                            placeholder="¿De qué va esta gala?"
                                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors resize-none"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">
                                            Etiquetas
                                        </label>
                                        <input
                                            name="tags"
                                            maxLength={50}
                                            placeholder="Etiquetas separadas por comas (ej: cine, amigos, verano)"
                                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                                            disabled={isSubmitting}
                                        />
                                        <p className="text-[10px] text-gray-600 mt-1">
                                            Úsalas para encontrar tu evento más fácilmente.
                                        </p>
                                    </div>

                                    {/* Error del servidor */}
                                    {serverError && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">
                                            {serverError}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting || title.trim().length < 3}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isSubmitting ? (
                                                <Bouncy size="32" speed="1.75" color="#fff" />
                                            ) : (
                                                <>
                                                    <Plus size={18} />
                                                    Crear Evento
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
