"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allPosts = exports.GraphQLOnePostResponse = exports.GraphQLAllowCommentsEnumEnum = exports.GraphQLAvailabilityEnum = void 0;
const graphql_1 = require("graphql");
const models_dto_1 = require("../../DB/models/models.dto");
const user_1 = require("../user");
exports.GraphQLAvailabilityEnum = new graphql_1.GraphQLEnumType({
    name: 'GraphQLAvailabilityEnumType',
    values: {
        friends: { value: models_dto_1.AvailabilityEnum.friends },
        onlyMe: { value: models_dto_1.AvailabilityEnum.onlyMe },
        public: { value: models_dto_1.AvailabilityEnum.public },
    },
});
exports.GraphQLAllowCommentsEnumEnum = new graphql_1.GraphQLEnumType({
    name: 'GraphQLAllowCommentsEnumType',
    values: {
        allow: { value: models_dto_1.AllowCommentsEnum.allow },
        deny: { value: models_dto_1.AllowCommentsEnum.deny },
    },
});
exports.GraphQLOnePostResponse = new graphql_1.GraphQLObjectType({
    name: 'onePostResponse',
    fields: {
        _id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        content: { type: graphql_1.GraphQLString },
        attachments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        availability: { type: exports.GraphQLAvailabilityEnum },
        allowComments: { type: exports.GraphQLAllowCommentsEnumEnum },
        assetsFolderId: { type: graphql_1.GraphQLString },
        tag: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        likes: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        createdBy: { type: user_1.userGqlTypes.GraphQLOneUserResponse },
        freezeBy: { type: graphql_1.GraphQLID },
        freezeAt: { type: graphql_1.GraphQLString },
        comments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        restoredBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    },
});
exports.allPosts = new graphql_1.GraphQLObjectType({
    name: 'allPosts',
    fields: {
        result: { type: new graphql_1.GraphQLList(exports.GraphQLOnePostResponse) },
        docCount: { type: graphql_1.GraphQLInt },
        pages: { type: graphql_1.GraphQLInt },
        limit: { type: graphql_1.GraphQLInt },
        currentPage: { type: graphql_1.GraphQLInt },
    },
});
