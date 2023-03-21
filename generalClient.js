import { WebSocket } from 'ws';
import { get30PercentRandom, messageTypes } from './helpers.js';

const clientStates = {
    SENDING_DATE: 'sendingdate',
    WAITING_ACK: 'waitingack',
    WAITING_ACK2: 'waitingack2',
    ATTACKING: 'attacking'
};

const clientTimeouts = {
    [clientStates.SENDING_DATE]: 0,
    [clientStates.WAITING_ACK]: 1000,
    [clientStates.WAITING_ACK2]: 1000,
};

class GeneralClient {
    constructor(serverPort, { onAttack }) {
        this.soldiers = 100;
        this.ws = new WebSocket(`ws://localhost:${serverPort}`);
        this.state = clientStates.SENDING_DATE;
        this.timerHandle = 0;
        this.receivedAcks = 0;
        this.otoTimer = 0;
        this.onAttack = onAttack;

        this.#init();
    }

    timerEventHandlers = {
        [clientStates.WAITING_ACK]: () => {
            this.sendSoldier(messageTypes.Date);
            this.setState(clientStates.WAITING_ACK);
        },
        [clientStates.WAITING_ACK2]: () => {
            this.sendSoldier(messageTypes.Ack);
            this.setState(clientStates.WAITING_ACK2);
        },
    }

    handleTimeout() {
        if (this.timerEventHandlers[this.state]) {
            this.timerEventHandlers[this.state]();
        }
    }

    messageReceivedHandlers = {
        [clientStates.WAITING_ACK]: (received) => {
            if (received.message === messageTypes.Ack.message) {
                this.sendSoldier(messageTypes.Ack);
                this.setState(clientStates.WAITING_ACK2);

                this.receivedAcks++;
            }
        },
        [clientStates.WAITING_ACK2]: (received) => {
            if (received.message === messageTypes.Ack.message) {
                this.receivedAcks++;
                console.log(`New number of acks: ${this.receivedAcks}`);

                if (this.receivedAcks >= 2) {
                    if (!this.otoTimer) {
                        this.otoTimer = setTimeout((() => {
                            console.log(`Client attacked with ${this.soldiers} soldiers.`);
                            this.close();
                            this.onAttack(this.soldiers);
                        }).bind(this), 10000);   
                    }
                }
                
                this.sendSoldier(messageTypes.Ack);
                this.setState(clientStates.WAITING_ACK2);
            }
        },
    }

    handleMessageReceived(message) {
        if (this.messageReceivedHandlers[this.state]) {
            this.messageReceivedHandlers[this.state](message)
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

        const timeout = clientTimeouts[state];
        if (timeout) {
            this.setTimer(timeout);
        }
    }

    sendSoldier(message) {
        this.soldiers--;

        if (this.soldiers <= 1) {
            console.log('Cliente ficou só com o general, morreu todo mundo :(');
            this.close();
            return;
        }

        const buffer = JSON.stringify(message);
        this.ws.send(buffer);
    }

    close() {
        clearTimeout(this.timerHandle);
        clearTimeout(this.otoTimer);
        this.ws.close();
    }

    #init() {
        this.ws.on('error', console.error);
        this.ws.on('close', () => {
            console.log('Server closed the connection');
        });
        this.ws.on('open', () => {
            console.log(`General client started.`);

            this.sendSoldier(messageTypes.Date);
            this.setState(clientStates.WAITING_ACK);
        });

        this.ws.on('message', (data) => {
            if (get30PercentRandom()) {
                this.soldiers++;

                console.log(`Received from server: ${data}`);

                const dataAsJson = JSON.parse(data);
                this.handleMessageReceived(dataAsJson);
            } else {
                console.log('Received from server, but the messenger died :(');
            }
        });
    }
}

new GeneralClient(1337, { onAttack: (soldiers) => process.exit(soldiers) });
