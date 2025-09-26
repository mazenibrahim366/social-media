import { JwtPayload } from "jsonwebtoken"
import { IUser } from "../../DB/models/models.dto"
import { Socket } from "socket.io"

export interface IAuthSocket extends Socket{
  credentials?: {
    user: Partial<IUser>
    decoded: JwtPayload
  }
}