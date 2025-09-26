"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const nanoid_1 = require("nanoid");
const chat_model_1 = __importDefault(require("../../DB/models/chat.model"));
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const repository_1 = require("../../DB/repository");
const s3_config_1 = require("../../utils/multer/s3.config");
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const gateway_1 = require("../gateway");
class ChatService {
    chatModel = new repository_1.ChatRepository(chat_model_1.default);
    userModel = new repository_1.UserRepository(User_model_1.default);
    constructor() { }
    getChat = async (req, res) => {
        const { userId } = req.params;
        const { page, size } = req.query;
        const chat = await this.chatModel.findOneChat({
            filter: {
                participants: {
                    $all: [req.user?._id, mongoose_1.Types.ObjectId.createFromHexString(userId)],
                },
                group: { $exists: false },
            },
            option: {
                populate: [
                    {
                        path: 'participants',
                        select: 'firstName lastName email gender picture',
                    },
                ],
            },
            page,
            size,
        });
        if (!chat) {
            throw new error_response_1.BadError('fail to find matching chat instance');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            data: { chat },
        });
    };
    getChattingGroup = async (req, res) => {
        const { groupId } = req.params;
        const { page, size } = req.query;
        const chat = await this.chatModel.findOneChat({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                participants: {
                    $in: req.user?._id,
                },
                group: { $exists: true },
            },
            option: {
                populate: [
                    {
                        path: 'message.createdBy',
                        select: 'firstName lastName email gender picture',
                    },
                ],
            },
            page,
            size,
        });
        if (!chat) {
            throw new error_response_1.BadError('fail to find matching chat instance');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            data: { chat },
        });
    };
    createChattingGroup = async (req, res) => {
        const { group, participants } = req.body;
        const dpParticipants = participants.map((id) => mongoose_1.Types.ObjectId.createFromHexString(id));
        const users = (await this.userModel.find({
            filter: {
                _id: {
                    $in: dpParticipants,
                },
                friend: { $in: req.user?._id },
            },
        }));
        console.log({ participants, users, dpParticipants });
        if (participants?.length != users?.length) {
            throw new error_response_1.AppError('some or all recipient all Invalid ', 404);
        }
        let group_image = undefined;
        const roomId = group.replaceAll(/\s+/g, '_') + '-' + (0, nanoid_1.nanoid)();
        if (req.file) {
            group_image = await (0, s3_config_1.uploadFile)({
                file: req.file,
                path: `chat/group/${roomId}`,
            });
        }
        dpParticipants.push(req.user?._id);
        const [newChat] = (await this.chatModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    participants: dpParticipants,
                    group,
                    group_image: group_image,
                    roomId,
                    message: [],
                },
            ],
        })) || [];
        if (!newChat) {
            if (group_image) {
                await (0, s3_config_1.deleteFile)({ Key: group_image });
            }
            throw new error_response_1.BadError('fail to generate this group', 404);
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            data: { chat: newChat },
        });
    };
    sendMessage = async ({ content, sendTo, socket, io, }) => {
        try {
            const createdBy = socket.credentials?.user._id;
            const user = await this.userModel.findOne({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                    friend: { $in: createdBy },
                },
            });
            if (!user) {
                throw new error_response_1.AppError('invalid recipient friend ', 404);
            }
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [createdBy, mongoose_1.Types.ObjectId.createFromHexString(sendTo)],
                    },
                    group: { $exists: false },
                },
                data: { $addToSet: { message: { content, createdBy } } },
            });
            if (!chat) {
                const [newChat] = (await this.chatModel.create({
                    data: [
                        {
                            createdBy,
                            participants: [
                                createdBy,
                                mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                            ],
                            message: [
                                {
                                    content,
                                    createdBy,
                                },
                            ],
                        },
                    ],
                })) || [];
                if (!newChat) {
                    throw new error_response_1.BadError('fail to create new chat instance', 404);
                }
            }
            io?.to(gateway_1.connectedSockets.get(createdBy.toString())).emit('successMessage', {
                content,
            });
            io?.to(gateway_1.connectedSockets.get(sendTo)).emit('newMessage', {
                content,
                from: socket.credentials?.user,
            });
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
    leaveChat = async ({ roomId, socket, io }) => {
        try {
            const chat = await this.chatModel.findOne({
                filter: {
                    roomId,
                    participants: {
                        $in: socket.credentials?.user._id,
                    },
                    group: { $exists: true },
                },
            });
            if (!chat) {
                throw new error_response_1.AppError('fail to find matching room ', 404);
            }
            socket.leave(chat.roomId);
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
    joinRoom = async ({ roomId, socket, io }) => {
        try {
            const chat = await this.chatModel.findOne({
                filter: {
                    roomId,
                    participants: {
                        $in: socket.credentials?.user._id,
                    },
                    group: { $exists: true },
                },
            });
            if (!chat) {
                throw new error_response_1.AppError('fail to find matching room ', 404);
            }
            socket.join(chat.roomId);
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
    sendGroupMessage = async ({ groupId, content, socket, io, }) => {
        try {
            const createdBy = socket.credentials?.user._id;
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                    participants: {
                        $in: createdBy,
                    },
                    group: { $exists: true },
                },
                data: { $addToSet: { message: { content, createdBy } } },
            });
            if (!chat) {
                throw new error_response_1.AppError('fail to find matching room ', 404);
            }
            socket?.to(chat.roomId).emit('newMessage', {
                content,
                from: socket.credentials?.user,
                groupId,
            });
            io?.to(gateway_1.connectedSockets.get(createdBy.toString())).emit('successMessage', {
                content,
            });
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
    removeUserOnline = async ({ socket, io, }) => {
        try {
            const sockets = gateway_1.onlineUsers.get(socket.credentials?.user._id);
            if (!sockets)
                return;
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                gateway_1.onlineUsers.delete(socket.credentials?.user._id);
                io?.emit('user_offline', { userId: socket.credentials?.user._id });
            }
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
    addUserOnline = async ({ socket, io, }) => {
        try {
            if (!gateway_1.onlineUsers.has(socket.credentials?.user._id))
                gateway_1.onlineUsers.set(socket.credentials?.user._id, new Set());
            gateway_1.onlineUsers.get(socket.credentials?.user._id)?.add(socket.id);
            io?.emit('user_online', { userId: socket.credentials?.user._id });
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
    typingStop = async ({ socket, io, }) => {
        try {
            socket.to(socket.credentials?.user._id).emit("typing", { userId: socket.credentials?.user._id, isTyping: false });
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
    typingStart = async ({ socket, io, }) => {
        try {
            socket.to(socket.credentials?.user._id).emit("typing", { userId: socket.credentials?.user._id, isTyping: true });
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
    sayHi = ({ message, socket, callback }) => {
        try {
            console.log(`Welcome socket ${socket.id}!`, message);
            callback && callback(`Welcome socket ${socket.id}!`);
        }
        catch (error) {
            return socket.emit('custom_error', error);
        }
    };
}
exports.ChatService = ChatService;
