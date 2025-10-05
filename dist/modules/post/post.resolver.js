"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postResolver = void 0;
const post_service_1 = require("./post.service");
class postResolver {
    postService = new post_service_1.PostService();
    constructor() { }
    allPosts = async (parent, args, context) => {
        return await this.postService.allPosts(args, context.user);
    };
    likePost = async (parent, args, context) => {
        return await this.postService.likeGraphPost(args, context.user);
    };
}
exports.postResolver = postResolver;
