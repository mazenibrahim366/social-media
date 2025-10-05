import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { IUser } from '../../DB/models/models.dto'
import { genderEnum, providerEnum, roleEnum } from './../../utils/enums'
export const GraphQLGenderEnum = new GraphQLEnumType({
  name: 'GraphQLEnumType',
  values: {
    male: { value: genderEnum.male },
    female: { value: genderEnum.female },
  },
})
export const GraphQLRoleEnum = new GraphQLEnumType({
  name: 'GraphQLRoleType',
  values: {
    Admin: { value: roleEnum.Admin },
    User: { value: roleEnum.User },
    superAdmin: { value: roleEnum.superAdmin },
  },
})
export const GraphQLproviderEnum = new GraphQLEnumType({
  name: 'GraphQLproviderType',
  values: {
    google: { value: providerEnum.google },
    system: { value: providerEnum.system },
  },
})
// otpAttempts type
export const GraphQLOtpAttempts = new GraphQLObjectType({
  name: 'GraphQLOtpAttempts',
  fields: {
    count: { type: GraphQLInt },
    bannedUntil: { type: GraphQLString },
  },
})

export const GraphQLOneUserResponse = new GraphQLObjectType({
  name: 'oneUserResponse',
  fields: {
    _id: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    slug: { type: GraphQLString },
    provider: { type: GraphQLproviderEnum },
    phone: { type: GraphQLString },
    confirmEmailOtp: { type: GraphQLString },
    otpExpired: { type: GraphQLString },
    otpAttempts: { type: GraphQLOtpAttempts },

    temProfileImage: { type: GraphQLString },
    picture: { type: GraphQLString },
    pictureCover: {
      type: new GraphQLList(GraphQLString),
      //  count: { type: Number, default: 0 },
      //       bannedUntil: { type: Date },
    },
    gender: { type: GraphQLGenderEnum },
    role: { type: GraphQLRoleEnum },
    confirmEmail: { type: GraphQLString },
    deletedAt: { type: GraphQLString },
    freezeAt: { type: GraphQLString },
    freezeBy: { type: GraphQLID },
    restoreBy: { type: GraphQLID },
    restoreAt: { type: GraphQLString },
    oldPassword: { type: new GraphQLList(GraphQLString) },
    upDatePassword: { type: GraphQLString },
    changeCredentialsTime: { type: GraphQLString },
    confirmPasswordOtp: { type: GraphQLString },
    friend: { type: new GraphQLList(GraphQLString) },
    blockList: { type: new GraphQLList(GraphQLString) },
    fullName: {
      type: GraphQLString,
      resolve: (parent: IUser) => {
        return parent.gender===genderEnum.male ? `Mr : ${parent.fullName}`:`Mis : ${parent.fullName}`
      },
    },
  },
})

export const allUser = GraphQLOneUserResponse
export const hello = { type: GraphQLString }
