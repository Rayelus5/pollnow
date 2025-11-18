// __tests__/results.test.ts
import { calculateResults } from '../lib/countResults';

test('calcula correctamente los votos y el ganador', () => {
    const options = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
    // 3 votos: Dos para A, uno para B
    const voteOptions = [
        { optionId: '1' }, { optionId: '1' }, { optionId: '2' }
    ];

    const results = calculateResults(options, voteOptions);

    expect(results[0].id).toBe('1'); // Ganador A
    expect(results[0].votes).toBe(2);
    expect(results[1].votes).toBe(1);
});