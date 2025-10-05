import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { AllowCommentsEnum, AvailabilityEnum } from '../../DB/models/models.dto'
import { userGqlTypes } from '../user'
export const GraphQLAvailabilityEnum = new GraphQLEnumType({
  name: 'GraphQLAvailabilityEnumType',
  values: {
    friends: { value: AvailabilityEnum.friends },
    onlyMe: { value: AvailabilityEnum.onlyMe },
    public: { value: AvailabilityEnum.public },
  },
})
export const GraphQLAllowCommentsEnumEnum = new GraphQLEnumType({
  name: 'GraphQLAllowCommentsEnumType',
  values: {
    allow: { value: AllowCommentsEnum.allow },
    deny: { value: AllowCommentsEnum.deny },
  },
})

export const GraphQLOnePostResponse = new GraphQLObjectType({
  name: 'onePostResponse',
  fields: {
    _id: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: GraphQLString },
    attachments: { type: new GraphQLList(GraphQLString) },
    availability: { type: GraphQLAvailabilityEnum },
    allowComments: { type: GraphQLAllowCommentsEnumEnum },
    assetsFolderId: { type: GraphQLString },
    tag: { type: new GraphQLList(GraphQLID) },
    likes: { type: new GraphQLList(GraphQLID) },
    createdBy: { type:userGqlTypes.GraphQLOneUserResponse },

    freezeBy: { type: GraphQLID },
    freezeAt: { type: GraphQLString },
    comments: { type: new GraphQLList(GraphQLString) },

    restoredBy: { type: GraphQLID },
    restoredAt: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
})
// {docCount,pages,limit :option.limit ,currentPage:page,result}
export const allPosts = new GraphQLObjectType({
  name: 'allPosts',
  fields: {
    result: { type: new GraphQLList(GraphQLOnePostResponse) },
    docCount: { type:GraphQLInt },
    pages: { type: GraphQLInt },
    limit: { type: GraphQLInt },
    currentPage: { type: GraphQLInt },
  },
})
