# Problema dos 2 generais em sistema distribuído

Aluno: Hugo Brandão - Matrícula 640727

Este projeto foi feito para a disciplina de Sistemas Distribuídos, criando uma solução "paliativa" para o problema dos dois generais.

#
## Pré-requisitos:
- NodeJS v17.1.0

#
## Inicialização
Antes de executar o projeto é necessário instalar os pacotes. Execute em um terminal, estando no diretório raiz da aplicação:

    npm install

#
## Execução
Para executar o projeto, na raiz do mesmo em um terminal, utilize o comando:

    npm run dev

#
## Protocolo
O protocolo funciona sobre uma arquitetura cliente servidor.
O cliente inicia a comunicação enviando uma solicitação do ataque, e o servidor respondendo com uma mensagem de ACK, a qual o cliente também responderá com um ACK. Ambos irão aguardar pelo menos 2 Acknowledgments, e então enviarão Acks constantemente durante 10 segundos sem aguardar resposta, e então atacarão.

