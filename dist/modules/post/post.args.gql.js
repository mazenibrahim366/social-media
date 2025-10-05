"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePost = exports.allPosts = void 0;
const graphql_1 = require("graphql");
const models_dto_1 = require("../../DB/models/models.dto");
exports.allPosts = {
    page: {
        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt),
    },
    size: {
        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt),
    },
};
exports.likePost = {
    postId: {
        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
    },
    action: {
        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLEnumType({
            name: "LikeActionEnum",
            values: {
                like: { value: models_dto_1.LikeActionEnum.like },
                unlike: { value: models_dto_1.LikeActionEnum.unlike },
            }
        })),
    },
};
