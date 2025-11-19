"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { updatePoll, deletePoll, reorderPolls } from "@/app/admin/actions";
import { GripVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";

type Participant = { id: string; name: string };
type Poll = {
    id: string;
    title: string;
    description: string | null;
    endAt: Date;
    isPublished: boolean;
    _count: { votes: number };
    options: { participantId: string }[];
};

export default function PollList({ initialPolls, allParticipants }: { initialPolls: Poll[], allParticipants: Participant[] }) {
    const [polls, setPolls] = useState(initialPolls);
    const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

    // Sincronizar estado si initialPolls cambia (ej: al crear una nueva)
    useEffect(() => { setPolls(initialPolls); }, [initialPolls]);

    // --- LÓGICA DRAG & DROP ---
    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(polls);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setPolls(items); // Actualizar UI instantáneamente (Optimistic UI)

        // Calcular nuevos órdenes y enviar al servidor
        const updates = items.map((item, index) => ({
            id: item.id,
            order: index
        }));
        await reorderPolls(updates);
    };

    return (
        <>
            {/* LISTA DRAGGABLE */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="polls">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {polls.map((poll, index) => (
                                <Draggable key={poll.id} draggableId={poll.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="bg-neutral-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-white/20"
                                        >
                                            {/* Handle para arrastrar */}
                                            <div {...provided.dragHandleProps} className="text-gray-600 hover:text-white cursor-grab active:cursor-grabbing">
                                                <GripVertical size={20} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-white">{poll.title}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${poll.isPublished ? 'bg-green-900/30 text-green-400' : 'bg-gray-800'}`}>
                                                        {poll.isPublished ? 'Activa' : 'Draft'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-1">{poll.description}</p>
                                                <div className="flex gap-4 mt-2 text-[10px] text-gray-500 font-mono">
                                                    <span>Votos: {poll._count.votes}</span>
                                                    <span>Fin: {format(new Date(poll.endAt), 'dd/MM/yyyy')}</span>
                                                </div>
                                            </div>

                                            {/* Botones de Acción */}
                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingPoll(poll)} className="p-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => deletePoll(poll.id)} className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* MODAL DE EDICIÓN */}
            {editingPoll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Editar Encuesta</h2>
                            <button onClick={() => setEditingPoll(null)}><X className="text-gray-400 hover:text-white" /></button>
                        </div>

                        <form
                            action={async (formData) => {
                                await updatePoll(editingPoll.id, formData);
                                setEditingPoll(null);
                            }}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Título</label>
                                <input name="title" defaultValue={editingPoll.title} className="w-full bg-black border border-white/20 rounded p-2 text-white" required />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Descripción</label>
                                <textarea name="description" defaultValue={editingPoll.description || ""} rows={2} className="w-full bg-black border border-white/20 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Fecha Fin</label>
                                {/* Truco para formatear la fecha para input datetime-local */}
                                <input
                                    name="endAt"
                                    type="datetime-local"
                                    defaultValue={new Date(editingPoll.endAt).toISOString().slice(0, 16)}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white dark-calendar"
                                    required
                                />
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <label className="text-xs text-gray-500 uppercase block mb-3">Nominados</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                    {allParticipants.map(p => {
                                        const isSelected = editingPoll.options.some(opt => opt.participantId === p.id);
                                        return (
                                            <label key={p.id} className="flex items-center gap-2 p-2 rounded border border-white/5 hover:bg-white/5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="participantIds"
                                                    value={p.id}
                                                    defaultChecked={isSelected}
                                                    className="accent-blue-500"
                                                />
                                                <span className="text-sm text-gray-300 truncate">{p.name}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setEditingPoll(null)} className="flex-1 py-3 bg-gray-800 rounded text-white font-bold">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-500 text-black rounded font-bold hover:bg-blue-400">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}