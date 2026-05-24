"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, { parsePhoneNumber, isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Phone, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updatePhone } from "@/app/lib/user-actions";

type Feedback = { type: "success" | "error"; text: string } | null;

export default function PhoneBizumCard({
    initialPrefix,
    initialNumber,
}: {
    initialPrefix: string | null;
    initialNumber: string | null;
}) {
    const router = useRouter();
    const initialValue = initialPrefix && initialNumber ? `${initialPrefix}${initialNumber}` : undefined;
    const [value, setValue] = useState<string | undefined>(initialValue);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>(null);

    async function handleSave() {
        setFeedback(null);

        // Permitir borrar
        if (!value) {
            setSaving(true);
            const res = await updatePhone({ phonePrefix: "", phoneNumber: "" });
            setSaving(false);
            setFeedback(res.error ? { type: "error", text: res.error } : { type: "success", text: res.success! });
            if (res.success) router.refresh();
            return;
        }

        if (!isValidPhoneNumber(value)) {
            setFeedback({ type: "error", text: "El número de teléfono no es válido." });
            return;
        }
        const parsed = parsePhoneNumber(value);
        if (!parsed) {
            setFeedback({ type: "error", text: "No se pudo procesar el número." });
            return;
        }

        setSaving(true);
        const res = await updatePhone({
            phonePrefix: `+${parsed.countryCallingCode}`,
            phoneNumber: parsed.nationalNumber,
        });
        setSaving(false);
        setFeedback(res.error ? { type: "error", text: res.error } : { type: "success", text: res.success! });
        if (res.success) router.refresh();
    }

    return (
        <div className="bg-neutral-900/60 border-2 border-white/10 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-1">
                <Phone size={18} className="text-blue-400" /> Número de teléfono (para Bizum)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
                Este número debe tener Bizum asociado para poder recibir recompensas.
            </p>

            <PhoneInput
                international
                defaultCountry="ES"
                value={value}
                onChange={setValue}
                className="phone-input-dark"
                placeholder="612 345 678"
            />

            {feedback && (
                <div className={`flex items-center gap-2 text-sm mt-3 ${feedback.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    {feedback.text}
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar teléfono
            </button>
        </div>
    );
}
