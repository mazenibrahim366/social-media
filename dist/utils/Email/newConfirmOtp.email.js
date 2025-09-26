"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newOtpPassword = exports.newConfirmOtp = void 0;
const nanoid_1 = require("nanoid");
const console_1 = require("console");
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const user_repository_1 = require("../../DB/repository/user.repository");
const enums_1 = require("../enums");
const error_response_1 = require("../response/error.response");
const success_response_1 = require("../response/success.response");
const hash_security_1 = require("../security/hash.security");
const email_events_1 = require("./email.events");
const UserModel = new user_repository_1.UserRepository(User_model_1.default);
const newConfirmOtp = async ({ email = '', subject = 'Confirm-Email', res, }) => {
    const user = await UserModel.findOne({
        filter: {
            email,
            provider: enums_1.providerEnum.system,
            confirmEmail: { $exists: false },
            confirmEmailOtp: { $exists: true },
        },
    });
    if (!user) {
        throw new error_response_1.AppError('In-valid account', 404);
    }
    if (user.otpExpired && user.otpExpired > new Date()) {
        throw new error_response_1.AppError(`wait is not expired , expireDate : ${user.otpExpired.toLocaleTimeString()}`, 401);
    }
    if (user.otpAttempts.bannedUntil &&
        user.otpAttempts.bannedUntil > new Date()) {
        throw new error_response_1.BadError(`You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`);
    }
    const otp = (0, nanoid_1.customAlphabet)('0123456789', 6)();
    const hashOto = await (0, hash_security_1.generateHash)({ plainText: otp });
    await UserModel.updateOne({
        filter: { email },
        data: {
            confirmEmailOtp: hashOto,
            otpExpired: new Date(Date.now() + 2 * 60 * 1000),
            otpAttempts: {
                count: user.otpAttempts.count + 1 >= 5 ? 0 : user.otpAttempts.count + 1,
                bannedUntil: user.otpAttempts.count + 1 >= 5
                    ? new Date(new Date().getTime() + 5 * 60 * 1000)
                    : null,
            },
        },
    });
    console.log(otp);
    email_events_1.emailEvent.emit('sendConfirmEmail', [email, subject, otp]);
    return (0, success_response_1.successResponse)({ res });
};
exports.newConfirmOtp = newConfirmOtp;
const newOtpPassword = async ({ email = '', subject = 'Confirm-Password', res, }) => {
    const user = await UserModel.findOne({
        filter: {
            email,
            provider: enums_1.providerEnum.system,
            confirmEmail: { $exists: true },
            deletedAt: { $exists: false },
        },
    });
    if (!user) {
        throw new error_response_1.AppError('In-valid account', 404);
    }
    if (user.confirmEmailOtp) {
        throw new error_response_1.AppError('In-valid login data or provider or email not confirmed', 404);
    }
    if (user.otpExpired && user.otpExpired > new Date()) {
        throw new error_response_1.AppError(`wait is not expired , expireDate : ${user.otpExpired.toLocaleTimeString()}`, 401);
    }
    if (user.otpAttempts.bannedUntil &&
        user.otpAttempts.bannedUntil > new Date()) {
        throw new error_response_1.BadError(`You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`);
    }
    const otp = (0, nanoid_1.customAlphabet)('0123456789', 6)();
    (0, console_1.log)(otp);
    const hashOto = await (0, hash_security_1.generateHash)({ plainText: otp });
    await UserModel.updateOne({
        filter: { email },
        data: {
            confirmPasswordOtp: hashOto,
            otpExpired: new Date(Date.now() + 2 * 60 * 1000),
            otpAttempts: {
                count: user.otpAttempts.count + 1 >= 5 ? 0 : user.otpAttempts.count + 1,
                bannedUntil: user.otpAttempts.count + 1 >= 5
                    ? new Date(new Date().getTime() + 5 * 60 * 1000)
                    : null,
            },
        },
    });
    email_events_1.emailEvent.emit('sendConfirmEmail', [email, 'Confirm-Password', otp]);
    return (0, success_response_1.successResponse)({ res });
};
exports.newOtpPassword = newOtpPassword;
