import { Server } from 'socket.io'
import { IAuthSocket } from '../gateway'
import { IJoinRoomDTO, ISendGroupMessageDto, ISendMessageDTO } from './chat.dto'
import { ChatService } from './chat.service'

export class ChatEvent {
  private chatService = new ChatService()
  constructor() {}
  welcome = (socket: IAuthSocket, io: Server) => {
    return socket.on('welcome', (data: any) => {
      this.chatService.sayHi({ message: data, socket, io })
    })
  }
  sendMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      'sendMessage',
      (data: { content: string; sendTo: string }) => {
        this.chatService.sendMessage({ ...data, socket, io } as ISendMessageDTO)
      }
    )
  }
  joinRoom = (socket: IAuthSocket, io: Server) => {
    return socket.on('join_room', (data: { roomId: string }) => {
      this.chatService.joinRoom({ ...data, socket, io } as IJoinRoomDTO)
    })
  }
  leaveChat = (socket: IAuthSocket, io: Server) => {
    return socket.on('leave_room', (data: { roomId: string }) => {
      this.chatService.leaveChat({ ...data, socket, io } as IJoinRoomDTO)
    })
  }
  sendGroupMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      'sendGroupMessage',
      (data: { content: string; groupId: string }) => {
        this.chatService.sendGroupMessage({
          ...data,
          socket,
          io,
        } as ISendGroupMessageDto)
      }
    )
  }
  addUserOnline = (socket: IAuthSocket, io: Server) => {
    return socket.on('user_online', (data) => {
      this.chatService.addUserOnline({ ...data, socket, io } as any)
    })
  }
  removeUserOnline = (socket: IAuthSocket, io: Server) => {
    return socket.on('user_online', (data) => {
      this.chatService.removeUserOnline({ ...data, socket, io } as any)
    })
  }
  typingStart = (socket: IAuthSocket, io: Server) => {
    return socket.on('typing_start', (data) => {
      this.chatService.typingStart({ ...data, socket, io } as any)
    })
  }
  typingStop = (socket: IAuthSocket, io: Server) => {
    return socket.on('typing_stop', (data) => {
      this.chatService.typingStop({ ...data, socket, io } as any)
    })
  }
}
