// app/polls/[id]/results/page.tsx
import { prisma } from "@/lib/prisma";
import { calculateResults } from "@/lib/countResults"; // Usamos la lógica que creamos antes
import Link from "next/link";

type Props = {
    params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: Props) {
    const { id } = await params;

    // 1. Obtener datos con todas las relaciones necesarias
    const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
            options: true,
            votes: {
                include: { voteOptions: true } // Necesitamos esto para contar
            }
        }
    });

    if (!poll) return <div>Encuesta no encontrada</div>;

    // 2. Aplanar y calcular (Server-side calculation)
    const allVoteOptions = poll.votes.flatMap(v => v.voteOptions);
    const results = calculateResults(poll.options, allVoteOptions);
    const totalVotes = poll.votes.length;

    // 3. Identificar ganador(es)
    const maxVotes = Math.max(...results.map(r => r.votes));
    const winners = results.filter(r => r.votes === maxVotes && r.votes > 0);

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.title}</h1>
                    <p className="text-gray-500">Resultados Finales • Total votos: {totalVotes}</p>
                </div>

                {/* Ganador destacado (solo si hay votos) */}
                {winners.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 border border-yellow-200 rounded-2xl p-8 mb-8 text-center shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
                        <span className="text-4xl mb-4 block">🏆</span>
                        <h2 className="text-2xl font-bold text-yellow-800 mb-1">¡Ganador!</h2>
                        <div className="text-3xl font-black text-gray-900 mt-2">
                            {winners.map(w => w.name).join(" y ")}
                        </div>
                    </div>
                )}

                {/* Lista de Resultados con Barras */}
                <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    {results.map((result, index) => (
                        <div key={result.id} className="relative">
                            <div className="flex justify-between items-end mb-1">
                                <span className="font-bold text-gray-700">
                                    {index + 1}. {result.name}
                                </span>
                                <span className="text-sm text-gray-500 font-mono">
                                    {result.votes} votos ({Math.round(result.percentage)}%)
                                </span>
                            </div>

                            {/* Barra de fondo */}
                            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                                {/* Barra de progreso animada */}
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${winners.some(w => w.id === result.id) ? 'bg-yellow-400' : 'bg-indigo-500'
                                        }`}
                                    style={{ width: `${result.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}