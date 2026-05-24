"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Mail, Gift, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateBugReport, markBugRewarded, sendBugUserEmail } from "@/app/lib/bug-actions";
import { BugStatus } from "@prisma/client";
import { STATUS_LABEL } from "@/components/admin/bugBadges";

const STATUS_OPTIONS: BugStatus[] = ["PENDING", "REVIEWING", "ACCEPTED", "REJECTED", "REWARDED"];

type Feedback = { type: "success" | "error"; text: string } | null;

export default function BugDetailClient({
    id,
    initialStatus,
    initialNotes,
}: {
    id: string;
    initialStatus: BugStatus;
    initialNotes: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [status, setStatus] = useState<BugStatus>(initialStatus);
    const [notes, setNotes] = useState(initialNotes);
    const [feedback, setFeedback] = useState<Feedback>(null);

    const [emailSubject, setEmailSubject] = useState("Re: Tu reporte de bug en Pollnow");
    const [emailBody, setEmailBody] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);

    function handleSave() {
        setFeedback(null);
        startTransition(async () => {
            const res = await updateBugReport(id, { status, adminNotes: notes });
            if (res.error) setFeedback({ type: "error", text: res.error });
            else {
                setFeedback({ type: "success", text: "Cambios guardados." });
                router.refresh();
            }
        });
    }

    function handleReward() {
        setFeedback(null);
        startTransition(async () => {
            const res = await markBugRewarded(id);
            if (res.error) setFeedback({ type: "error", text: res.error });
            else {
                setStatus("REWARDED");
                setFeedback({ type: "success", text: "Marcado como REWARDED." });
                router.refresh();
            }
        });
    }

    async function handleSendEmail() {
        setEmailFeedback(null);
        if (emailBody.trim().length < 5) {
            setEmailFeedback({ type: "error", text: "Escribe un mensaje." });
            return;
        }
        setSendingEmail(true);
        const res = await sendBugUserEmail(id, emailSubject, emailBody);
        setSendingEmail(false);
        if (res.error) setEmailFeedback({ type: "error", text: res.error });
        else {
            setEmailFeedback({ type: "success", text: "Email enviado al usuario." });
            setEmailBody("");
        }
    }

    return (
        <div className="space-y-5">
            {/* Gestión de estado y notas */}
            <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Gestión del reporte</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bug-status" className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Estado</label>
                        <select
                            id="bug-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as BugStatus)}
                            className="w-full p-2.5 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s} className="bg-neutral-900">{STATUS_LABEL[s]}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="bug-notes" className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">
                        Notas internas <span className="normal-case text-gray-600">(no visibles para el usuario)</span>
                    </label>
                    <textarea
                        id="bug-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Anotaciones para el equipo…"
                        className="w-full p-3 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none"
                    />
                </div>

                {feedback && (
                    <div className={`flex items-center gap-2 text-sm ${feedback.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                        {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        {feedback.text}
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                    >
                        {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar cambios
                    </button>

                    {status === "ACCEPTED" && (
                        <button
                            onClick={handleReward}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 text-indigo-300 border-2 border-indigo-500/30 rounded-lg text-sm font-bold hover:bg-indigo-500/20 disabled:opacity-50 cursor-pointer"
                        >
                            <Gift size={15} /> Marcar como REWARDED
                        </button>
                    )}
                </div>

                {status === "REWARDED" && (
                    <div className="flex items-start gap-2 p-3 rounded-lg border-2 border-indigo-500/20 bg-indigo-500/5 text-indigo-200/90 text-xs">
                        <Gift size={15} className="shrink-0 mt-0.5 text-indigo-400" />
                        Recuerda asignar la suscripción manualmente desde el perfil del usuario.
                    </div>
                )}
            </div>

            {/* Email al usuario */}
            <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Mail size={16} /> Enviar email al usuario</h3>

                <div>
                    <label htmlFor="email-subject" className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Asunto</label>
                    <input
                        id="email-subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label htmlFor="email-body" className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Mensaje</label>
                    <textarea
                        id="email-body"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={5}
                        placeholder="Escribe el mensaje que recibirá el usuario por email…"
                        className="w-full p-3 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none"
                    />
                </div>

                {emailFeedback && (
                    <div className={`flex items-center gap-2 text-sm ${emailFeedback.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                        {emailFeedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        {emailFeedback.text}
                    </div>
                )}

                <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
                >
                    {sendingEmail ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Enviar email
                </button>
            </div>
        </div>
    );
}
