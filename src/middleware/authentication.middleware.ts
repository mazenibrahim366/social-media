import { NextFunction, Request, Response } from 'express'
import { GraphQLError } from 'graphql'
import { IUser } from '../DB/models/models.dto.js'
import { roleEnum, tokenTypeEnum } from '../utils/enums.js'
import { AppError } from '../utils/response/error.response.js'
import { decodedToken, IDecoded } from '../utils/security/token.security.js'

export const authentication = ({ tokenType = tokenTypeEnum.access } = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization
    if (!authorization) {
      return next(new Error('Authorization header missing'))
    }
    const result = await decodedToken({ authorization, tokenType })
    if (!result) {
      return next(new Error('Invalid token'))
    }
    const { user, decoded } = result as { user: IUser; decoded: IDecoded }
    req.decoded = decoded
    req.user = user
    return next()
  }
}

export const authorization = (accessRoles: roleEnum[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!accessRoles.includes(req.user?.role as roleEnum)) {
      throw new AppError('Not authorized account', 403)
    }

    return next()
  }
}
export const graphAuthorization = async (
  accessRoles: roleEnum[] = [],
  role: roleEnum
) => {
  if (!accessRoles.includes(role as roleEnum)) {
    throw new GraphQLError('authorized account', {
      extensions: { statusCode: 403 },
    })
  }
}
