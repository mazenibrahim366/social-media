"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = exports.allUser = exports.GraphQLOneUserResponse = exports.GraphQLOtpAttempts = exports.GraphQLproviderEnum = exports.GraphQLRoleEnum = exports.GraphQLGenderEnum = void 0;
const graphql_1 = require("graphql");
const enums_1 = require("./../../utils/enums");
exports.GraphQLGenderEnum = new graphql_1.GraphQLEnumType({
    name: 'GraphQLEnumType',
    values: {
        male: { value: enums_1.genderEnum.male },
        female: { value: enums_1.genderEnum.female },
    },
});
exports.GraphQLRoleEnum = new graphql_1.GraphQLEnumType({
    name: 'GraphQLRoleType',
    values: {
        Admin: { value: enums_1.roleEnum.Admin },
        User: { value: enums_1.roleEnum.User },
        superAdmin: { value: enums_1.roleEnum.superAdmin },
    },
});
exports.GraphQLproviderEnum = new graphql_1.GraphQLEnumType({
    name: 'GraphQLproviderType',
    values: {
        google: { value: enums_1.providerEnum.google },
        system: { value: enums_1.providerEnum.system },
    },
});
exports.GraphQLOtpAttempts = new graphql_1.GraphQLObjectType({
    name: 'GraphQLOtpAttempts',
    fields: {
        count: { type: graphql_1.GraphQLInt },
        bannedUntil: { type: graphql_1.GraphQLString },
    },
});
exports.GraphQLOneUserResponse = new graphql_1.GraphQLObjectType({
    name: 'oneUserResponse',
    fields: {
        _id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        firstName: { type: graphql_1.GraphQLString },
        lastName: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        password: { type: graphql_1.GraphQLString },
        slug: { type: graphql_1.GraphQLString },
        provider: { type: exports.GraphQLproviderEnum },
        phone: { type: graphql_1.GraphQLString },
        confirmEmailOtp: { type: graphql_1.GraphQLString },
        otpExpired: { type: graphql_1.GraphQLString },
        otpAttempts: { type: exports.GraphQLOtpAttempts },
        temProfileImage: { type: graphql_1.GraphQLString },
        picture: { type: graphql_1.GraphQLString },
        pictureCover: {
            type: new graphql_1.GraphQLList(graphql_1.GraphQLString),
        },
        gender: { type: exports.GraphQLGenderEnum },
        role: { type: exports.GraphQLRoleEnum },
        confirmEmail: { type: graphql_1.GraphQLString },
        deletedAt: { type: graphql_1.GraphQLString },
        freezeAt: { type: graphql_1.GraphQLString },
        freezeBy: { type: graphql_1.GraphQLID },
        restoreBy: { type: graphql_1.GraphQLID },
        restoreAt: { type: graphql_1.GraphQLString },
        oldPassword: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        upDatePassword: { type: graphql_1.GraphQLString },
        changeCredentialsTime: { type: graphql_1.GraphQLString },
        confirmPasswordOtp: { type: graphql_1.GraphQLString },
        friend: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        blockList: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        fullName: {
            type: graphql_1.GraphQLString,
            resolve: (parent) => {
                return parent.gender === enums_1.genderEnum.male ? `Mr : ${parent.fullName}` : `Mis : ${parent.fullName}`;
            },
        },
    },
});
exports.allUser = exports.GraphQLOneUserResponse;
exports.hello = { type: graphql_1.GraphQLString };
