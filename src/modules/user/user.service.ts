import type { Request, Response } from 'express'
import UserModels from '../../DB/models/User.model'
import {
  ChatRepository,
  FriendRequestRepository,
  PostRepository,
  TokenRepository,
  UserRepository,
} from '../../DB/repository/'
// import { AppError, BadError } from '../../utils/response/error.response'
import { Types } from 'mongoose'
import ChatModels from '../../DB/models/chat.model'
import FriendRequestModels from '../../DB/models/FriendRequest.model'
import { IUser } from '../../DB/models/models.dto'
import PostModels from '../../DB/models/Post.model'
import TokenModels from '../../DB/models/Token.model'
import { logoutEnum, roleEnum } from '../../utils/enums'
import {
  createPreSignedUploadURL,
  deleteFiles,
  deleteFolderByPrefix,
  uploadFiles,
} from '../../utils/multer/s3.config'
import { s3Event } from '../../utils/multer/s3.events'
import { AppError, BadError } from '../../utils/response/error.response'
import { successResponse } from '../../utils/response/success.response'
import { decryptEncryption } from '../../utils/security/encryption.security'
import {
  createRevokeToken,
  generateLoginToken,
} from '../../utils/security/token.security'
import { GraphQLError } from 'graphql'

export class UserService {
  private UserModel = new UserRepository(UserModels)
  private TokenModel = new TokenRepository(TokenModels)
  private PostModel = new PostRepository(PostModels)
  private ChatModel = new ChatRepository(ChatModels)
  private FriendRequestModel = new FriendRequestRepository(FriendRequestModels)

  constructor() {}
  dashboard = async (req: Request, res: Response) => {
    const results = await Promise.allSettled([
      this.UserModel.findCursor({
        filter: {},
      }),
      this.PostModel.find({
        filter: {},
      }),
    ])

    // const decryptedPhone = await decryptEncryption({
    //   cipherText: req.user?.phone as string,
    // })
    // users!.phone = decryptedPhone
    return successResponse({
      res,
      status: 201,
      data: { results },
    })
  }

  unFriend = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string }

    const friendRequest = await this.UserModel.updateOne({
      filter: {
        _id: req.user?._id,
        friend: { $in: [new Types.ObjectId(userId)] },
      },
      data: { $pull: { friend: new Types.ObjectId(userId) } },
    })

    if (!friendRequest.matchedCount) {
      throw new AppError('fail to find matching result ', 404)
    }

    const updateOther = await this.UserModel.updateOne({
      filter: {
        _id: new Types.ObjectId(userId),
        friend: { $in: [req.user?._id] },
      },
      data: { $pull: { friend: req.user?._id } },
    })

    if (!updateOther.matchedCount) {
      throw new AppError('fail to unfriend this user', 404)
    }

    return successResponse({
      res,
      message: 'user unfriended successfully',
    })
  }

  acceptFriendRequest = async (req: Request, res: Response) => {
    const { requestId } = req.params as { requestId: Types.ObjectId | string }
    const friendRequest = await this.FriendRequestModel.findOneAndUpdate({
      filter: {
        _id: requestId,
        sendTo: req.user?._id,
        acceptedAt: { $exists: false },
      },
      data: { acceptedAt: new Date() },
    })
    if (!friendRequest) {
      throw new AppError('fail to find matching result ', 404)
    }
    await Promise.all([
      await this.UserModel.updateOne({
        filter: { _id: req.user?._id },
        data: { $addToSet: { friend: friendRequest?.createdBy } },
      }),
      await this.UserModel.updateOne({
        filter: { _id: friendRequest?.createdBy },
        data: { $addToSet: { friend: req.user?._id } },
      }),
    ])
    return successResponse({
      res,
    })
  }
  UnAcceptFriendRequest = async (req: Request, res: Response) => {
    const { requestId } = req.params as { requestId: Types.ObjectId | string }
    const friendRequest = await this.FriendRequestModel.findOne({
      filter: {
        _id: requestId,
        sendTo: req.user?._id,
        acceptedAt: { $exists: false },
      },
    })
    if (!friendRequest) {
      throw new AppError('fail to find matching result ', 404)
    }
    const deleteFriendRequest = await this.FriendRequestModel.deleteOne({
      filter: {
        _id: requestId,
        sendTo: req.user?._id,
        acceptedAt: { $exists: false },
      },
    })
    if (!deleteFriendRequest.deletedCount) {
      throw new AppError('fail to delete this friend request ', 404)
    }

    return successResponse({
      res,
    })
  }
  sendFriendRequest = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: Types.ObjectId | string }
    if (userId == req.user?._id) {
      throw new AppError('you cant send friend request to yourself ', 400)
    }
    const checkFriendRequest = await this.FriendRequestModel.findOne({
      filter: {
        createdBy: { $in: [req.user?._id, userId] },
        sendTo: { $in: [req.user?._id, userId] },
        acceptedAt: { $exists: false },
      },
    })
    if (checkFriendRequest) {
      throw new AppError('you are already friend exist  ', 400)
    }
    const user = await this.UserModel.findOne({
      filter: { _id: userId },
    })
    if (!user) {
      throw new AppError('invalid recipient   ', 400)
    }
    const [friendRequest]: any =
      (await this.FriendRequestModel.create({
        data: [
          {
            createdBy: req.user?._id as Types.ObjectId,
            sendTo: userId as Types.ObjectId,
          },
        ],
      })) || []
    if (!friendRequest) {
      throw new BadError('something went wrong !')
    }
    return successResponse({
      res,
      status: 201,
      data: { friendRequest },
    })
  }
  changeRole = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string }
    const denyRoles: roleEnum[] = [roleEnum.superAdmin]

    if (req.user?.role === roleEnum.Admin) {
      denyRoles.push(roleEnum.Admin)
    }

    const user = await this.UserModel.findOneAndUpdate({
      filter: { _id: userId, role: { $nin: denyRoles } },
      data: { role: req.body.role },
    })
    if (!user) {
      throw new AppError('fail to find matching result', 404)
    }
    // const decryptedPhone = await decryptEncryption({
    //   cipherText: req.user?.phone as string,
    // })
    // users!.phone = decryptedPhone
    return successResponse({
      res,
      data: { user },
    })
  }

  blockUser = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: Types.ObjectId | string }
    const user = await this.UserModel.findOne({
      filter: {
        _id: req.user?._id as Types.ObjectId,
        friend: { $in: [new Types.ObjectId(userId)] },
      },
    })
    if (!user) {
      throw new AppError('fail to find matching result', 404)
    }

    if (user?.blockList?.includes(new Types.ObjectId(userId) as any)) {
      throw new AppError('user already blocked', 400)
    }

    const updateUser = await this.UserModel.updateOne({
      filter: { _id: req.user?._id },
      data: { $addToSet: { blockList: new Types.ObjectId(userId) } },
    })
    if (!updateUser.matchedCount) {
      throw new AppError('fail to block this user', 404)
    }
    return successResponse({
      res,
    })
  }
  profile = async (req: Request, res: Response) => {
    const user = await this.UserModel.findById({
      id: req.user?._id as string,
      select: ' -phone',
      option: {
        populate: [
          {
            path: 'friend',
            select: 'firstName lastName email gender picture slug',
          },
        ],
      },
    })
    if (!user) {
      throw new AppError('fail to find matching result', 404)
    }
    const decryptedPhone = await decryptEncryption({
      cipherText: req.user?.phone as string,
    })
    user!.phone = decryptedPhone
    const groups = await this.ChatModel.find({
      filter: {
        participants: { $in: req.user?._id },
        group: { $exists: true },
      },
    })
    return successResponse({
      res,
      status: 201,
      data: { user, groups },
    })
  }
  logout = async (req: Request, res: Response) => {
    const { flag } = req.body
    let status = 200
    switch (flag) {
      case logoutEnum.signoutFromAllDevice:
        await this.UserModel.updateOne({
          filter: { _id: req.decoded?._id },
          data: { changeCredentialsTime: new Date() },
        })
        break

      default:
        await createRevokeToken({ req })
        status = 201
        break
    }
    console.log(this.TokenModel)
    // console.log(req.decoded);

    return successResponse({ res, status })
  }

  refreshToken = async (req: Request, res: Response) => {
    const data = await generateLoginToken(req.user as IUser)
    await createRevokeToken({ req })
    return successResponse({ res, status: 200, data })
  }

  profileImage = async (req: Request, res: Response) => {
    // const key = await uploadLargeFile({
    //   file: req.file as Express.Multer.File,
    //   path: `users/${req.decoded?._id}`,
    // })
    const {
      ContentType,
      originalname,
    }: { ContentType: string; originalname: string } = req.body

    const { url, key } = await createPreSignedUploadURL({
      ContentType,
      originalname,
      path: `users/${req.decoded?._id}`,
    })
    const user = await this.UserModel.findByIdAndUpdate({
      id: new Types.ObjectId(req.decoded?._id),
      data: { picture: key, temProfileImage: req.user?.picture },
    })

    if (!user) {
      throw new AppError('fail to update user profile image', 404)
    }
    s3Event.emit('trackFileUpload', {
      key,
      expiresIn: 30000,
      userId: req.decoded?._id,
      oldKey: req.user?.picture,
    })
    return successResponse({ res, status: 200, data: { url, key } as Object })
  }

  profileCoverImages = async (req: Request, res: Response) => {
    const key = await uploadFiles({
      files: req.files as Express.Multer.File[],
      path: `users/cover/${req.decoded?._id}`,
    })

    const user = await this.UserModel.findByIdAndUpdate({
      id: new Types.ObjectId(req.decoded?._id),
      data: { pictureCover: key },
      option: { new: false },
    })

    if (user?.pictureCover?.length) {
      await deleteFiles({ urls: user.pictureCover as string[] })
    }

    return successResponse({ res, status: 200, data: { key } as Object })
  }
  freezeAccount = async (req: Request, res: Response) => {
    const { userId } = req.params
    if (userId && req?.user?.role != roleEnum.Admin) {
      throw new AppError('not authorized account', 403)
    }
    const user = await this.UserModel.updateOne({
      filter: {
        _id: userId || req.decoded?._id,
        freezeAt: { $exists: false },
      },
      data: {
        freezeAt: new Date(),
        freezeBy: req.user?._id,
        changeCredentialsTime: new Date(),
        $unset: { restoreAt: 1, restoreBy: 1 },
      },
    })

    if (!user.matchedCount) {
      throw new AppError('fail to freeze this account', 404)
    }
    return successResponse({ res })
  }
  hardDelete = async (req: Request, res: Response) => {
    const { userId } = req.params
    // if (userId && req?.user?.role != roleEnum.Admin) {
    //   throw new AppError('not authorized account', 403)
    // }
    if (!req.user?.freezeAt) {
      throw new AppError('not freezed account ', 404)
    }
    const user = await this.UserModel.deleteOne({
      filter: {
        _id: userId,
        freezeAt: { $exists: true },
      },
    })

    if (!user.deletedCount) {
      throw new AppError('fail to hard delete this account', 404)
    }
    await deleteFolderByPrefix({ path: `users/${userId}` })
    return successResponse({ res })
  }
  // graphql

  hello = async(context: any) => {

    console.log(  context.user  );
    
    return 'hello' 
  }
  allUser = async(args:any,authUser:IUser) => {

    console.log(  authUser );
   const user =  await this.UserModel.find({filter: { $ne : {_id:authUser._id}}})
    if (!user){
      throw new GraphQLError("not matched user ")
    }
    return  user
  }
}

export default new UserService()
