"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const chat_event_1 = require("./chat.event");
class ChatGateway {
    chatEvent = new chat_event_1.ChatEvent();
    constructor() { }
    register = (socket, io) => {
        this.chatEvent.welcome(socket, io);
        this.chatEvent.sendMessage(socket, io);
        this.chatEvent.joinRoom(socket, io);
        this.chatEvent.leaveChat(socket, io);
        this.chatEvent.sendGroupMessage(socket, io);
        this.chatEvent.addUserOnline(socket, io);
        this.chatEvent.removeUserOnline(socket, io);
        this.chatEvent.typingStart(socket, io);
        this.chatEvent.typingStop(socket, io);
    };
}
exports.ChatGateway = ChatGateway;
