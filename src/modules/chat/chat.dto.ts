import { Server } from 'socket.io'
import z from 'zod'
import { IAuthSocket } from '../gateway'
import {
  createChattingGroup,
  getChat,
  getChattingGroup,
} from './chat.validation'

export type IGetChatParamsDTO = z.infer<typeof getChat.params>
export type IGetChatQueryDTO = z.infer<typeof getChat.query>
export type ICreateChattingGroupDTO = z.infer<typeof createChattingGroup.body>
export type IGetChattingParamsGroupDTO = z.infer<typeof getChattingGroup.params>
export type IGetChattingQueryGroupDTO = z.infer<typeof getChattingGroup.query>
export interface IMainDto {
  socket: IAuthSocket
  callback?: any
  io?: Server
}
export interface IChatDTO extends IMainDto {
  message: string
}
export interface ISendMessageDTO extends IMainDto {
  content: string
  sendTo: string
}
export interface IJoinRoomDTO extends IMainDto {
  roomId: string
}
export interface ISendGroupMessageDto extends IMainDto {
  content: string
  groupId: string
}
export interface IRemoveUserOnline extends IMainDto {
  userId: string

}
