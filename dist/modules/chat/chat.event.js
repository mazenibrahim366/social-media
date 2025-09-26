"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvent = void 0;
const chat_service_1 = require("./chat.service");
class ChatEvent {
    chatService = new chat_service_1.ChatService();
    constructor() { }
    welcome = (socket, io) => {
        return socket.on('welcome', (data) => {
            this.chatService.sayHi({ message: data, socket, io });
        });
    };
    sendMessage = (socket, io) => {
        return socket.on('sendMessage', (data) => {
            this.chatService.sendMessage({ ...data, socket, io });
        });
    };
    joinRoom = (socket, io) => {
        return socket.on('join_room', (data) => {
            this.chatService.joinRoom({ ...data, socket, io });
        });
    };
    leaveChat = (socket, io) => {
        return socket.on('leave_room', (data) => {
            this.chatService.leaveChat({ ...data, socket, io });
        });
    };
    sendGroupMessage = (socket, io) => {
        return socket.on('sendGroupMessage', (data) => {
            this.chatService.sendGroupMessage({
                ...data,
                socket,
                io,
            });
        });
    };
    addUserOnline = (socket, io) => {
        return socket.on('user_online', (data) => {
            this.chatService.addUserOnline({ ...data, socket, io });
        });
    };
    removeUserOnline = (socket, io) => {
        return socket.on('user_online', (data) => {
            this.chatService.removeUserOnline({ ...data, socket, io });
        });
    };
    typingStart = (socket, io) => {
        return socket.on('typing_start', (data) => {
            this.chatService.typingStart({ ...data, socket, io });
        });
    };
    typingStop = (socket, io) => {
        return socket.on('typing_stop', (data) => {
            this.chatService.typingStop({ ...data, socket, io });
        });
    };
}
exports.ChatEvent = ChatEvent;
