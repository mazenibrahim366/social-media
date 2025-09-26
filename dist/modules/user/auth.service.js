"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nanoid_1 = require("nanoid");
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const user_repository_1 = require("../../DB/repository/user.repository");
const newConfirmOtp_email_1 = require("../../utils/Email/newConfirmOtp.email");
const enums_1 = require("../../utils/enums");
const email_events_1 = require("../../utils/Events/email.events");
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const encryption_security_1 = require("../../utils/security/encryption.security");
const hash_security_1 = require("../../utils/security/hash.security");
const token_security_1 = require("../../utils/security/token.security");
class AuthenticationService {
    UserModel = new user_repository_1.UserRepository(User_model_1.default);
    constructor() { }
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
        const hashOto = await (0, hash_security_1.generateHash)({ plainText: otp });
        const hashPassword = await (0, hash_security_1.generateHash)({ plainText: password });
        email_events_1.emailEvent.emit('sendConfirmEmail', [email, 'Confirm-Email', otp]);
        const [signupUser] = (await this.UserModel.create({
            data: [
                {
                    fullName,
                    email,
                    password: hashPassword,
                    phone: encPhone,
                    confirmEmailOtp: hashOto,
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
}
exports.default = new AuthenticationService();
