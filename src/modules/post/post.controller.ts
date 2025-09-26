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
import commentRouter from '../comment/comment.controller'
import { endPoint } from './authorization.post'
import { postService } from './post.service'
import * as validators from './post.validation'

const router = Router({ mergeParams: true })
router.use('/:postId/comment', commentRouter)

router.get(
  '/PostWithComments',
  authentication(),
  // validation(validators.hardDelete),
  postService.getPostWithComments
)
router.get(
  '/',
  authentication(),
  // validation(validators.updatePost),
  postService.postList
)

router.patch(
  '/:postId/update',
  cloudFileUpload({ validation: fileValidation.image }).array('attachments', 2),
  authentication(),
  validation(validators.updatePost),
  postService.updatePost
)
router.post(
  '/',
  authentication(),
  cloudFileUpload({ validation: fileValidation.image }).array('attachments', 2),
  validation(validators.createPost),
  authorization(endPoint.createPost),
  postService.createPost
)
router.post(
  '/:postId/like',
  authentication(),
  validation(validators.likePost),
  postService.likePost
)
router.delete(
  '/:postId/hardDelete',
  authentication(),
  validation(validators.hardDelete),
  postService.hardDeletePost
)
router.delete(
  '/:postId/freeze',
  authentication(),
  validation(validators.hardDelete),
  postService.freezePost
)
router.get(
  '/:postId',
  authentication(),
  validation(validators.hardDelete),
  postService.getPost
)

export default router
