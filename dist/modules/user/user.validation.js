"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hallo = exports.unFriend = exports.blockUser = exports.UnAcceptFriendRequest = exports.acceptFriendRequest = exports.changeRole = exports.sendFriendRequest = exports.freezeAccount = exports.logout = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const enums_1 = require("../../utils/enums");
exports.logout = {
    body: zod_1.default.strictObject({
        flag: zod_1.default.enum(enums_1.logoutEnum).default(enums_1.logoutEnum.signout),
    }),
};
exports.freezeAccount = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
};
exports.sendFriendRequest = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
};
exports.changeRole = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.default.strictObject({
        role: zod_1.default.enum(enums_1.roleEnum),
    }),
};
exports.acceptFriendRequest = {
    params: zod_1.default.strictObject({
        requestId: validation_middleware_1.generalFields.id,
    }),
};
exports.UnAcceptFriendRequest = {
    params: zod_1.default.strictObject({
        requestId: validation_middleware_1.generalFields.id,
    }),
};
exports.blockUser = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
};
exports.unFriend = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
};
exports.hallo = zod_1.default.strictObject({
    name: zod_1.default.string().min(2),
});
