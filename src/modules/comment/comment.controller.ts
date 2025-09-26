import { Router } from 'express'
import {
  authentication,
  authorization,
} from '../../middleware/authentication.middleware'
import { validation } from '../../middleware/validation.middleware'
// import { tokenTypeEnum } from '../../utils/enums'
import {
  cloudFileUpload,
  fileValidation,
} from '../../utils/multer/cloud.multer'
import { endPoint } from './authorization.comment'
import { commentService } from './comment.service'
import * as validators from './comment.validation'

const router = Router({ mergeParams: true })

router.patch(
  '/:commentId/update',
  cloudFileUpload({ validation: fileValidation.image }).array('attachments', 2),
  authentication(),
  validation(validators.updateComment),
  commentService.updateComment
)
router.post(
  '/',
  authentication(),
  cloudFileUpload({ validation: fileValidation.image }).array('attachments', 2),
  validation(validators.createComment),
  authorization(endPoint.createComment),
  commentService.createComment
)
router.post(
  '/:commentId/reply',
  authentication(),
  cloudFileUpload({ validation: fileValidation.image }).array('attachments', 2),
  validation(validators.replyOnComment),

  commentService.replyOnComment
)

router.delete(
  '/:commentId/hardDelete',
  authentication(),
  validation(validators.hardDelete),
  commentService.hardDeleteComment
)
router.delete(
  '/:commentId/freeze',
  authentication(),
  validation(validators.hardDelete),
  commentService.freezeComment
)

router.get(
  '/:commentId',
  authentication(),
  validation(validators.hardDelete),
  commentService.getComment
)
router.get(
  '/:commentId/reply',
  authentication(),
  validation(validators.hardDelete),
  commentService.getCommentWithReply
)

router.post(
  '/:commentId/like',
  authentication(),
  validation(validators.likeComment),
  commentService.likeComment
)

export default router
