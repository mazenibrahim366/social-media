import { GraphQLOneUserResponse } from './../user/user.types.gql';

import { argsPost, typesPost } from '.';

import { postResolver } from './post.resolver';

class postGqlSchema {
  private postResolver :postResolver= new postResolver()
  constructor() {
    
  }
  registerQuery = ()=>{
    return { allPosts:{
       type: typesPost.allPosts,
              // description:"",

              args: argsPost.allPosts,
              resolve: this.postResolver.allPosts,

      
    }}
   
  }
  registerMutation = ()=>{
    return { likePost:{
       type: typesPost.GraphQLOnePostResponse,
              // description:"",

              args: argsPost.likePost,
              resolve: this.postResolver.likePost,

      
    }}
   
  }
}
export default new postGqlSchema ()