import { WebSocketServer } from 'ws';
import { messageTypes, get30PercentRandom, NUMBER_OF_ACKS } from './helpers.js';

const serverStates = {
    IDLE: 'idle',
    WAITING_ACK: 'waitingack',
}

const serverTimeouts = {
    [serverStates.WAITING_ACK]: 1000,
};

class GeneralServer {
    constructor() {
        this.soldiers = 100;
        this.wss = new WebSocketServer({ port: 1337 });
        this.state = serverStates.IDLE;
        this.timerHandle = 0;
        this.receivedAcks = 0;

        this.#init();
    }

    timerEventHandlers = { 
        [serverStates.WAITING_ACK]: () => {
            if (this.wss.clients[0]) {
                this.sendSoldier(this.wss.clients[0], messageTypes.Ack);
            }

            this.setState(serverStates.WAITING_ACK);
        }
    }

    handleTimeout() {
        if (this.timerEventHandlers[this.state]) {
            this.timerEventHandlers[this.state]();
        }
    }

    messageReceivedHandlers = {
        [serverStates.IDLE]: (ws, received) => {
            if (received.message === messageTypes.Date.message) {
                this.sendSoldier(ws, messageTypes.Ack);
                this.setState(serverStates.WAITING_ACK);
            }
        },
        [serverStates.WAITING_ACK]: (ws, received) => {
            if (received.message === messageTypes.Ack.message) {
                this.receivedAcks++;

                if (this.receivedAcks >= NUMBER_OF_ACKS) {
                    console.log(`Server attacked with ${this.soldiers} soldiers.`);
                    this.close();
                } else {
                    this.sendSoldier(ws, messageTypes.Ack);
                    this.setState(serverStates.WAITING_ACK);
                }
            }
        }
    }

    handleMessageReceived(ws, message) {
        if (this.messageReceivedHandlers[this.state]) {
            this.messageReceivedHandlers[this.state](ws, message)
        }
    }

    setTimer(time) {
        clearTimeout(this.timerHandle);
        this.timerHandle = setTimeout(this.handleTimeout.bind(this), time);
    }

    setState(state) {
        this.state = state;

        console.log(`Setting state to ${this.state}`);

        const timeout = serverTimeouts[state];
        if (timeout) {
            this.setTimer(timeout);
        }
    }

    sendSoldier(ws, message) {
        this.soldiers--;

        if (this.soldiers <= 1) { 
            console.log('Servidor ficou só com o general, morreu todo mundo :(');
            this.close();
        }

        const buffer = JSON.stringify(message);
        ws.send(buffer);
    }

    close() {
        clearTimeout(this.timerHandle);
        this.wss.clients.forEach(c => c.close());
        this.wss.close();
    }

    #init() {
        console.log('Starting GeneralServer at address: ', this.wss.address());

        this.wss.on('connection', (ws, req) => {
            console.log('New client: ', req.socket.remotePort);

            ws.on('error', console.error);

            ws.on('message', (data) => {
                if (get30PercentRandom()) {   
                    this.soldiers++;

                    console.log(`Received from client ${data}`);
                    
                    const json = JSON.parse(data);
                    this.handleMessageReceived(ws, json);
                } else {
                    console.log(`Received from client, but the messenger died :(`);
                }
            });
        });
    }
}

new GeneralServer();
