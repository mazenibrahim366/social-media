import { ChatService } from './../chat/chat.service';

import { ChatGateway} from './../chat/chat.gateway';
import { Server as httpServer } from 'node:http'
import { Server} from 'socket.io'

import { BadError } from '../../utils/response/error.response'
import { decodedToken } from '../../utils/security/token.security'
import { IAuthSocket } from './gateway.interface'
const chatServes = new ChatService()

 export const connectedSockets = new Map<string, string[]>()
 export const onlineUsers: Map<string, Set<string>> = new Map()
let io :undefined | Server = undefined

export const initializeIo = (httpServer: httpServer) => {
  // initialize Io
  io = new Server(httpServer, { cors: { origin: '*' } })
  // handle socket middleware for authentication
  io.use(async (socket: IAuthSocket, next) => {
    try {
      const { decoded, user } = await decodedToken({
        authorization: socket?.handshake.auth.authorization || '',
      })
      if (!decoded || !user) {
        next(new BadError('unauthorized socket connection'))
      }
      let userTapes = connectedSockets.get(user._id.toString()) || []
      userTapes.push(socket.id)
      connectedSockets.set(user._id.toString(), userTapes)
      socket.credentials = { user, decoded }
      next()
    } catch (error) {
      next(error as Error)
    }
  })
  // disconnection
  function disconnection(socket: IAuthSocket) {
    return socket.on('disconnect', (reason) => {
      const userId = socket.credentials?.user._id?.toString()
      let remainingTaps =
        connectedSockets
          .get(userId as string)
          ?.filter((tap) => tap !== socket.id) || []
      if (remainingTaps.length) {
        connectedSockets.set(userId as string, remainingTaps)
      } else {
        connectedSockets.delete(userId as string)
        getIo().emit('offline_user', userId)
      }
    
   chatServes.removeUserOnline({io  , socket} as any)

      console.log({ connectedSockets })
    })
  }
const chatGateway:ChatGateway = new ChatGateway()
  io.on('connection', (socket: IAuthSocket) => {
  
      console.log({ connectedSockets })
    connectedSockets.get(socket.credentials?.user._id?.toString() as string)
    chatGateway.register(socket , getIo())
    disconnection(socket)
  })

}

export const getIo = () => {
  if (!io) {
    throw new BadError('Fail to connect to server socket io ')
  } else {
    return io
  }   
}

