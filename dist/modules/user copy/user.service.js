"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const repository_1 = require("../../DB/repository/");
const mongoose_1 = require("mongoose");
const Token_model_1 = __importDefault(require("../../DB/models/Token.model"));
const enums_1 = require("../../utils/enums");
const s3_config_1 = require("../../utils/multer/s3.config");
const s3_events_1 = require("../../utils/multer/s3.events");
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const encryption_security_1 = require("../../utils/security/encryption.security");
const token_security_1 = require("../../utils/security/token.security");
class UserService {
    UserModel = new repository_1.UserRepository(User_model_1.default);
    TokenModel = new repository_1.TokenRepository(Token_model_1.default);
    constructor() { }
    profile = async (req, res) => {
        const user = await this.UserModel.findById({
            id: req.user?._id,
            select: ' -phone',
        });
        const decryptedPhone = await (0, encryption_security_1.decryptEncryption)({
            cipherText: req.user?.phone,
        });
        user.phone = decryptedPhone;
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { user },
        });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let status = 200;
        switch (flag) {
            case enums_1.logoutEnum.signoutFromAllDevice:
                await this.UserModel.updateOne({
                    filter: { _id: req.decoded?._id },
                    data: { changeCredentialsTime: new Date() },
                });
                break;
            default:
                await (0, token_security_1.createRevokeToken)({ req });
                status = 201;
                break;
        }
        console.log(this.TokenModel);
        return (0, success_response_1.successResponse)({ res, status });
    };
    refreshToken = async (req, res) => {
        const data = await (0, token_security_1.generateLoginToken)(req.user);
        await (0, token_security_1.createRevokeToken)({ req });
        return (0, success_response_1.successResponse)({ res, status: 200, data });
    };
    profileImage = async (req, res) => {
        const { ContentType, originalname, } = req.body;
        const { url, key } = await (0, s3_config_1.createPreSignedUploadURL)({
            ContentType,
            originalname,
            path: `users/${req.decoded?._id}`,
        });
        const user = await this.UserModel.findByIdAndUpdate({
            id: new mongoose_1.Types.ObjectId(req.decoded?._id),
            data: { picture: key, temProfileImage: req.user?.picture },
        });
        if (!user) {
            throw new error_response_1.AppError('fail to update user profile image', 404);
        }
        s3_events_1.s3Event.emit('trackFileUpload', {
            key,
            expiresIn: 30000,
            userId: req.decoded?._id,
            oldKey: req.user?.picture,
        });
        return (0, success_response_1.successResponse)({ res, status: 200, data: { url, key } });
    };
    profileCoverImages = async (req, res) => {
        const key = await (0, s3_config_1.uploadFiles)({
            files: req.files,
            path: `users/cover/${req.decoded?._id}`,
        });
        const user = await this.UserModel.findByIdAndUpdate({
            id: new mongoose_1.Types.ObjectId(req.decoded?._id),
            data: { pictureCover: key },
            option: { new: false },
        });
        if (user?.pictureCover?.length) {
            await (0, s3_config_1.deleteFiles)({ urls: user.pictureCover });
        }
        return (0, success_response_1.successResponse)({ res, status: 200, data: { key } });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params;
        if (userId && req?.user?.role != enums_1.roleEnum.Admin) {
            throw new error_response_1.AppError('not authorized account', 403);
        }
        const user = await this.UserModel.updateOne({
            filter: {
                _id: userId || req.decoded?._id,
                freezeAt: { $exists: false },
            },
            data: {
                freezeAt: new Date(),
                freezeBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: { restoreAt: 1, restoreBy: 1 },
            },
        });
        if (!user.matchedCount) {
            throw new error_response_1.AppError('fail to freeze this account', 404);
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDelete = async (req, res) => {
        const { userId } = req.params;
        if (!req.user?.freezeAt) {
            throw new error_response_1.AppError('not freezed account ', 404);
        }
        const user = await this.UserModel.deleteOne({
            filter: {
                _id: userId,
                freezeAt: { $exists: true },
            },
        });
        if (!user.deletedCount) {
            throw new error_response_1.AppError('fail to hard delete this account', 404);
        }
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/${userId}` });
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new UserService();
