"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const repository_1 = require("../../DB/repository/");
const mongoose_1 = require("mongoose");
const chat_model_1 = __importDefault(require("../../DB/models/chat.model"));
const FriendRequest_model_1 = __importDefault(require("../../DB/models/FriendRequest.model"));
const Post_model_1 = __importDefault(require("../../DB/models/Post.model"));
const Token_model_1 = __importDefault(require("../../DB/models/Token.model"));
const enums_1 = require("../../utils/enums");
const s3_config_1 = require("../../utils/multer/s3.config");
const s3_events_1 = require("../../utils/multer/s3.events");
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const encryption_security_1 = require("../../utils/security/encryption.security");
const token_security_1 = require("../../utils/security/token.security");
const graphql_1 = require("graphql");
class UserService {
    UserModel = new repository_1.UserRepository(User_model_1.default);
    TokenModel = new repository_1.TokenRepository(Token_model_1.default);
    PostModel = new repository_1.PostRepository(Post_model_1.default);
    ChatModel = new repository_1.ChatRepository(chat_model_1.default);
    FriendRequestModel = new repository_1.FriendRequestRepository(FriendRequest_model_1.default);
    constructor() { }
    dashboard = async (req, res) => {
        const results = await Promise.allSettled([
            this.UserModel.findCursor({
                filter: {},
            }),
            this.PostModel.find({
                filter: {},
            }),
        ]);
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { results },
        });
    };
    unFriend = async (req, res) => {
        const { userId } = req.params;
        const friendRequest = await this.UserModel.updateOne({
            filter: {
                _id: req.user?._id,
                friend: { $in: [new mongoose_1.Types.ObjectId(userId)] },
            },
            data: { $pull: { friend: new mongoose_1.Types.ObjectId(userId) } },
        });
        if (!friendRequest.matchedCount) {
            throw new error_response_1.AppError('fail to find matching result ', 404);
        }
        const updateOther = await this.UserModel.updateOne({
            filter: {
                _id: new mongoose_1.Types.ObjectId(userId),
                friend: { $in: [req.user?._id] },
            },
            data: { $pull: { friend: req.user?._id } },
        });
        if (!updateOther.matchedCount) {
            throw new error_response_1.AppError('fail to unfriend this user', 404);
        }
        return (0, success_response_1.successResponse)({
            res,
            message: 'user unfriended successfully',
        });
    };
    acceptFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const friendRequest = await this.FriendRequestModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
                acceptedAt: { $exists: false },
            },
            data: { acceptedAt: new Date() },
        });
        if (!friendRequest) {
            throw new error_response_1.AppError('fail to find matching result ', 404);
        }
        await Promise.all([
            await this.UserModel.updateOne({
                filter: { _id: req.user?._id },
                data: { $addToSet: { friend: friendRequest?.createdBy } },
            }),
            await this.UserModel.updateOne({
                filter: { _id: friendRequest?.createdBy },
                data: { $addToSet: { friend: req.user?._id } },
            }),
        ]);
        return (0, success_response_1.successResponse)({
            res,
        });
    };
    UnAcceptFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const friendRequest = await this.FriendRequestModel.findOne({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
                acceptedAt: { $exists: false },
            },
        });
        if (!friendRequest) {
            throw new error_response_1.AppError('fail to find matching result ', 404);
        }
        const deleteFriendRequest = await this.FriendRequestModel.deleteOne({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
                acceptedAt: { $exists: false },
            },
        });
        if (!deleteFriendRequest.deletedCount) {
            throw new error_response_1.AppError('fail to delete this friend request ', 404);
        }
        return (0, success_response_1.successResponse)({
            res,
        });
    };
    sendFriendRequest = async (req, res) => {
        const { userId } = req.params;
        if (userId == req.user?._id) {
            throw new error_response_1.AppError('you cant send friend request to yourself ', 400);
        }
        const checkFriendRequest = await this.FriendRequestModel.findOne({
            filter: {
                createdBy: { $in: [req.user?._id, userId] },
                sendTo: { $in: [req.user?._id, userId] },
                acceptedAt: { $exists: false },
            },
        });
        if (checkFriendRequest) {
            throw new error_response_1.AppError('you are already friend exist  ', 400);
        }
        const user = await this.UserModel.findOne({
            filter: { _id: userId },
        });
        if (!user) {
            throw new error_response_1.AppError('invalid recipient   ', 400);
        }
        const [friendRequest] = (await this.FriendRequestModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    sendTo: userId,
                },
            ],
        })) || [];
        if (!friendRequest) {
            throw new error_response_1.BadError('something went wrong !');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { friendRequest },
        });
    };
    changeRole = async (req, res) => {
        const { userId } = req.params;
        const denyRoles = [enums_1.roleEnum.superAdmin];
        if (req.user?.role === enums_1.roleEnum.Admin) {
            denyRoles.push(enums_1.roleEnum.Admin);
        }
        const user = await this.UserModel.findOneAndUpdate({
            filter: { _id: userId, role: { $nin: denyRoles } },
            data: { role: req.body.role },
        });
        if (!user) {
            throw new error_response_1.AppError('fail to find matching result', 404);
        }
        return (0, success_response_1.successResponse)({
            res,
            data: { user },
        });
    };
    blockUser = async (req, res) => {
        const { userId } = req.params;
        const user = await this.UserModel.findOne({
            filter: {
                _id: req.user?._id,
                friend: { $in: [new mongoose_1.Types.ObjectId(userId)] },
            },
        });
        if (!user) {
            throw new error_response_1.AppError('fail to find matching result', 404);
        }
        if (user?.blockList?.includes(new mongoose_1.Types.ObjectId(userId))) {
            throw new error_response_1.AppError('user already blocked', 400);
        }
        const updateUser = await this.UserModel.updateOne({
            filter: { _id: req.user?._id },
            data: { $addToSet: { blockList: new mongoose_1.Types.ObjectId(userId) } },
        });
        if (!updateUser.matchedCount) {
            throw new error_response_1.AppError('fail to block this user', 404);
        }
        return (0, success_response_1.successResponse)({
            res,
        });
    };
    profile = async (req, res) => {
        const user = await this.UserModel.findById({
            id: req.user?._id,
            select: ' -phone',
            option: {
                populate: [
                    {
                        path: 'friend',
                        select: 'firstName lastName email gender picture slug',
                    },
                ],
            },
        });
        if (!user) {
            throw new error_response_1.AppError('fail to find matching result', 404);
        }
        const decryptedPhone = await (0, encryption_security_1.decryptEncryption)({
            cipherText: req.user?.phone,
        });
        user.phone = decryptedPhone;
        const groups = await this.ChatModel.find({
            filter: {
                participants: { $in: req.user?._id },
                group: { $exists: true },
            },
        });
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { user, groups },
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
    hello = async (context) => {
        console.log(context.user);
        return 'hello';
    };
    allUser = async (args, authUser) => {
        console.log(authUser);
        const user = await this.UserModel.find({ filter: { $ne: { _id: authUser._id } } });
        if (!user) {
            throw new graphql_1.GraphQLError("not matched user ");
        }
        return user;
    };
}
exports.UserService = UserService;
exports.default = new UserService();
