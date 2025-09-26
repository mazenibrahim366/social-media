import {z} from "zod";
import { likePost, updatePost } from "../post.validation";

export type LikePostQueryInputDto = z.infer<typeof likePost.query>
export type updatePostDto = z.infer<typeof updatePost.body>