"use client";

import { useState } from "react";
import { Flag, AlertTriangle, X } from "lucide-react";
import { createReport } from "@/app/lib/public-actions"; // Crearemos esta acción
import { Bouncy } from 'ldrs/react';

if (typeof window !== 'undefined') import('ldrs/bouncy');

export default function ReportButton({ eventId }: { eventId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState("SPAM");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await createReport(eventId, reason, details);
        setLoading(false);
        setSent(true);
        setTimeout(() => {
            setIsOpen(false);
            setSent(false);
            setDetails("");
        }, 2000);
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"
                title="Reportar Evento"
            >
                <Flag size={16} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        
                        {!sent ? (
                            <form onSubmit={handleSubmit}>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="text-red-500" size={20} /> Reportar Contenido
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo</label>
                                        <select 
                                            value={reason} 
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-white text-sm outline-none focus:border-red-500"
                                        >
                                            <option value="SPAM">Spam o Publicidad</option>
                                            <option value="INAPPROPRIATE_CONTENT">Contenido Inapropiado / Ofensivo</option>
                                            <option value="HARASSMENT">Acoso o Bullying</option>
                                            <option value="SCAM">Estafa o Fraude</option>
                                            <option value="OTHER">Otro</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Detalles</label>
                                        <textarea 
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                            rows={3}
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white text-sm outline-none focus:border-red-500 resize-none"
                                            placeholder="Describe brevemente el problema..."
                                            required
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Bouncy size="20" color="white" /> : "Enviar Reporte"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={24} />
                                </div>
                                <h3 className="text-white font-bold">¡Reporte Enviado!</h3>
                                <p className="text-gray-400 text-sm mt-2">Gracias por ayudarnos a mantener la comunidad segura.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

import { Check } from "lucide-react";