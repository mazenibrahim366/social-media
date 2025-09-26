import z from 'zod'
import {
  AllowCommentsEnum,
  AvailabilityEnum,
  LikeActionEnum,
} from '../../DB/models/models.dto'
import { generalFields } from '../../middleware/validation.middleware'
import { fileValidation } from '../../utils/multer/cloud.multer'

export const createComment = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
  body: z
    .object({
      content: z.string().min(2).max(50000).optional(),
      attachments: z
        .array(generalFields.file(fileValidation.image))
        .max(2)
        .optional(),

      tag: z.array(generalFields.id).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.attachments?.length && !data.content) {
        ctx.addIssue({
          code: 'custom',
          path: ['context'],
          message: 'sorry we cannot make post without content or attachment',
        })
      }
      if (
        data.tag?.length &&
        data.tag?.length !== [...new Set(data.tag)]?.length
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['tag'],
          message: 'Duplicated tagged user ',
        })
      }
    }),
}
export const replyOnComment = {
  params: createComment.params.extend({
    commentId: generalFields.id,
  }),
  body: createComment.body,
}
export const updateComment = {
  params: createComment.params.extend({
    commentId: generalFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().min(2).max(50000).optional(),
      attachments: z.array(z.string()).max(2).optional(),
      removeAttachments: z
        .array(generalFields.file(fileValidation.image))
        .max(2)
        .optional(),
      availability: z.enum(AvailabilityEnum).optional(),
      removeTag: z.array(generalFields.id).optional(),

      allowComments: z.enum(AllowCommentsEnum).optional(),
      tag: z.array(generalFields.id).optional(),
    })
    .superRefine((data, ctx) => {
      if (!Object.values(data)?.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['context'],
          message: 'all fields are empty',
        })
      }
      if (
        data.tag?.length &&
        data.tag?.length !== [...new Set(data.tag)]?.length
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['tag'],
          message: 'Duplicated tagged user ',
        })
      }
      if (
        data.removeTag?.length &&
        data.removeTag?.length !== [...new Set(data.tag)]?.length
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['removeTag'],
          message: 'Duplicated tagged user ',
        })
      }
    }),
}
export const likeComment = {
  params: createComment.params.extend({
    commentId: generalFields.id,
  }),
  query: z.strictObject({
    action: z.enum(LikeActionEnum).default(LikeActionEnum.like).optional(),
  }),
}
export const hardDelete = {
  params: createComment.params.extend({
    commentId: generalFields.id,
  }),
}
