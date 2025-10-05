import {
  GraphQLList,
  GraphQLNonNull,

  GraphQLString,
} from 'graphql'
import { UserResolver } from './user.resolver'
import { allUser } from './user.types.gql'

class UserGQLSchema {
  private userResolver = new UserResolver()
  constructor() {}
  registerQuery = () => {
    return {
      // hello: {
      //   type: hello,
      //   // description:"",
      //   args: {
      //     name: {
      //       type: new GraphQLNonNull(GraphQLString),
      //     },
      //   },
      //   resolve: this.userResolver.hello,
      // },
      allUser: {
        type: new GraphQLList(allUser),
        // description:"",

        args: {
          name: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: this.userResolver.allUser,
      },
    }
  }
  registerMutation = () => {
    return {}
  }
}
export default new UserGQLSchema()
