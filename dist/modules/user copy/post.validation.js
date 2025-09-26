"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.freezeAccount = exports.logout = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../utils/enums");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.logout = {
    body: zod_1.default
        .strictObject({
        flag: zod_1.default.enum(enums_1.logoutEnum).default(enums_1.logoutEnum.signout),
    })
};
exports.freezeAccount = {
    params: zod_1.default
        .strictObject({
        userId: validation_middleware_1.generalFields.id.optional()
    })
};
