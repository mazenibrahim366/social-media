import { Router } from 'express'
import {
  authentication,
  authorization,
} from '../../middleware/authentication.middleware'
import { validation } from '../../middleware/validation.middleware'
import { tokenTypeEnum } from '../../utils/enums'
import {
  cloudFileUpload,
  fileValidation,
} from '../../utils/multer/cloud.multer'
import { endPoint } from './authorization.user'
import userService from './user.service'
import * as validators from './user.validation'
import { chatRouter } from '../chat'

const router = Router()

router.use("/:userId/chat",chatRouter)  

router.get(
  '/',
  authentication(),
  authorization(endPoint.profile),
  userService.profile
)
router.get(
  '/dashboard',
  authentication(),
  authorization(endPoint.dashboard),
  userService.dashboard
)
router.post(
  '/logout',
  authentication(),
  validation(validators.logout),
  userService.logout
)
router.post(
  '/:userId/sendFriendRequest',
  authentication(),
  validation(validators.sendFriendRequest),
  userService.sendFriendRequest
)
router.post(
  '/acceptFriendRequest/:requestId',
  authentication(),
  validation(validators.acceptFriendRequest),
  userService.acceptFriendRequest
)
router.post(
  '/unAcceptFriendRequest/:requestId',
  authentication(),
  validation(validators.UnAcceptFriendRequest),
  userService.UnAcceptFriendRequest
)
router.post(
  '/:userId/blockUser',
  authentication(),
  validation(validators.blockUser),
  userService.blockUser
)
router.post(
  '/:userId/unFriend',
  authentication(),
  validation(validators.unFriend),
  userService.unFriend
)
router.post(
  '/refreshToken',
  authentication({ tokenType: tokenTypeEnum.refresh }),
  userService.refreshToken
)

router.patch(
  '/:userId/changeRole',
  authentication(),
  authorization(endPoint.profile),
  validation(validators.sendFriendRequest),
  userService.changeRole
)
router.patch(
  '/profileImage',
  authentication(),
  // cloudFileUpload({
  //   validation: fileValidation.image,
  //   storageApproach: StorageEnum.disk,
  // }).single('image'),
  userService.profileImage
)
router.patch(
  '/profileCoverImages',
  authentication(),
  cloudFileUpload({ validation: fileValidation.image }).array('images', 5),
  userService.profileCoverImages
)
router.delete(
  '{/:userId}/freezeAccount',
  authentication(),
  validation(validators.freezeAccount),
  userService.freezeAccount
)
router.delete(
  '{/:userId}/hardDelete',
  authorization(endPoint.hardDelete),
  authentication(),
  validation(validators.freezeAccount),
  userService.hardDelete
)
export default router
