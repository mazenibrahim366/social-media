import { roleEnum } from '../../utils/enums'

export const endPoint = {
  createComment: [roleEnum.User, roleEnum.Admin ,roleEnum.superAdmin],
  hardDelete: [roleEnum.Admin ,roleEnum.superAdmin],
}
