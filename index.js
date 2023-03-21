import concurrently from 'concurrently';
import { get80PercentRandom } from './helpers.js';

const { result } = concurrently([
    { command: 'node ./generalServer.js', name: 'GeneralServer' },
    { command: 'node ./generalClient.js', name: 'GeneralClient' },
], {
    prefix: 'name',
    restartTries: 0,
    cwd: './'
});

const calculateResult = (failure) => {
    const totalSoldiers = failure.reduce((prev, curr) => prev + curr.exitCode, 0);

    if (totalSoldiers > 180) {
        return `Cidade tomada com ${totalSoldiers}. Sucesso.`;
    } else if (totalSoldiers >= 150 && totalSoldiers <= 180) {
        return get80PercentRandom() ? `Tudo friamente calculado: ${totalSoldiers} soldados.` : `Deu ruim com ${totalSoldiers} soldados.`;
    }

    return `Falharam miseravelmente com ${totalSoldiers} soldados.`;
}

result.then(
    success => console.log(success),
    // Needs to be failure because the number of used soldiers is returned in the exit code of the process
    failure => console.log(calculateResult(failure)),
);
