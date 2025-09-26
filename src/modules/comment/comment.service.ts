import type { Request, Response } from 'express'
import UserModels from '../../DB/models/User.model'
import {
  CommentRepository,
  PostRepository,
  UserRepository,
} from '../../DB/repository'
// import { AppError, BadError } from '../../utils/response/error.response'

import { Types, UpdateQuery } from 'mongoose'
import CommentModels from '../../DB/models/Comment.model'
import {
  AllowCommentsEnum,
  IComment,
  IPost,
  IUser,
  LikeActionEnum,
} from '../../DB/models/models.dto'
import PostModels from '../../DB/models/Post.model'
import { StorageEnum } from '../../utils/multer/cloud.multer'
import { deleteFiles, uploadFiles } from '../../utils/multer/s3.config'
import { AppError, BadError } from '../../utils/response/error.response'
import { successResponse } from '../../utils/response/success.response'
import { postAvailability } from '../post'

class CommentService {
  private UserModel = new UserRepository(UserModels)

  private PostModel = new PostRepository(PostModels)
  private CommentModel = new CommentRepository(CommentModels)

  constructor() {}
  getComment = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as {
      postId: string
      commentId: string
    }
    const getComment = await this.CommentModel.findOne({
      filter: { _id: commentId, createdBy: req.user?._id, postId },
    })

    if (!getComment) {
      throw new BadError('fail to get this comment ')
    }
    return successResponse({
      res,
      status: 200,
      data: { getComment },
    })
  }
  getCommentWithReply = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as {
      postId: string
      commentId: string
    }
    const getComment = await this.CommentModel.findOne({
      filter: { _id: commentId, createdBy: req.user?._id, postId },
      option: { populate: [{ path: 'replyComment' }] },
    })

    if (!getComment) {
      throw new BadError('fail to get this comment ')
    }
    return successResponse({
      res,
      status: 200,
      data: { getComment },
    })
  }
  createComment = async (req: Request, res: Response) => {
    const { postId } = req.params as { postId: string }
    const post = await this.PostModel.findOne({
      filter: {
        _id: postId,
        allowComments: AllowCommentsEnum.allow,
        $or: postAvailability(req),
      },
    })
    if (!post) {
      throw new AppError('some mentioned account  are not exist', 404) // not found
    }
    console.log({ postId })
    const checkTags = (await this.UserModel.find({
      filter: { _id: { $in: req.body.tag, $ne: req.user?._id } },
    })) as unknown as IUser[]
    if (req.body.tag?.length && checkTags?.length !== req.body.tag?.length) {
      throw new AppError('some mentioned users are not exist', 404)
    }
    let attachments: string[] = []

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        storageApproach: StorageEnum.memory,
        path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
      })
    }
    const [comment]: any = await this.CommentModel.create({
      data: [
        { ...req.body, attachments, postId, createdBy: req.user?._id },
      ] as IComment[],
    })
    if (!comment) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments })
      }
      throw new BadError('fail to create this post ')
    }
    return successResponse({
      res,
      status: 201,
      data: { comment },
    })
  }
  freezeComment = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as {
      postId: string
      commentId: string
    }
    const comment = await this.CommentModel.updateOne({
      filter: {
        _id: commentId,
        postId,
        allowComments: AllowCommentsEnum.allow,
        freezeAt: { $exists: false },
      },
      data: {
        freezeAt: new Date(),
        freezeBy: req.user?._id,
        $unset: { restoreAt: 1, restoreBy: 1 },
      },
    })

    if (!comment.matchedCount) {
      throw new AppError('fail to freeze this comment', 404)
    }
    return successResponse({ res })
  }
  hardDeleteComment = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as {
      postId: string
      commentId: string
    }
    const comment = await this.CommentModel.findOne({
      filter: {
        _id: commentId,
        postId,
        paranoid: false,
      },
      option: {
        populate: [
          {
            path: 'postId',
            // match: {
            //   allowComments: AllowCommentsEnum.allow,
            //   $or: postAvailability(req),
            // },
          },
          {
            path: 'replyComment',
            // match: {
            //   allowComments: AllowCommentsEnum.allow,
            //   $or: postAvailability(req),
            // },
          },
        ],
      },
    })
    console.log({ comment })
    console.log(comment?.replyComment)

    if (!comment) {
      throw new AppError('some mentioned account  are not exist', 404) // not found
    }

    if (!comment?.freezeAt) {
      throw new AppError('not freezed comment ', 404)
    }
    const attachmentReply: string[] =
      comment.replyComment?.flatMap((e) => e.attachments || []) || []

    const deleteComment = await this.CommentModel.deleteOne({
      filter: {
        _id: commentId,
        postId,
        freezeAt: { $exists: true },
      },
    })

    if (comment.replyComment?.length) {
      const deleteReply = await this.CommentModel.deleteMany({
        filter: {
          commentId,
          postId,
        },
      })
      if (!deleteReply.deletedCount) {
        throw new AppError('fail to hard delete this reply comment', 404)
      }
    }

    if (!deleteComment.deletedCount) {
      throw new AppError('fail to hard delete this comment', 404)
    }

    if (comment.attachments?.length) {
      if (attachmentReply) {
        await deleteFiles({
          urls: [
            ...(comment.attachments as string[]),
            ...(attachmentReply as string[]),
          ],
        })
      }
      await deleteFiles({
        urls: comment.attachments as string[],
      })
    }
    return successResponse({ res, data: comment })
  }
  replyOnComment = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as {
      postId: string
      commentId: string
    }
    const comment = await this.CommentModel.findOne({
      filter: {
        _id: commentId,
        postId,
      },
      option: {
        populate: [
          {
            path: 'postId',
            match: {
              allowComments: AllowCommentsEnum.allow,
              $or: postAvailability(req),
            },
          },
        ],
      },
    })
    if (!comment?.postId) {
      throw new AppError('some mentioned account  are not exist', 404) // not found
    }

    const checkTags = (await this.UserModel.find({
      filter: { _id: { $in: req.body.tag, $ne: req.user?._id } },
    })) as unknown as IUser[]
    if (req.body.tag?.length && checkTags?.length !== req.body.tag?.length) {
      throw new AppError('some mentioned users are not exist', 404)
    }
    let attachments: string[] = []

    if (req.files?.length) {
      const post = comment.postId as Partial<IPost>
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        storageApproach: StorageEnum.memory,
        path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
      })
    }
    const [reply]: any = await this.CommentModel.create({
      data: [
        {
          ...req.body,
          attachments,
          postId,
          commentId,
          createdBy: req.user?._id,
        },
      ] as IComment[],
    })
    if (!reply) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments })
      }
      throw new BadError('fail to create this post ')
    }
    return successResponse({
      res,
      status: 201,
      data: { reply },
    })
  }
  updateComment = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as {
      postId: string
      commentId: string
    }
    // const {content , allowComments , availability ,removeAttachments , removeTag, tag} = req.body as updatePostDto
    // console.log({ maosirsfousdgu: req.body            })

    const comment = (await this.CommentModel.findOne({
      filter: {
        _id: commentId,
        postId,
        createdBy: req.user?._id,
      },
      option: { populate: [{ path: 'postId' }] },
    })) as unknown as IComment
    if (!comment) {
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
    let folderId
    if (comment?.postId && !(comment.postId instanceof Types.ObjectId)) {
      folderId = comment.postId.assetsFolderId
    }
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${comment?.createdBy}/post/${
          // comment?.postId?.assetsFolderId
          folderId
        }`,
      })
      // post.attachments = [...post.attachments ||[] , ...attachments]
    }

    const updated = await this.CommentModel.updateOne({
      filter: { _id: comment._id },
      data: [
        {
          $set: {
            content: req.body?.content,

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

      // {
      //   content: req.body.content,
      //   allowComments: req.body.allowComments || post.allowComments,
      //   availability: req.body.availability || post.availability,
      //   attachments: post.attachments,
      //   tag: req.body.tag,
      //   // $addToSet: {
      //   //   attachments: { $each: attachments || [] },
      //   //   tag: { $each: req.body.tag || [] },
      //   // },
      //   // $pull: {
      //   //   attachments: { $in: req.body.removeAttachments || [] },
      //   //   tag: { $in: req.body.removeTag || [] },
      //   // },
      // },
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
      data: { comment },
    })
  }
  likeComment = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as {
      postId: string
      commentId: string
    }
    const { action } = req.query
    console.log(req.body)

    let updateData: UpdateQuery<IComment> = {
      $addToSet: { likes: req.user?.id },
    }
    if (action && action == LikeActionEnum.unlike) {
      updateData = { $pull: { likes: req.user?.id } }
    }

    const comment = await this.CommentModel.findOneAndUpdate({
      filter: {
        _id: commentId,
        postId,
   
      },
      data: updateData,
    })
    if (!comment) {
      throw new AppError('invalid postId or commentId or post or comment not exist  ', 404)
    }
    return successResponse({
      res,
      status: 201,
    })
  }

}

export const commentService = new CommentService()
