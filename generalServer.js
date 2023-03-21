import { WebSocketServer } from 'ws';
import { messageTypes, get30PercentRandom } from './helpers.js';

const serverStates = {
    IDLE: 'idle',
    WAITING_ACK: 'waitingack',
    ATTACKING: 'attacking'
}

const serverTimeouts = {
    [serverStates.WAITING_ACK]: 1000,
};

class GeneralServer {
    constructor({ onAttack }) {
        this.soldiers = 100;
        this.wss = new WebSocketServer({ port: 1337 });
        this.state = serverStates.IDLE;
        this.timerHandle = 0;
        this.receivedAcks = 0;
        this.otoTimer = 0;
        this.onAttack = onAttack;

        this.#init();
    }

    timerEventHandlers = { 
        [serverStates.WAITING_ACK]: () => {
            this.wss.clients.forEach(c => this.sendSoldier(c, messageTypes.Ack));
            this.setState(serverStates.WAITING_ACK);
        },
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
            if (received.message === messageTypes.Date.message) {
                this.sendSoldier(ws, messageTypes.Ack);
                this.setState(serverStates.WAITING_ACK);
                this.receivedAcks = 0;
                return;
            }

            if (received.message === messageTypes.Ack.message) {
                this.receivedAcks++;
                console.log(`New number of acks: ${this.receivedAcks}`);

                if (this.receivedAcks >= 2) {
                    if(!this.otoTimer) {
                        this.otoTimer = setTimeout((() => {
                            console.log(`Server attacked with ${this.soldiers} soldiers.`);
                            this.close();
                            this.onAttack(this.soldiers);
                        }).bind(this), 10000);
                    }
                }

                this.sendSoldier(ws, messageTypes.Ack);
                this.setState(serverStates.WAITING_ACK);
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
        if (this.state !== state) {
            this.state = state;
            console.log(`Setting state to ${this.state}`);
        }

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
            return;
        }

        const buffer = JSON.stringify(message);
        ws.send(buffer);
    }

    close() {
        clearTimeout(this.timerHandle);
        clearTimeout(this.otoTimer);
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

new GeneralServer({ onAttack: (soldiers) => process.exit(soldiers) });
