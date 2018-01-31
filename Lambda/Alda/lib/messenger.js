// @flow

import dotenv from 'dotenv';
import request from 'request';
import Promise from 'bluebird';
import { create } from 'apisauce';
dotenv.config();

// Flow types
type TextMessage = {
    messaging_type: string,
    recipient: {
        id: string
    },
    message: {
        text: string
    }
};
type TextQuickReply = {
    title: string,
    payload: strign
};

type WebUrlButton = {
    type: string,
    url: string,
    title: string
};
type ButtonTemplate = {
    template_type: string,
    text: string,
    buttons: Button
};

if (!process.env.FB_PAGE_ACCESS_TOKEN) { throw ".env: facebook access token missing"; };
const api = create({
    baseURL: 'https://graph.facebook.com/v2.6/me/messages',
    params: {
        access_token: process.env.FB_PAGE_ACCESS_TOKEN
    }
});

export const send = (message) => {
    return api.post('/', message);
};


const createTextMessage = (psid: string, text: string, messagingType: string): TextMessage => {
    return {
        messaging_type: messagingType,
        recipient: {
            id: psid
        },
        message: {
            text
        }
    };
};

const createImageMessage = (psid, url, messagingType) => {
    return {
        messaging_type: messagingType,
        recipient: {
            id: psid
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url,
                    is_reusable: true
                }
            }
        }
    };
};

const createAttachmentMessage = (psid, attachment, messagingType) => {
    return {
        messaging_type: messagingType,
        recipient: {
            id: psid
        },
        message: {
          attachment
        }
    };
};

const createTextQuickReply = (title, payload) => {
    return {
        content_type: "text",
        title,
        payload
    };
};

const createButtonTemplateMessage = (psid, text, buttons, messagingType) => {
    let buttonTemplateMessage = {
        messaging_type: messagingType,
        recipient: {
            id: psid
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text,
                    buttons: []
                }
            }
        }
    };
    buttonTemplateMessage.message.attachment.payload.buttons = buttons.map((button) => {
        return createWebUrlButton(button.title, button.url);
    });
    return buttonTemplateMessage;
};
const createWebUrlButton = (title: string, url: string): WebUrlButton => {
    return {
        type: "web_url",
        url,
        title
    };
};

export const sendTextMessage = (psid, text, messagingType) => {
    return send(createTextMessage(psid, text, messagingType));
};
export const respondTextMessage = (psid, text) => {
    return sendTextMessage(psid, text, "RESPONSE");
};
export const sendImageMessage = (psid, url, messagingType) => {
    return send(createImageMessage(psid, url, messagingType));
};
export const respondImageMessage = (psid, url) => {
    return sendImageMessage(psid, url, "RESPONSE");
};
export const sendAttachementMessage = (psid, attachment, messagingType) => {
    return send(createAttachmentMessage(psid, attachment, messagingType));
};
export const respondAttachmentMessage = (psid, attachment) => {
    return sendAttachementMessage(psid, attachment, "RESPONSE");
};

export const sendTextQuickReplies = (psid: string, text: string, quickReplies: [QuickReply], messagingType: string) => {
    let quickReplyMessage = createTextMessage(psid, text, messagingType);
    quickReplyMessage.message.quick_replies = quickReplies.map((quickReply) => {
        return createTextQuickReply(quickReply.title, quickReply.payload);
    });
    return send(quickReplyMessage);
};
export const respondTextQuickReplies = (psid, text, quickReplies) => {
    return sendTextQuickReplies(psid, text, quickReplies, "RESPONSE");
};

export const sendWebUrlButtons = (psid: string, text, buttons: [WebUrlButton], messagingType) => {
    return send(createButtonTemplateMessage(psid, text, buttons, messagingType));
};
export const respondWebUrlButtons = (psid, text, buttons) => {
    return sendWebUrlButtons(psid, text, buttons, "RESPONSE");
};


export const getMessageText = (event) => {
    return event.message.text;
};
