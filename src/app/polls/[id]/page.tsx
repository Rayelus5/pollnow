// app/polls/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import VotingForm from "@/components/VotingForm";

// Definimos el tipo de props para Next.js 15
type Props = {
    params: Promise<{ id: string }>
}

export default async function PollPage({ params }: Props) {
    // 1. Esperamos params
    const { id } = await params;

    // 2. Buscamos los datos
    const poll = await prisma.poll.findUnique({
        where: { id },
        include: { options: { orderBy: { order: 'asc' } } },
    });

    // 3. Si no existe, 404
    if (!poll) notFound();

    // 4. Si ya terminó, redirigir a resultados
    const now = new Date();
    if (now > poll.endAt) {
        redirect(`/polls/${id}/results`);
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            {/* Header con degradado */}
            <header className="bg-gradient-to-b from-indigo-600 to-indigo-800 text-white py-12 px-4 rounded-b-[2.5rem] shadow-lg mb-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">{poll.title}</h1>
                    {poll.description && (
                        <p className="text-indigo-100 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">{poll.description}</p>
                    )}
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4">
                {/* Pasamos los datos al componente cliente */}
                <VotingForm poll={poll} />
            </div>
        </main>
    );
}