import { graphAuthorization } from '../../middleware/authentication.middleware'
import { GraphValidation } from '../../middleware/validation.middleware'
import { IAuthGraph } from './../graphql/schema.interface'

import { endPoint } from './authorization.user'
import { UserService } from './user.service'
import * as validators from './user.validation'
export class UserResolver {
  private userService: UserService = new UserService()
  constructor() {}
  hello = async (parent: unknown, args: any, context: IAuthGraph) => {
    await GraphValidation<{ name: string }>(validators.hallo, args)
    await graphAuthorization(endPoint.hallo, context.user.role)

    return this.userService.hello(context)
  }
  allUser = async (parent: unknown, args: any, context: IAuthGraph) => {
    // await GraphValidation<{gender:string}>( validators.hallo,args)
    // await graphAuthorization( endPoint.hallo,  context.user.role)

    return await this.userService.allUser(args, context.user)
  }
}
// export default  new userResolver
