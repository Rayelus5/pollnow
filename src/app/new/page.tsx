"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPollPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Estado del formulario
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [endDate, setEndDate] = useState("");
    // Manejamos las opciones como un array dinámico
    const [options, setOptions] = useState([{ name: "", imageUrl: "" }, { name: "", imageUrl: "" }]);

    const addOption = () => setOptions([...options, { name: "", imageUrl: "" }]);

    const handleOptionChange = (index: number, field: string, value: string) => {
        const newOptions = [...options];
        // @ts-ignore
        newOptions[index][field] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await fetch("/api/polls", {
            method: "POST",
            body: JSON.stringify({
                title,
                description,
                endAt: endDate,
                options: options.filter(o => o.name.trim() !== "") // Filtrar vacías
            })
        });

        if (res.ok) {
            const data = await res.json();
            router.push(`/polls/${data.id}`); // Redirigir a la nueva encuesta
        } else {
            alert("Error al crear");
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8 text-black">
            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow">
                <h1 className="text-2xl font-bold mb-6">Crear Nueva Encuesta</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block font-semibold mb-1">Título</label>
                        <input
                            required
                            className="w-full p-2 border rounded"
                            value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="Ej: El más fiestero"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-1">Descripción (Opcional)</label>
                        <textarea
                            className="w-full p-2 border rounded"
                            value={description} onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-1">Cierra el día</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full p-2 border rounded"
                            value={endDate} onChange={e => setEndDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-2">Opciones (Participantes)</label>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input
                                    placeholder={`Nombre opción ${idx + 1}`}
                                    className="flex-1 p-2 border rounded"
                                    value={opt.name}
                                    onChange={e => handleOptionChange(idx, 'name', e.target.value)}
                                    required={idx < 2} // Mínimo 2 obligatorias
                                />
                                <input
                                    placeholder="URL Foto (Opcional)"
                                    className="flex-1 p-2 border rounded text-sm"
                                    value={opt.imageUrl}
                                    onChange={e => handleOptionChange(idx, 'imageUrl', e.target.value)}
                                />
                            </div>
                        ))}
                        <button type="button" onClick={addOption} className="text-sm text-indigo-600 font-semibold mt-2">
                            + Añadir otra opción
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? "Creando..." : "Crear Encuesta"}
                    </button>
                </form>
            </div>
        </main>
    );
}