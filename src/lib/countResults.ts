// lib/countResults.ts

interface OptionResult {
    id: string;
    name: string;
    votes: number;
    percentage: number;
}

export function calculateResults(options: any[], voteOptions: any[]): OptionResult[] {
    const totalVotes = voteOptions.length;

    // 1. Contar votos por opción
    const counts: Record<string, number> = {};
    voteOptions.forEach((vo) => {
        counts[vo.optionId] = (counts[vo.optionId] || 0) + 1;
    });

    // 2. Mapear a estructura de resultado
    const results = options.map((opt) => {
        const count = counts[opt.id] || 0;
        return {
            id: opt.id,
            name: opt.name,
            votes: count,
            percentage: totalVotes === 0 ? 0 : (count / totalVotes) * 100,
        };
    });

    // 3. Ordenar descendente (mayor puntaje primero)
    return results.sort((a, b) => b.votes - a.votes);
}