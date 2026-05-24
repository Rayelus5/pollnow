'use client';

import { useActionState, useState } from 'react';
import { submitBugReport } from '@/app/lib/bug-actions';
import { CheckCircle2, Bug, Upload } from 'lucide-react';

const SEVERITIES = [
    { value: 'LOW', label: '🔵 Baja — visual / texto / UX' },
    { value: 'MEDIUM', label: '🟡 Media — funcionalidad rota' },
    { value: 'HIGH', label: '🟠 Alta — afecta flujos clave' },
    { value: 'CRITICAL', label: '🔴 Crítica — seguridad / datos' },
];

const inputClass =
    'w-full p-3.5 rounded-xl bg-white/5 border-2 border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all';

export default function BugBountyForm() {
    const [resetKey, setResetKey] = useState(0);
    return <BugForm key={resetKey} onReset={() => setResetKey((k) => k + 1)} />;
}

function BugForm({ onReset }: { onReset: () => void }) {
    const [state, dispatch, isPending] = useActionState(submitBugReport, undefined);
    const [descLen, setDescLen] = useState(0);

    if (state?.success) {
        return (
            <div className="text-center space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
                    <CheckCircle2 size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">¡Reporte recibido!</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Tu reporte ha sido recibido. Te contactaremos si es elegible para recompensa.
                    </p>
                </div>
                <button
                    onClick={onReset}
                    className="text-sm text-blue-500 hover:text-blue-400 font-bold cursor-pointer"
                >
                    Reportar otro bug
                </button>
            </div>
        );
    }

    return (
        <form action={dispatch} className="space-y-5">
            <div className="space-y-2">
                <label htmlFor="title" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Título
                </label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    maxLength={100}
                    required
                    placeholder="Resumen breve del problema"
                    defaultValue={state?.values?.title ?? ''}
                    className={inputClass}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="severity" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Severidad
                </label>
                <select
                    id="severity"
                    name="severity"
                    required
                    defaultValue={state?.values?.severity ?? ''}
                    className={inputClass}
                >
                    <option value="" disabled>Selecciona la severidad…</option>
                    {SEVERITIES.map((s) => (
                        <option key={s.value} value={s.value} className="bg-neutral-900">{s.label}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label htmlFor="pageUrl" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    URL o página donde ocurre
                </label>
                <input
                    id="pageUrl"
                    name="pageUrl"
                    type="text"
                    required
                    placeholder="https://pollnow.es/..."
                    defaultValue={state?.values?.pageUrl ?? ''}
                    className={inputClass}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="description" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Descripción detallada
                </label>
                <textarea
                    id="description"
                    name="description"
                    required
                    minLength={30}
                    maxLength={2000}
                    rows={6}
                    placeholder="Pasos para reproducir, qué esperabas y qué ocurrió. Mínimo 30 caracteres."
                    defaultValue={state?.values?.description ?? ''}
                    onChange={(e) => setDescLen(e.target.value.length)}
                    className={inputClass}
                />
                <p className="text-[10px] text-gray-500 ml-1 text-right">{descLen} / 2000</p>
            </div>

            <div className="space-y-2">
                <label htmlFor="screenshot" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Captura de pantalla <span className="text-gray-600 normal-case">(opcional)</span>
                </label>
                <div className="flex items-center gap-2 text-gray-500 text-xs ml-1 mb-1">
                    <Upload size={12} /> JPG, PNG o WEBP · máx 5MB
                </div>
                <input
                    id="screenshot"
                    name="screenshot"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:font-bold file:cursor-pointer hover:file:bg-white/20"
                />
            </div>

            {state?.error && (
                <div className="p-3 bg-red-500/10 border-2 border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                    <Bug className="w-4 h-4 shrink-0" />
                    <p>{state.error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isPending ? 'Enviando…' : 'Enviar reporte'}
            </button>
        </form>
    );
}
