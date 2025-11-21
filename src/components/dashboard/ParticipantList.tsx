"use client";

import { useState } from "react";
import { updateEventParticipant, deleteEventParticipant, createEventParticipant } from "@/app/lib/event-actions";
import { Pencil, Trash2, Save, X, Plus } from "lucide-react";

type Participant = {
    id: string;
    name: string;
    imageUrl: string | null;
};

export default function ParticipantList({
    initialData,
    eventId
}: {
    initialData: Participant[],
    eventId: string
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="space-y-4">

            {/* HEADER CON BOTÓN CREAR */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Lista de Nominados</h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                    <Plus size={14} /> Añadir Nuevo
                </button>
            </div>

            {/* FORMULARIO DE CREACIÓN (Aparece al principio) */}
            {isCreating && (
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <form
                        action={async (formData) => {
                            await createEventParticipant(eventId, formData);
                            setIsCreating(false);
                        }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">?</div>
                        <div className="flex-1 grid gap-2">
                            <input name="name" autoFocus className="bg-black border border-blue-500/30 rounded px-3 py-2 text-white text-sm w-full focus:border-blue-500 outline-none" placeholder="Nombre del participante..." required />
                            <input name="imageUrl" className="bg-black border border-blue-500/30 rounded px-3 py-2 text-white text-xs w-full focus:border-blue-500 outline-none" placeholder="https://foto.com/avatar.jpg" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 cursor-pointer">Guardar</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-transparent text-gray-400 rounded text-xs hover:text-white cursor-pointer">Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* LISTA EXISTENTE */}
            {initialData.map((p) => (
                <div key={p.id} className="bg-neutral-900/50 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-colors cursor-pointer">

                    {editingId === p.id ? (
                        // MODO EDICIÓN
                        <form
                            action={async (formData) => {
                                await updateEventParticipant(p.id, eventId, formData);
                                setEditingId(null);
                            }}
                            className="flex-1 flex items-center gap-4"
                        >
                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                {p.imageUrl && <img src={p.imageUrl} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 grid gap-2">
                                <input name="name" defaultValue={p.name} className="bg-black border border-white/20 rounded px-2 py-1 text-white text-sm w-full" required />
                                <input name="imageUrl" defaultValue={p.imageUrl || ""} className="bg-black border border-white/20 rounded px-2 py-1 text-white text-xs w-full" placeholder="URL Imagen" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="p-4 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 cursor-pointer"><Save size={20} /></button>
                                <button type="button" onClick={() => setEditingId(null)} className="p-4 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 cursor-pointer"><X size={20} /></button>
                            </div>
                        </form>
                    ) : (
                        // MODO VISTA
                        <>
                            <div className="flex items-center gap-4 cursor-pointer ">
                                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">{p.name.substring(0, 2).toUpperCase()}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-200">{p.name}</h3>
                                    {p.imageUrl && <span className="text-[10px] text-green-500 bg-green-900/20 px-1.5 py-0.5 rounded">Con Foto</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingId(p.id)} className="p-4 text-blue-400 hover:bg-blue-400/10 rounded transition cursor-pointer">
                                    <Pencil size={20} />
                                </button>
                                <form action={deleteEventParticipant.bind(null, p.id, eventId)}>
                                    <button className="p-4 text-red-400 hover:bg-red-400/10 rounded transition cursor-pointer">
                                        <Trash2 size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {initialData.length === 0 && !isCreating && (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-gray-600 text-sm">
                    No hay participantes. Añade a tus amigos para empezar.
                </div>
            )}
        </div>
    );
}