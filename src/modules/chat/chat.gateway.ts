import { ChatEvent } from './chat.event'

import { Server } from 'socket.io'
import { IAuthSocket } from '../gateway/gateway.interface'

export class ChatGateway {
  private chatEvent: ChatEvent = new ChatEvent()
  constructor() {}
  register = (socket: IAuthSocket, io: Server) => {
    this.chatEvent.welcome(socket, io)
    this.chatEvent.sendMessage(socket, io)
    this.chatEvent.joinRoom(socket, io)
    this.chatEvent.leaveChat(socket, io)
    this.chatEvent.sendGroupMessage(socket, io)
    this.chatEvent.addUserOnline(socket, io)
    this.chatEvent.removeUserOnline(socket, io)
    this.chatEvent.typingStart(socket, io)
    this.chatEvent.typingStop(socket, io)
  }
}


