"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
const post_1 = require("../post");
const user_1 = require("../user");
const query = new graphql_1.GraphQLObjectType({
    name: 'RootSchemaQuery',
    description: 'optional text ',
    fields: {
        ...user_1.userGQLSchema.registerQuery(),
        ...post_1.postGqlSchema.registerQuery(),
    },
});
const mutation = new graphql_1.GraphQLObjectType({
    name: 'RootSchemaMutation',
    description: 'optional text ',
    fields: {
        ...post_1.postGqlSchema.registerMutation(),
    },
});
exports.schema = new graphql_1.GraphQLSchema({
    query,
    mutation,
});
