"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const post_resolver_1 = require("./post.resolver");
class postGqlSchema {
    postResolver = new post_resolver_1.postResolver();
    constructor() {
    }
    registerQuery = () => {
        return { allPosts: {
                type: _1.typesPost.allPosts,
                args: _1.argsPost.allPosts,
                resolve: this.postResolver.allPosts,
            } };
    };
    registerMutation = () => {
        return { likePost: {
                type: _1.typesPost.GraphQLOnePostResponse,
                args: _1.argsPost.likePost,
                resolve: this.postResolver.likePost,
            } };
    };
}
exports.default = new postGqlSchema();
