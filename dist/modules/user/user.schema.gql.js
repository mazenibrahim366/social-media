"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const user_resolver_1 = require("./user.resolver");
const user_types_gql_1 = require("./user.types.gql");
class UserGQLSchema {
    userResolver = new user_resolver_1.UserResolver();
    constructor() { }
    registerQuery = () => {
        return {
            allUser: {
                type: new graphql_1.GraphQLList(user_types_gql_1.allUser),
                args: {
                    name: {
                        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    },
                },
                resolve: this.userResolver.allUser,
            },
        };
    };
    registerMutation = () => {
        return {};
    };
}
exports.default = new UserGQLSchema();
