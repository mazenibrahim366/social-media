import { roleEnum } from '../../utils/enums'

export const endPoint = {
  profile: [roleEnum.User, roleEnum.Admin, roleEnum.superAdmin],
  hallo: [roleEnum.User, roleEnum.Admin, roleEnum.superAdmin],
  hardDelete: [roleEnum.Admin, roleEnum.superAdmin],
  dashboard: [roleEnum.Admin, roleEnum.superAdmin],
  changeRole: [roleEnum.Admin, roleEnum.superAdmin],
}
