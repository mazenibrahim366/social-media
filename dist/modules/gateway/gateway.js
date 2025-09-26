"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initializeIo = exports.onlineUsers = exports.connectedSockets = void 0;
const chat_service_1 = require("./../chat/chat.service");
const chat_gateway_1 = require("./../chat/chat.gateway");
const socket_io_1 = require("socket.io");
const error_response_1 = require("../../utils/response/error.response");
const token_security_1 = require("../../utils/security/token.security");
const chatServes = new chat_service_1.ChatService();
exports.connectedSockets = new Map();
exports.onlineUsers = new Map();
let io = undefined;
const initializeIo = (httpServer) => {
    io = new socket_io_1.Server(httpServer, { cors: { origin: '*' } });
    io.use(async (socket, next) => {
        try {
            const { decoded, user } = await (0, token_security_1.decodedToken)({
                authorization: socket?.handshake.auth.authorization || '',
            });
            if (!decoded || !user) {
                next(new error_response_1.BadError('unauthorized socket connection'));
            }
            let userTapes = exports.connectedSockets.get(user._id.toString()) || [];
            userTapes.push(socket.id);
            exports.connectedSockets.set(user._id.toString(), userTapes);
            socket.credentials = { user, decoded };
            next();
        }
        catch (error) {
            next(error);
        }
    });
    function disconnection(socket) {
        return socket.on('disconnect', (reason) => {
            const userId = socket.credentials?.user._id?.toString();
            let remainingTaps = exports.connectedSockets
                .get(userId)
                ?.filter((tap) => tap !== socket.id) || [];
            if (remainingTaps.length) {
                exports.connectedSockets.set(userId, remainingTaps);
            }
            else {
                exports.connectedSockets.delete(userId);
                (0, exports.getIo)().emit('offline_user', userId);
            }
            chatServes.removeUserOnline({ io, socket });
            console.log({ connectedSockets: exports.connectedSockets });
        });
    }
    const chatGateway = new chat_gateway_1.ChatGateway();
    io.on('connection', (socket) => {
        console.log({ connectedSockets: exports.connectedSockets });
        exports.connectedSockets.get(socket.credentials?.user._id?.toString());
        chatGateway.register(socket, (0, exports.getIo)());
        disconnection(socket);
    });
};
exports.initializeIo = initializeIo;
const getIo = () => {
    if (!io) {
        throw new error_response_1.BadError('Fail to connect to server socket io ');
    }
    else {
        return io;
    }
};
exports.getIo = getIo;
