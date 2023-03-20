import concurrently from 'concurrently';

const { result } = concurrently([
    { command: 'node ./generalServer.js', name: 'GeneralServer' },
    { command: 'node ./generalClient.js', name: 'GeneralClient' },
], {
    prefix: 'name',
    killOthers: ['failure'],
    restartTries: 0,
    cwd: './'
});

result.then(
    success => console.log(`Processos finalizados com sucesso.`),
    failure => console.log("Erro na execução."),
);
