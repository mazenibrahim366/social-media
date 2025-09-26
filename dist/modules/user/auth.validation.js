"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newConfirmEmail = exports.confirmEmail = exports.login = exports.signup = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.signup = {
    body: zod_1.default
        .strictObject({
        fullName: validation_middleware_1.generalFields.fullName,
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
        phone: validation_middleware_1.generalFields.phone,
    })
        .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    }),
};
exports.login = {
    body: zod_1.default
        .strictObject({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    })
};
exports.confirmEmail = {
    body: zod_1.default
        .strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp,
    })
};
exports.newConfirmEmail = {
    body: zod_1.default
        .strictObject({
        email: validation_middleware_1.generalFields.email,
    })
};
