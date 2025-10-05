import { GraphQLObjectType, GraphQLSchema } from 'graphql'

import { postGqlSchema } from '../post'
import { userGQLSchema } from '../user'

const query = new GraphQLObjectType({
  name: 'RootSchemaQuery',
  description: 'optional text ',
  fields: {
    ...userGQLSchema.registerQuery(),
    ...postGqlSchema.registerQuery(),
  },
})
const mutation = new GraphQLObjectType({
  name: 'RootSchemaMutation',
  description: 'optional text ',
  fields: {
    ...postGqlSchema.registerMutation(),
  },
})

export const schema = new GraphQLSchema({
  query,
  mutation,
})
