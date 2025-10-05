import type { Request, Response } from 'express'
import UserModels from '../../DB/models/User.model'
import {
  CommentRepository,
  PostRepository,
  UserRepository,
} from '../../DB/repository'
// import { AppError, BadError } from '../../utils/response/error.response'

import { Types, UpdateQuery } from 'mongoose'
import { nanoid } from 'nanoid'
import CommentModels from '../../DB/models/Comment.model'
import {
  AllowCommentsEnum,
  AvailabilityEnum,
  IPost,
  IUser,
  LikeActionEnum,
} from '../../DB/models/models.dto'
import PostModels from '../../DB/models/Post.model'
import { emailEvent } from '../../utils/Email/email.events'
import {
  deleteFiles,
  deleteFolderByPrefix,
  uploadFiles,
} from '../../utils/multer/s3.config'
import { AppError, BadError } from '../../utils/response/error.response'
import { successResponse } from '../../utils/response/success.response'
import { connectedSockets, getIo } from '../gateway'
import { LikePostQueryInputDto } from './dto/post.dto'
export const postAvailabilityByUser = (user: IUser) => {
  return [
    { availability: AvailabilityEnum.public },
    { availability: AvailabilityEnum.onlyMe, createdBy: user?._id },
    {
      availability: AvailabilityEnum.friends,
      createdBy: { $in: [...(user?.friend || []), user?._id] },
    },
    {
      availability: { $ne: AvailabilityEnum.onlyMe },
      tag: { $in: user?._id },
    },
  ]
}
export const postAvailability = (req: Request) => {
  return [
    { availability: AvailabilityEnum.public },
    { availability: AvailabilityEnum.onlyMe, createdBy: req.user?._id },
    {
      availability: AvailabilityEnum.friends,
      createdBy: { $in: [...(req.user?.friend || []), req.user?._id] },
    },
    {
      availability: { $ne: AvailabilityEnum.onlyMe },
      tag: { $in: req.user?._id },
    },
  ]
}
export class PostService {
  private UserModel = new UserRepository(UserModels)
  private CommentModel = new CommentRepository(CommentModels)

  private PostModel = new PostRepository(PostModels)

  constructor() {}
  getPost = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string }

    const getPost = await this.PostModel.findOne({
      filter: { _id: postId, createdBy: req.user?._id },
      option: { populate: [{ path: 'comments' }] },
    })
    console.log(req.user?._id)

    if (!getPost) {
      throw new BadError('fail to get  this post ')
    }
    return successResponse({
      res,
      status: 200,
      data: { getPost },
    })
  }
  createPost = async (req: Request, res: Response) => {
    const checkTags = (await this.UserModel.find({
      filter: { _id: { $in: req.body.tag, $ne: req.user?._id } },
    })) as unknown as IUser[]
    if (req.body.tag?.length && checkTags?.length !== req.body.tag?.length) {
      throw new AppError('some mentioned users are not exist', 404)
    }
    let attachments: string[] = []
    let assetsFolderId: string = nanoid()
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user?._id}/post/${assetsFolderId}`,
      })
    }

    //  send email to mention
    if (req.body.tag?.length) {
      const emailsTag = await Promise.all(
        req.body.tag?.map(async (id: string) => {
          const doc = await this.UserModel.findById({ id })
          return doc?.email
        })
      )
      console.log(emailsTag)
      emailEvent.emit('sendListEmails', [
        emailsTag,
        'mentioned by',
        req.user?.slug,
      ])
    }
    const [post]: any = await this.PostModel.create({
      data: [
        { ...req.body, attachments, assetsFolderId, createdBy: req.user?._id },
      ] as IPost[],
    })
    if (!post) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments })
      }
      throw new BadError('fail to create this post ')
    }
    return successResponse({
      res,
      status: 201,
      data: { post },
    })
  }
  updatePost = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string }
    // const {content , allowComments , availability ,removeAttachments , removeTag, tag} = req.body as updatePostDto
    // console.log({ maosirsfousdgu: req.body            })

    const post = (await this.PostModel.findOne({
      filter: {
        _id: postId,
        createdBy: req.user?._id,
      },
    })) as unknown as IPost
    if (!post) {
      throw new AppError('fail to find matching result', 404)
    }
    // if (req.body.removeAttachments?.length && post.attachments?.length) {
    //   post.attachments = post.attachments.filter((attachment: string) => {
    //     if (!req.body.removeAttachments.includes(attachment)) {
    //       return attachment
    //     }
    //     return
    //   })
    // }
    const checkTags = (await this.UserModel.find({
      filter: { _id: { $in: req.body?.tag, $ne: req.user?._id } },
    })) as unknown as IUser[]
    if (req.body?.tag?.length && checkTags?.length !== req.body?.tag?.length) {
      throw new AppError('some mentioned users are not exist', 404)
    }
    let attachments: string[] = []

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post?.createdBy}/post/${post?.assetsFolderId}`,
      })
      // post.attachments = [...post.attachments ||[] , ...attachments]
    }

    const updated = await this.PostModel.updateOne({
      filter: { _id: post._id },
      data: [
        {
          $set: {
            content: req.body?.content,
            allowComments: req.body?.allowComments || post?.allowComments,
            availability: req.body?.availability || post?.availability,
            attachments: {
              $setUnion: [
                {
                  $setDifference: [
                    '$attachments',
                    req.body?.removeAttachments || [],
                  ],
                },
                attachments,
              ],
            },
            tag: {
              $setUnion: [
                {
                  $setDifference: [
                    '$tag',
                    (req.body?.removeTag || []).map((tag: string) => {
                      return Types.ObjectId.createFromHexString(tag)
                    }),
                  ],
                },
                (req.body?.tag || []).map((tag: string) => {
                  return Types.ObjectId.createFromHexString(tag)
                }),
              ],
            },
          },
        },
      ],
    })
    if (!updated.matchedCount) {
      if (attachments?.length) {
        await deleteFiles({ urls: attachments })
      }
      throw new BadError('fail to create this post ')
    } else {
      if (req.body?.removeAttachments?.length) {
        await deleteFiles({ urls: req.body?.removeAttachments })
      }
    }
    return successResponse({
      res,
      status: 201,
      data: { post },
    })
  }
  likePost = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string }
    const { action }: LikePostQueryInputDto = req.query
    console.log(req.body)

    let updateData: UpdateQuery<IPost> = { $addToSet: { likes: req.user?.id } }
    if (action && action == LikeActionEnum.unlike) {
      updateData = { $pull: { likes: req.user?.id } }
    }

    const post = await this.PostModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailability(req),
      },
      data: updateData,
    })
    if (!post) {
      throw new AppError('invalid postId or post not exist  ', 404)
    }
    if (action !== LikeActionEnum.unlike) {
      getIo()
        .to(connectedSockets.get(post.createdBy.toString()) as string[])
        .emit('likePost', { postId, userId: req.user?._id })
    }
    return successResponse({
      res,
      status: 201,
    })
  }
  postList = async (req: Request, res: Response) => {
    let { page, size } = req.query as unknown as {
      page: number
      size: number
    }

    const posts = await this.PostModel.paginate({
      filter: {
        $or: postAvailability(req),
      },
      option: {
        populate: [
          {
            path: 'comments',
            match: {
              commentId: { $exists: false },
              freezeAt: { $exists: false },
            },
            populate: [
              { path: 'reply', match: { commentId: { $exists: false } } },
            ],
          },
        ],
      },
      page,
      size,
    })
    if (!posts) {
      throw new AppError('invalid postId or post not exist  ', 404)
    }
    return successResponse({
      res,
      status: 201,
      data: posts,
    })
  }
  freezePost = async (req: Request, res: Response) => {
    const { postId } = req.params as {
      postId: string
    }
    const post = await this.PostModel.updateOne({
      filter: {
        _id: postId,
        createdBy: req.user?._id,

        allowComments: AllowCommentsEnum.allow,
        freezeAt: { $exists: false },
      },
      data: {
        freezeAt: new Date(),
        freezeBy: req.user?._id,
        $unset: { restoreAt: 1, restoreBy: 1 },
      },
    })

    if (!post.matchedCount) {
      throw new AppError('fail to freeze this post  ', 404)
    }
    return successResponse({ res })
  }
  hardDeletePost = async (req: Request, res: Response) => {
    const { postId } = req.params as {
      postId: string
    }
    const post = await this.PostModel.findOne({
      filter: {
        _id: postId,
        createdBy: req.user?._id,
        paranoid: false,
      },
      option: {
        populate: [
          {
            path: 'comments',
          },
        ],
      },
    })
    console.log(post, postId)

    if (!post) {
      throw new AppError('post is not exist ', 404) // not found
    }

    if (!post?.freezeAt) {
      throw new AppError('not freezed post ', 404)
    }
    if (post.comments?.length) {
      const deleteComment = await this.CommentModel.deleteMany({
        filter: {
          postId,
        },
      })
      if (!deleteComment.deletedCount) {
        throw new AppError('fail to hard delete this comment', 404)
      }
    }

    const deletePost = await this.PostModel.deleteOne({
      filter: {
        _id: postId,

        freezeAt: { $exists: true },
      },
    })

    if (!deletePost.deletedCount) {
      throw new AppError('fail to hard delete this comment', 404)
    }
    await deleteFolderByPrefix({
      path: `users/${post?.createdBy}/post/${post?.assetsFolderId}`,
    })
    return successResponse({ res, data: post })
  }

  getPostWithComments = async (req: Request, res: Response) => {
    // let { page, size } = req.query as unknown as {
    //   page: number
    //   size: number
    // }
    const posts: any = await this.PostModel.findCursor({
      filter: {
        $or: postAvailability(req),
      },
    })

    if (!posts) {
      throw new AppError('invalid postId or post not exist  ', 404)
    }
    // let result = []
    // for (const post of posts.result as unknown as IPost[]) {
    //   const comments = await this.CommentModel.find({
    //     filter: { postId: post._id, commentId: { $exists: false } },
    //   })
    //   if (!comments) {
    //     throw new BadError('fail to get this comment ')
    //   }
    //   result.push({ post, comments })
    // }
    // posts.result = result

    return successResponse({
      res,
      status: 200,
      data: { posts },
    })
  }

  // GQL
  allPosts = async (
    { page, size }: { page: number; size: number },
    authUser: IUser
  ) => {
    const posts: any = await this.PostModel.paginate({
      filter: {
        $or: postAvailabilityByUser(authUser),
      },
      option: {
        populate: [
          {
            path: 'createdBy',
          },
        ],
      },
      page,
      size,
    })
    if (!posts) {
      throw new AppError('invalid postId or post not exist  ', 404)
    }
    return posts
  }
  likeGraphPost = async (
    { postId, action }: {  postId: string;action: LikeActionEnum; },
    authUser: IUser
  ) => {

    let updateData: UpdateQuery<IPost> = { $addToSet: { likes: authUser?.id } }
    if (action && action == LikeActionEnum.unlike) {
      updateData = { $pull: { likes: authUser?.id } }
    }

    const post = await this.PostModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailabilityByUser(authUser),
      },
      data: updateData,
    })
    if (!post) {
      throw new AppError('invalid postId or post not exist  ', 404)
    }
    if (action !== LikeActionEnum.unlike) {
      getIo()
        .to(connectedSockets.get(post.createdBy.toString()) as string[])
        .emit('likePost', { postId, userId: authUser?._id })
    }
    return post
  }
}

export const postService = new PostService()
