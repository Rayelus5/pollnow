"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createEventPoll, updateEventPoll, deleteEventPoll, reorderEventPolls } from "@/app/lib/event-actions";
import { GripVertical, Pencil, Trash2, X, Plus } from "lucide-react";
import { format, isValid } from "date-fns"; // <--- IMPORTANTE: Añadido isValid

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

export default function PollList({
    initialPolls,
    allParticipants,
    eventId
}: {
    initialPolls: Poll[],
    allParticipants: Participant[],
    eventId: string
}) {
    const [polls, setPolls] = useState(initialPolls);
    const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => { setPolls(initialPolls); }, [initialPolls]);

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(polls);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setPolls(items);

        const updates = items.map((item, index) => ({ id: item.id, order: index }));
        await reorderEventPolls(updates, eventId);
    };

    return (
        <>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Orden de Categorías</h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                    <Plus size={14} /> Nueva Categoría
                </button>
            </div>

            {/* LISTA */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="polls">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {polls.map((poll, index) => {

                                // --- CORRECCIÓN DE FECHA BLINDADA ---
                                const endDate = new Date(poll.endAt);
                                const dateString = isValid(endDate)
                                    ? format(endDate, 'dd/MM/yyyy')
                                    : 'Fecha pendiente';
                                // ------------------------------------

                                return (
                                    <Draggable key={poll.id} draggableId={poll.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="bg-neutral-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-blue-500/30 transition-colors"
                                            >
                                                <div {...provided.dragHandleProps} className="text-gray-600 hover:text-white cursor-grab active:cursor-grabbing">
                                                    <GripVertical size={20} />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-white">{poll.title}</h3>
                                                        <span className="text-xs font-mono text-gray-600">#{index + 1}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 line-clamp-1">{poll.description}</p>
                                                    <div className="flex gap-4 mt-2 text-[10px] text-gray-500 font-mono">
                                                        <span>Votos: {poll._count.votes}</span>
                                                        {/* Mostrar solo si existe fecha */}
                                                        {poll.endAt && isValid(new Date(poll.endAt)) && (
                                                            <span>Cierra: {format(new Date(poll.endAt), 'dd/MM/yyyy')}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingPoll(poll)} className="p-3 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 cursor-pointer">
                                                        <Pencil size={20} />
                                                    </button>
                                                    <form action={deleteEventPoll.bind(null, poll.id, eventId)}>
                                                        <button className="p-3 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 cursor-pointer">
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                )
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* MODAL UNIFICADO (CREAR / EDITAR) */}
            {(editingPoll || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {isCreating ? "Nueva Categoría" : "Editar Categoría"}
                            </h2>
                            <button onClick={() => { setEditingPoll(null); setIsCreating(false); }}>
                                <X className="text-gray-400 hover:text-white cursor-pointer" />
                            </button>
                        </div>

                        <form
                            action={async (formData) => {
                                if (isCreating) {
                                    await createEventPoll(eventId, formData);
                                } else if (editingPoll) {
                                    await updateEventPoll(editingPoll.id, eventId, formData);
                                }
                                setEditingPoll(null);
                                setIsCreating(false);
                            }}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Título</label>
                                <input
                                    name="title"
                                    defaultValue={editingPoll?.title || ""}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    defaultValue={editingPoll?.description || ""}
                                    rows={2}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            {/* <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Fecha de Cierre (Opcional)</label>
                                <input 
                                    name="endAt" 
                                    type="datetime-local" 
                                    defaultValue={editingPoll && editingPoll.endAt && isValid(new Date(editingPoll.endAt)) ? new Date(editingPoll.endAt).toISOString().slice(0, 16) : ""} 
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white dark-calendar" 
                                    // QUITAMOS 'required'
                                />
                                <p className="text-[10px] text-gray-600 mt-1">Si lo dejas vacío, la votación seguirá abierta hasta la gala.</p>
                            </div> */}

                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-3">Nominados</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                    {allParticipants.map(p => {
                                        const isSelected = editingPoll
                                            ? editingPoll.options.some(opt => opt.participantId === p.id)
                                            : false;

                                        return (
                                            <label key={p.id} className="flex items-center gap-2 p-2 rounded border border-white/5 hover:bg-white/5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="participantIds"
                                                    value={p.id}
                                                    defaultChecked={isSelected}
                                                    className="accent-blue-500 w-4 h-4"
                                                />
                                                <span className="text-sm text-gray-300 truncate">{p.name}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                                {allParticipants.length === 0 && (
                                    <p className="text-xs text-red-400 mt-2">⚠️ Crea participantes primero en la otra pestaña.</p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setEditingPoll(null); setIsCreating(false); }}
                                    className="flex-1 py-3 bg-gray-800 rounded text-white font-bold hover:bg-gray-700 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-400 cursor-pointer"
                                >
                                    {isCreating ? "Crear" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}