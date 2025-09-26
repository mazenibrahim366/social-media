"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIo = void 0;
const socket_io_1 = require("socket.io");
const error_response_1 = require("../../utils/response/error.response");
const token_security_1 = require("../../utils/security/token.security");
const connectedSockets = new Map();
const initializeIo = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, { cors: { origin: '*' } });
    io.use(async (socket, next) => {
        try {
            const { decoded, user } = await (0, token_security_1.decodedToken)({
                authorization: socket?.handshake.auth.authorization || '',
            });
            if (!decoded || !user) {
                next(new error_response_1.BadError('unauthorized socket connection'));
            }
            let userTapes = connectedSockets.get(user._id.toString()) || [];
            userTapes.push(socket.id);
            connectedSockets.set(user._id.toString(), userTapes);
            socket.credentials = { user, decoded };
            next();
        }
        catch (error) {
            next(error);
        }
    });
    io.on('connection', (socket) => {
        console.log(`socket ${socket.id} connected`);
        console.log(connectedSockets);
        connectedSockets.get(socket.credentials?.user._id?.toString());
        socket.on('disconnect', (reason) => {
            const userId = socket.credentials?.user._id?.toString();
            let remainingTaps = connectedSockets
                .get(userId)
                ?.filter((tap) => tap !== socket.id) || [];
            if (remainingTaps.length) {
                connectedSockets.set(userId, remainingTaps);
            }
            else {
                connectedSockets.delete(userId);
                io.emit('offline_user', userId);
            }
            console.log({ connectedSockets });
        });
    });
};
exports.initializeIo = initializeIo;
