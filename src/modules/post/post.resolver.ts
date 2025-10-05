import { PostService} from './post.service';
import { IAuthGraph } from '../graphql/schema.interface'
import { LikeActionEnum } from '../../DB/models/models.dto';

export class postResolver {
  private postService = new PostService()
  constructor() {}

  allPosts = async (parent: unknown, args: {page:number ,size : number}, context: IAuthGraph) => {
return await this.postService.allPosts(args,context.user )
  }
  likePost = async (parent: unknown, args: {postId:string ,action : LikeActionEnum}, context: IAuthGraph) => {
return await this.postService.likeGraphPost(args,context.user )
  }
}
