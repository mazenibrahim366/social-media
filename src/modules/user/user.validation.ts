import z from 'zod'
import { generalFields } from '../../middleware/validation.middleware'
import { logoutEnum, roleEnum } from '../../utils/enums'

export const logout = {
  body: z.strictObject({
    flag: z.enum(logoutEnum).default(logoutEnum.signout),
  }),
}
export const freezeAccount = {
  params: z.strictObject({
    userId: generalFields.id,
  }),
}
export const sendFriendRequest = {
  params: z.strictObject({
    userId: generalFields.id,
  }),
}
export const changeRole = {
  params: z.strictObject({
    userId: generalFields.id,
  }),
  body: z.strictObject({
    role: z.enum(roleEnum),
  }),
}
export const acceptFriendRequest = {
  params: z.strictObject({
    requestId: generalFields.id,
  }),
}
export const UnAcceptFriendRequest = {
  params: z.strictObject({
    requestId: generalFields.id,
  }),
}
export const blockUser = {
  params: z.strictObject({
    userId: generalFields.id,
  }),
}
export const unFriend = {
  params: z.strictObject({
    userId: generalFields.id,
  }),
}
export const hallo = z.strictObject({
  name:z.string().min(2),
})
