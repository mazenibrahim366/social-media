import { Router } from 'express'
import { authentication } from '../../middleware/authentication.middleware'
import { validation } from '../../middleware/validation.middleware'
import { ChatService } from './chat.service'
// import { tokenTypeEnum } from '../../utils/enums'
import * as validators from './chat.validation'
import { cloudFileUpload, fileValidation } from '../../utils/multer/cloud.multer'
  const chatService = new ChatService()

const router = Router({ mergeParams: true })

router.get(
  '/',
  authentication(),
  validation(validators.getChat),
  chatService.getChat
)
router.get(
  '/group/:groupId',
  authentication(),
  validation(validators.getChattingGroup),
  chatService.getChattingGroup
)
router.post(
  '/group',
  cloudFileUpload({validation:fileValidation.image}).single('attachment'),
  authentication(),
  validation(validators.createChattingGroup),
  chatService.createChattingGroup
)

export default router
