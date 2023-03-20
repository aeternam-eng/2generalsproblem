export const messageTypes = {
    Date: {
        message: 'Opa, bora atacá 10:30h?',
    },
    Ack: {
        message: 'Bora.'
    }
};

export const NUMBER_OF_ACKS = 5;

export const get30PercentRandom = () => Math.random() < 0.3;
export const get80PercentRandom = () => Math.random() < 0.8;
