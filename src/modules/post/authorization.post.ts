import { roleEnum } from '../../utils/enums'

export const endPoint = {
  createPost: [roleEnum.User, roleEnum.Admin, roleEnum.superAdmin],
  hardDelete: [roleEnum.Admin, roleEnum.superAdmin],
}
