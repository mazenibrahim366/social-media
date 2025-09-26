import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { nanoid } from 'nanoid'
import ChatModels from '../../DB/models/chat.model'
import { IMessage, IUser } from '../../DB/models/models.dto'
import UserModels from '../../DB/models/User.model'
import { ChatRepository, UserRepository } from '../../DB/repository'
import { deleteFile, uploadFile } from '../../utils/multer/s3.config'
import { AppError, BadError } from '../../utils/response/error.response'
import { successResponse } from '../../utils/response/success.response'
import { connectedSockets, onlineUsers } from '../gateway'
import {
  IChatDTO,
  ICreateChattingGroupDTO,
  IGetChatParamsDTO,
  IGetChatQueryDTO,
  IGetChattingParamsGroupDTO,
  IGetChattingQueryGroupDTO,
  IJoinRoomDTO,
  IRemoveUserOnline,
  ISendGroupMessageDto,
  ISendMessageDTO,
} from './chat.dto'

export class ChatService {
  private chatModel: ChatRepository = new ChatRepository(ChatModels)
  private userModel: UserRepository = new UserRepository(UserModels)
  constructor() {}
  // REST

  getChat = async (req: Request, res: Response) => {
    const { userId } = req.params as IGetChatParamsDTO
    const { page, size } = req.query as IGetChatQueryDTO
    const chat = await this.chatModel.findOneChat({
      filter: {
        participants: {
          $all: [req.user?._id, Types.ObjectId.createFromHexString(userId)],
        },
        group: { $exists: false },
      },
      option: {
        populate: [
          {
            path: 'participants',
            select: 'firstName lastName email gender picture',
          },
        ],
      },
      page,
      size,
    })
    if (!chat) {
      throw new BadError('fail to find matching chat instance')
    }

    return successResponse({
      res,
      status: 200,
      data: { chat },
    })
  }
  getChattingGroup = async (req: Request, res: Response) => {
    const { groupId } = req.params as IGetChattingParamsGroupDTO
    const { page, size } = req.query as IGetChattingQueryGroupDTO
    const chat = await this.chatModel.findOneChat({
      filter: {
        _id: Types.ObjectId.createFromHexString(groupId),
        participants: {
          $in: req.user?._id,
        },
        group: { $exists: true },
      },
      option: {
        populate: [
          {
            path: 'message.createdBy',
            select: 'firstName lastName email gender picture',
          },
        ],
      },
      page,
      size,
    })

    if (!chat) {
      throw new BadError('fail to find matching chat instance')
    }

    return successResponse({
      res,
      status: 200,
      data: { chat },
    })
  }
  createChattingGroup = async (req: Request, res: Response) => {
    const { group, participants } = req.body as ICreateChattingGroupDTO
    const dpParticipants = participants.map((id) =>
      Types.ObjectId.createFromHexString(id)
    )
    const users: IUser[] = (await this.userModel.find({
      filter: {
        _id: {
          $in: dpParticipants,
        },
        friend: { $in: req.user?._id },
      },
    })) as unknown as IUser[]
    console.log({ participants, users, dpParticipants })

    if (participants?.length != users?.length) {
      throw new AppError('some or all recipient all Invalid ', 404)
    }

    let group_image: string | undefined = undefined
    const roomId = group.replaceAll(/\s+/g, '_') + '-' + nanoid()
    if (req.file) {
      group_image = await uploadFile({
        file: req.file,
        path: `chat/group/${roomId}`,
      })
    }
    dpParticipants.push(req.user?._id as Types.ObjectId)
    const [newChat]: unknown | any =
      (await this.chatModel.create({
        data: [
          {
            createdBy: req.user?._id as Types.ObjectId,
            participants: dpParticipants,
            group,
            group_image: group_image as string,
            roomId,
            message: [],
          },
        ],
      })) || []

    if (!newChat) {
      if (group_image) {
        await deleteFile({ Key: group_image })
      }

      throw new BadError('fail to generate this group', 404)
    }
    return successResponse({
      res,
      status: 200,
      data: { chat: newChat },
    })
  }

  // Io
  sendMessage = async ({
    content,
    sendTo,
    socket,
    io,
  }: ISendMessageDTO): Promise<any> => {
    try {
      const createdBy = socket.credentials?.user._id as Types.ObjectId
      //  console.log(content, sendTo, createdBy);

      const user = await this.userModel.findOne({
        filter: {
          _id: Types.ObjectId.createFromHexString(sendTo),
          friend: { $in: createdBy },
        },
      })
      if (!user) {
        throw new AppError('invalid recipient friend ', 404)
      }
      const chat = await this.chatModel.findOneAndUpdate({
        filter: {
          participants: {
            $all: [createdBy, Types.ObjectId.createFromHexString(sendTo)],
          },
          group: { $exists: false },
        },
        data: { $addToSet: { message: { content, createdBy } } },
      })
      if (!chat) {
        const [newChat]: any =
          (await this.chatModel.create({
            data: [
              {
                createdBy,
                participants: [
                  createdBy,
                  Types.ObjectId.createFromHexString(sendTo),
                ],
                message: [
                  {
                    content,
                    createdBy,
                  },
                ] as IMessage[],
              },
            ],
          })) || []
        if (!newChat) {
          throw new BadError('fail to create new chat instance', 404)
        }
      }
      io?.to(
        connectedSockets.get(createdBy.toString() as string) as string[]
      ).emit('successMessage', {
        content,
      })

      io?.to(connectedSockets.get(sendTo) as string[]).emit('newMessage', {
        content,
        from: socket.credentials?.user,
      })
    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }
  leaveChat = async ({ roomId, socket, io }: IJoinRoomDTO): Promise<any> => {
    try {
      const chat = await this.chatModel.findOne({
        filter: {
          roomId,
          participants: {
            $in: socket.credentials?.user._id,
          },
          group: { $exists: true },
        },
      })
      if (!chat) {
        throw new AppError('fail to find matching room ', 404)
      }
      socket.leave(chat.roomId as string)

    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }
  joinRoom = async ({ roomId, socket, io }: IJoinRoomDTO): Promise<any> => {
    try {
      const chat = await this.chatModel.findOne({
        filter: {
          roomId,
          participants: {
            $in: socket.credentials?.user._id,
          },
          group: { $exists: true },
        },
      })
      if (!chat) {
        throw new AppError('fail to find matching room ', 404)
      }
      socket.join(chat.roomId as string)
      // io?.to(roomId).emit('joinedRoom', {
      //   message: `user ${socket.credentials?.user.firstName} joined room ${roomId}`,
      // })
    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }
  sendGroupMessage = async ({
    groupId,
    content,
    socket,
    io,
  }: ISendGroupMessageDto): Promise<any> => {
    try {
      const createdBy = socket.credentials?.user._id as Types.ObjectId
      const chat = await this.chatModel.findOneAndUpdate({
        filter: {
          _id: Types.ObjectId.createFromHexString(groupId),
          participants: {
            $in: createdBy,
          },
          group: { $exists: true },
        },
        data: { $addToSet: { message: { content, createdBy } } },
      })
      if (!chat) {
        throw new AppError('fail to find matching room ', 404)
      }

      socket?.to(chat.roomId as string).emit('newMessage', {
        content,
        from: socket.credentials?.user,
        groupId,
      })
      io?.to(
        connectedSockets.get(createdBy.toString() as string) as string[]
      ).emit('successMessage', {
        content,
      })
    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }
  removeUserOnline = async ({
    socket,
    io,
    
  }: IRemoveUserOnline): Promise<any> => {
    try {


        const sockets = onlineUsers.get(socket.credentials?.user._id as string)
  if (!sockets) return
  sockets.delete(socket.id)
  if (sockets.size === 0) {
    onlineUsers.delete(socket.credentials?.user._id as string)
    io?.emit('user_offline', { userId :socket.credentials?.user._id as string })
  }
    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }
  addUserOnline = async ({
    socket,
    io,
  }: ISendGroupMessageDto): Promise<any> => {
    try {
      if (!onlineUsers.has(socket.credentials?.user._id as string))
        onlineUsers.set(socket.credentials?.user._id as string, new Set())
      onlineUsers.get(socket.credentials?.user._id as string)?.add(socket.id)
      io?.emit('user_online', { userId: socket.credentials?.user._id })
    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }
  typingStop = async ({
    socket,
    io,
  }: ISendGroupMessageDto): Promise<any> => {
    try {
   socket.to(socket.credentials?.user._id as string).emit("typing", { userId:socket.credentials?.user._id as string, isTyping: false })
    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }
  typingStart = async ({
    socket,
    io,
  }: ISendGroupMessageDto): Promise<any> => {
    try {
    socket.to(socket.credentials?.user._id as string).emit("typing", { userId:socket.credentials?.user._id as string, isTyping: true })
    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }

  // Io
  sayHi = ({ message, socket, callback }: IChatDTO): any => {
    try {
      console.log(`Welcome socket ${socket.id}!`, message)
      callback && callback(`Welcome socket ${socket.id}!`)
    } catch (error) {
      return socket.emit('custom_error', error)
    }
  }
}



