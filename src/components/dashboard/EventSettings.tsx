"use client";

import { useState } from "react";
import { updateEvent, deleteEvent } from "@/app/lib/event-actions";
import { Save, Trash2, AlertTriangle } from "lucide-react";

type EventData = {
    id: string;
    title: string;
    description: string | null;
    galaDate: Date | null;
    isPublic: boolean;
    slug: string;
};

export default function EventSettings({ event }: { event: EventData }) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Formatear fecha para input datetime-local de forma segura
    const defaultDate = event.galaDate
        ? new Date(event.galaDate).toISOString().slice(0, 16)
        : "";

    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteEvent(event.id);
        // No ponemos setIsDeleting(false) porque seremos redirigidos
    };

    return (
        <div className="max-w-2xl space-y-8">

            {/* 1. FORMULARIO GENERAL */}
            <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-6">Configuración General</h2>

                <form action={async (formData) => await updateEvent(event.id, formData)} className="space-y-6">

                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2">Nombre del Evento</label>
                        <input
                            name="title"
                            defaultValue={event.title}
                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-2">Descripción</label>
                        <textarea
                            name="description"
                            defaultValue={event.description || ""}
                            rows={3}
                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">Fecha de la Gala</label>
                            <input
                                type="datetime-local"
                                name="galaDate"
                                defaultValue={defaultDate}
                                className="w-full bg-black border border-white/20 rounded p-3 text-white dark-calendar"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Los resultados se revelarán en esta fecha.</p>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">Visibilidad</label>
                            <label className="flex items-center gap-3 p-3 border border-white/10 rounded bg-black cursor-pointer hover:border-white/30 transition-colors">
                                <input
                                    type="checkbox"
                                    name="isPublic"
                                    defaultChecked={event.isPublic}
                                    className="accent-blue-500 w-5 h-5"
                                />
                                <span className="text-sm text-gray-300">Evento Público</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-transform active:scale-95">
                            <Save size={18} /> Guardar Cambios
                        </button>
                    </div>

                </form>
            </div>

            {/* 2. ZONA DE ENLACES */}
            <div className="p-6 border border-blue-500/20 bg-blue-500/5 rounded-2xl">
                <h3 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-wider">Enlace de Invitación</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 bg-black/50 p-3 rounded border border-white/10 text-sm text-gray-400 font-mono truncate select-all">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.slug}`}
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/e/${event.slug}`);
                            alert("¡Enlace copiado!");
                        }}
                        className="text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors"
                    >
                        Copiar
                    </button>
                </div>
            </div>

            {/* 3. ZONA DE PELIGRO (ELIMINAR) */}
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                <h3 className="text-sm font-bold text-red-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={16} /> Zona de Peligro
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    Eliminar este evento borrará permanentemente todas las encuestas, participantes y votos asociados. Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="text-xs font-bold text-red-200 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Eliminar Evento
                    </button>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-red-500">
                        <h2 className="text-xl font-bold text-white mb-2">¿Estás absolutamente seguro?</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Vas a eliminar <strong>{event.title}</strong>. Todos los datos se perderán para siempre.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors"
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}