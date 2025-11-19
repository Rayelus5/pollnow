"use client";

import { useState } from "react";
import { updateParticipant, deleteParticipant } from "@/app/admin/actions";
import { Pencil, Trash2, Save, X } from "lucide-react";

type Participant = {
    id: string;
    name: string;
    imageUrl: string | null;
};

export default function ParticipantList({ initialData }: { initialData: Participant[] }) {
    const [editingId, setEditingId] = useState<string | null>(null);

    return (
        <div className="space-y-3">
            {initialData.map((p) => (
                <div key={p.id} className="bg-neutral-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-colors">

                    {editingId === p.id ? (
                        // --- MODO EDICIÓN ---
                        <form
                            action={async (formData) => {
                                await updateParticipant(p.id, formData);
                                setEditingId(null);
                            }}
                            className="flex-1 flex items-center gap-4"
                        >
                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                <span className="text-xs text-gray-500">Img</span>
                            </div>
                            <div className="flex-1 grid gap-2">
                                <input name="name" defaultValue={p.name} className="bg-black border border-white/20 rounded px-2 py-1 text-white text-sm w-full" placeholder="Nombre" required />
                                <input name="imageUrl" defaultValue={p.imageUrl || ""} className="bg-black border border-white/20 rounded px-2 py-1 text-white text-xs w-full" placeholder="URL Imagen" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"><Save size={16} /></button>
                                <button type="button" onClick={() => setEditingId(null)} className="p-2 bg-gray-800 text-gray-400 rounded hover:bg-gray-700"><X size={16} /></button>
                            </div>
                        </form>
                    ) : (
                        // --- MODO VISTA ---
                        <>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden shrink-0">
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{p.name[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-200">{p.name}</h3>
                                    <p className="text-xs text-gray-600 font-mono truncate max-w-[200px]">ID: ...{p.id.slice(-4)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingId(p.id)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition">
                                    <Pencil size={16} />
                                </button>
                                <button onClick={() => deleteParticipant(p.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}