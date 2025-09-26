"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nanoid_1 = require("nanoid");
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const repository_1 = require("../../DB/repository/");
const newConfirmOtp_email_1 = require("../../utils/Email/newConfirmOtp.email");
const enums_1 = require("../../utils/enums");
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const encryption_security_1 = require("../../utils/security/encryption.security");
const hash_security_1 = require("../../utils/security/hash.security");
const token_security_1 = require("../../utils/security/token.security");
const { OAuth2Client } = require('google-auth-library');
async function verify(idToken) {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
}
class AuthenticationService {
    UserModel = new repository_1.UserRepository(User_model_1.default);
    constructor() { }
    signupByGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, email_verified, name, picture } = await verify(idToken);
        if (!email_verified) {
            throw new error_response_1.AppError('Email not verified', 400);
        }
        const user = await this.UserModel.findOne({ filter: { email } });
        if (user) {
            return new error_response_1.AppError('Email exist', 409);
        }
        const [signupUser] = (await this.UserModel.create({
            data: [
                {
                    fullName: name,
                    email,
                    provider: enums_1.providerEnum.google,
                    picture,
                    confirmEmail: Date.now(),
                },
            ],
        }));
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { signupUser },
        });
    };
    loginByGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, email_verified } = await verify(idToken);
        if (!email_verified) {
            throw new error_response_1.AppError('Email not verified', 400);
        }
        const user = await this.UserModel.findOne({
            filter: { email, provider: enums_1.providerEnum.google },
        });
        if (!user) {
            throw new error_response_1.AppError('In-valid login data or provider', 400);
        }
        const data = await (0, token_security_1.generateLoginToken)(user);
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: process.env.MOOD === 'development' ? { data } : {},
        });
    };
    signup = async (req, res) => {
        let dateExpired = new Date(Date.now() + 2 * 60 * 1000);
        const { fullName, email, password, phone } = req.body;
        const encPhone = await (0, encryption_security_1.encryptEncryption)({ message: phone });
        const user = await this.UserModel.findOne({
            filter: { email },
        });
        if (user) {
            throw new error_response_1.AppError('Email exist', 409);
        }
        const otp = (0, nanoid_1.customAlphabet)('0123456789', 6)();
        const [signupUser] = (await this.UserModel.create({
            data: [
                {
                    fullName,
                    email,
                    password,
                    phone: encPhone,
                    confirmEmailOtp: otp,
                    otpExpired: dateExpired,
                    otpAttempts: { bannedUntil: null, count: 0 },
                },
            ],
        }));
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: process.env.MOOD === 'development' ? { signupUser } : {},
        });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.UserModel.findOne({
            filter: { email, provider: enums_1.providerEnum.system },
        });
        if (!user) {
            throw new error_response_1.AppError('In-valid login data or provider or email not confirmed', 404);
        }
        if (!user.confirmEmail) {
            throw new error_response_1.BadError('please verify your access first ');
        }
        if (user.deletedAt) {
            throw new error_response_1.BadError('this account is deleted');
        }
        if (!(await (0, hash_security_1.compareHash)({ plainText: password, hashValue: user.password }))) {
            throw new error_response_1.AppError('In-valid login data', 404);
        }
        const data = await (0, token_security_1.generateLoginToken)(user);
        return (0, success_response_1.successResponse)({ res, status: 200, data });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.UserModel.findOne({
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
        if (user.otpExpired && user.otpExpired < new Date()) {
            throw new error_response_1.BadError(`OTP Expired `);
        }
        if (user.otpAttempts.bannedUntil &&
            user.otpAttempts.bannedUntil > new Date()) {
            throw new error_response_1.BadError(`You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`);
        }
        if (!(await (0, hash_security_1.compareHash)({ plainText: otp, hashValue: user.confirmEmailOtp }))) {
            throw new error_response_1.BadError('In-valid OTP');
        }
        await this.UserModel.updateOne({
            filter: { email },
            data: {
                $set: { confirmEmail: Date.now() },
                $unset: { confirmEmailOtp: 1, otpExpired: 1, otpAttempts: 1 },
            },
        });
        return (0, success_response_1.successResponse)({ res });
    };
    newConfirmEmail = async (req, res) => {
        const { email } = req.body;
        await (0, newConfirmOtp_email_1.newConfirmOtp)({ email, subject: 'Confirm-Email', res });
    };
    newConfirmPassword = async (req, res) => {
        const { email } = req.body;
        await (0, newConfirmOtp_email_1.newOtpPassword)({ email, subject: 'Confirm Password', res });
        return (0, success_response_1.successResponse)({ res });
    };
    verifyForgotPassword = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.UserModel.findOne({
            filter: {
                email,
                provider: enums_1.providerEnum.system,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                confirmPasswordOtp: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.AppError('In-valid account', 404);
        }
        if (user.confirmEmailOtp) {
            throw new error_response_1.AppError('In-valid login data or provider or email not confirmed', 404);
        }
        if (user.otpExpired && user.otpExpired < new Date()) {
            throw new error_response_1.AppError(`OTP Expired `, 400);
        }
        if (user.otpAttempts.bannedUntil &&
            user.otpAttempts.bannedUntil > new Date()) {
            throw new error_response_1.AppError(`You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`, 400);
        }
        if (!(await (0, hash_security_1.compareHash)({
            plainText: otp,
            hashValue: user.confirmPasswordOtp,
        }))) {
            throw new error_response_1.AppError('In-valid OTP', 400);
        }
        return (0, success_response_1.successResponse)({ res });
    };
    forgotPassword = async (req, res) => {
        const { email, password, otp } = req.body;
        const user = await this.UserModel.findOne({
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
        if (user.otpExpired && user.otpExpired < new Date()) {
            throw new error_response_1.AppError(`OTP Expired `, 400);
        }
        if (user.otpAttempts.bannedUntil &&
            user.otpAttempts.bannedUntil > new Date()) {
            throw new error_response_1.AppError(`You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`, 400);
        }
        if (!(await (0, hash_security_1.compareHash)({
            plainText: otp,
            hashValue: user.confirmPasswordOtp,
        }))) {
            throw new error_response_1.AppError('In-valid OTP', 400);
        }
        if (user.oldPassword?.length) {
            for (const historyPassword of user.oldPassword) {
                if (await (0, hash_security_1.compareHash)({ plainText: password, hashValue: historyPassword })) {
                    throw new error_response_1.AppError('this password is used before In-valid old ', 400);
                }
            }
        }
        const hashPassword = await (0, hash_security_1.generateHash)({ plainText: password });
        await this.UserModel.updateOne({
            filter: { email },
            data: {
                $set: {
                    updatePassword: Date.now(),
                    changeCredentialsTime: new Date(),
                    password: hashPassword,
                },
                $unset: { confirmPasswordOtp: 1, otpExpired: 1, otpAttempts: 1 },
                $inc: { __v: 1 },
                $push: { oldPassword: user.password },
            },
        });
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new AuthenticationService();
