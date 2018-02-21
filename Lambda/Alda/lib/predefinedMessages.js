import Promise from 'bluebird';
import {
    respondTextMessage,
    respondTextQuickReplies,
    respondWebUrlButtons
} from './messenger.js';

export const sendWelcomeMessages = (psid) => {
    let promises = [
        () => {
            return respondTextMessage(
                psid,
                'Hola, soy Alda. Estoy aquí para simplificar la administración de tu dinero.',
            );
        },
        () => {
            return respondTextMessage(
                psid,
                'Puedes pensar en mí como tu asistente personal.'
            );
        },
        () => {
            return respondTextQuickReplies(
                psid,
                'Te ayudaré a hacer un seguimiento de lo que estás gastando, cómo estás gastando y cómo puedes hacerlo mejor.',
                [{title: 'Empecemos', payload: "START_LOGIN"}]
            );
        }
    ];
    return Promise.each(promises, (promise) => {
        return promise();
    });
};

export const sendFirstLoginMessages = (psid) => {
    let promises = [
        () => {
            return respondTextMessage(
                psid,
                '¡Guay! Para comenzar tu viaje hacia una mejor administración del dinero, necesito vincularme con tu banca en línea.',
                'RESPONSE'
            );
        },
        () => {
            return respondWebUrlButtons(
                psid,
                "Tus detalles están protegidos por seguridad de nivel bancario. Están completamente protegidos y son 100% seguros.",
                [
                    {
                        title: "FAQ",
                        url: "https://aldabot.es/faq"
                    },
                    {
                        title: "Claro 🔒",
                        url: "https://aldabot.es/registrate"
                    }
                ]
            );
        }
    ];
    return Promise.each(promises, (promise) => {
        return promise();
    });
};

export const sendYouHaveToLoginMessages = (psid) => {
    let promises = [
        () => {
            return respondTextMessage(
                psid,
                'Para responderte necesito vincularme con su banca en línea.',
                'RESPONSE'
            );
        },
        () => {
            return respondWebUrlButtons(
                psid,
                "Tus detalles están protegidos por seguridad de nivel bancario. Están completamente protegidos y son 100% seguros.",
                [
                    {
                        title: "FAQ",
                        url: "https://aldabot.es/#/faq"
                    },
                    {
                        title: "Claro 🔒",
                        url: "https://aldabot.es/#/registrate"
                    }
                ]
            );
        }
    ];
    return Promise.each(promises, (promise) => {
        return promise();
    });
};


export const sendSomethingWrongMessage = (psid) => {
    return respondTextMessage(psid, "Ups, algo ha ido mal.");
};
