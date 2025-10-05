import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLString,
} from 'graphql'

export const GraphQlUniformResponse = ({
  name,
  data,
}: {
  name: string
  data: GraphQLOutputType
}) => {
  return new GraphQLObjectType({
    name: 'RootSchemaQuery',
    description: 'optional text ',
    fields: {
      message: { type: GraphQLString },
      statusCode: { type: GraphQLInt },
      data: { type: data },
    },
  })
}
