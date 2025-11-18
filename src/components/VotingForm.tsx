"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Countdown from "./Countdown";
import { clsx } from "clsx"; // Asegúrate de haber instalado clsx en el paso 1

// Tipos necesarios para las props
type PollWithOptions = {
    id: string;
    votingType: "SINGLE" | "MULTIPLE" | "LIMITED_MULTIPLE" | "SUBSET" | string;
    maxChoices: number | null;
    endAt: Date;
    options: { id: string; name: string; imageUrl: string | null; subtitle: string | null }[];
};

export default function VotingForm({ poll }: { poll: PollWithOptions }) {
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Maneja la lógica de selección (Single vs Multiple)
    const handleSelect = (id: string) => {
        if (poll.votingType === "SINGLE") {
            // Si es único, reemplazamos la selección
            setSelected([id]);
        } else {
            // Si es múltiple
            if (selected.includes(id)) {
                setSelected(selected.filter((s) => s !== id));
            } else {
                // Validar límite si existe
                if (poll.maxChoices && selected.length >= poll.maxChoices) return;
                setSelected([...selected, id]);
            }
        }
    };

    // Enviar el voto a la API
    const handleSubmit = async () => {
        if (selected.length === 0) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/polls/${poll.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ optionIds: selected }),
            });

            if (res.ok) {
                // Guardamos localmente que ya votó (UX simple)
                localStorage.setItem(`voted_${poll.id}`, "true");
                router.push(`/polls/${poll.id}/results`);
            } else {
                const json = await res.json();
                alert(json.error || "Error al enviar voto");
                setLoading(false);
            }
        } catch (error) {
            alert("Error de conexión");
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Barra de estado / Countdown */}
            <div className="flex flex-col items-center justify-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tiempo restante</span>
                <Countdown targetDate={new Date(poll.endAt)} onEnd={() => router.refresh()} />
            </div>

            {/* Grid de Opciones */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-24">
                {poll.options.map((opt) => {
                    const isSelected = selected.includes(opt.id);
                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleSelect(opt.id)}
                            className={clsx(
                                "relative group p-4 rounded-2xl border-2 transition-all duration-200 ease-in-out text-left hover:shadow-lg flex flex-col items-center",
                                isSelected
                                    ? "border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100 scale-105 z-10"
                                    : "border-gray-200 bg-white hover:border-indigo-300"
                            )}
                        >
                            {/* Avatar / Imagen */}
                            <div className={clsx(
                                "aspect-square rounded-full overflow-hidden mb-4 w-24 h-24 md:w-32 md:h-32 object-cover shadow-inner",
                                isSelected ? "ring-2 ring-indigo-500 ring-offset-2" : "bg-gray-100"
                            )}>
                                {opt.imageUrl ? (
                                    <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-bold bg-gray-100">
                                        {opt.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <h3 className="font-bold text-gray-900 text-center leading-tight">{opt.name}</h3>
                            {opt.subtitle && <p className="text-xs text-center text-gray-500 mt-1">{opt.subtitle}</p>}

                            {/* Checkmark icon si está seleccionado */}
                            {isSelected && (
                                <div className="absolute top-3 right-3 bg-indigo-600 text-white rounded-full p-1 shadow-md animate-bounce-short">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Botón Flotante Inferior */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none">
                <button
                    onClick={handleSubmit}
                    disabled={loading || selected.length === 0}
                    className="pointer-events-auto bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center gap-2"
                >
                    {loading ? (
                        <span>Enviando...</span>
                    ) : (
                        <>
                            <span>Votar por {selected.length} opción(es)</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}