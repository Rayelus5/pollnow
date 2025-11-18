import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale"; // Asegúrate de npm install date-fns

// Forzamos que esta página siempre busque datos frescos
export const dynamic = "force-dynamic";

export default async function Home() {
  // Obtenemos encuestas ordenadas por fecha de creación
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    where: { isPublished: true } // Solo las públicas
  });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Amigo del Año 🏆
            </h1>
            <p className="text-gray-500 mt-2">Premios y encuestas para grupos legendarios.</p>
          </div>
          <Link 
            href="/new"
            className="bg-gray-900 text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-gray-800 transition"
          >
            + Crear Nueva
          </Link>
        </header>

        {/* Grid de Encuestas */}
        <div className="grid md:grid-cols-2 gap-6">
          {polls.map((poll) => {
            const isEnded = new Date() > poll.endAt;
            
            return (
              <Link 
                key={poll.id} 
                href={isEnded ? `/polls/${poll.id}/results` : `/polls/${poll.id}`}
                className="block group"
              >
                <article className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isEnded ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                    }`}>
                      {isEnded ? "Finalizada" : "Activa"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(poll.createdAt, { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {poll.title}
                  </h2>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow">
                    {poll.description || "Sin descripción"}
                  </p>

                  <div className="text-indigo-600 font-semibold text-sm flex items-center gap-2">
                    {isEnded ? "Ver Resultados" : "Votar ahora"} 
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </article>
              </Link>
            );
          })}

          {polls.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-400 text-lg mb-4">No hay encuestas activas</p>
              <Link href="/new" className="text-indigo-600 font-bold hover:underline">
                ¡Crea la primera!
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}