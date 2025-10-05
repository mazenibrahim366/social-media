"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQlUniformResponse = void 0;
const graphql_1 = require("graphql");
const GraphQlUniformResponse = ({ name, data, }) => {
    return new graphql_1.GraphQLObjectType({
        name: 'RootSchemaQuery',
        description: 'optional text ',
        fields: {
            message: { type: graphql_1.GraphQLString },
            statusCode: { type: graphql_1.GraphQLInt },
            data: { type: data },
        },
    });
};
exports.GraphQlUniformResponse = GraphQlUniformResponse;
