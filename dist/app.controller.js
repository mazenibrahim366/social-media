"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = require("express-rate-limit");
const express_2 = require("graphql-http/lib/use/express");
const helmet_1 = __importDefault(require("helmet"));
const node_path_1 = require("node:path");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const router = __importStar(require("./modules"));
const s3_config_1 = require("./utils/multer/s3.config");
const error_response_1 = require("./utils/response/error.response");
const success_response_1 = require("./utils/response/success.response");
const authentication_middleware_1 = require("./middleware/authentication.middleware");
const createS3WriteStreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)('./config/.env.development') });
const bootstrap = async () => {
    const app = (0, express_1.default)();
    const port = process.env.PORT || 5000;
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: 'draft-8',
        message: { error: 'too many request please try again later ' },
        legacyHeaders: false,
        ipv6Subnet: 56,
    });
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(limiter);
    await (0, connection_db_1.default)();
    app.use(express_1.default.json());
    app.all('/graphql', (0, authentication_middleware_1.authentication)(), (0, express_2.createHandler)({ schema: router.schema, context: (req) => ({ user: req.raw.user }) }));
    app.get('/', (req, res) => res.json({
        message: `welcome to ${process.env.APPLICATION_NAME} backend landing page `,
    }));
    app.use('/auth', router.authRouter);
    app.use('/users', router.userRouter);
    app.use('/posts', router.postRouter);
    app.use('/chat', router.chatRouter);
    app.get('/upload/Pre-signed/*path', async (req, res) => {
        const { downloadName, download = 'false' } = req.query;
        const { path } = req.params;
        const Key = path.join('/');
        console.log({ Key }, path.join('/'));
        const url = await (0, s3_config_1.createGetPreSignedURL)({
            Key,
            downloadName: downloadName,
            download,
        });
        if (!url) {
            throw new error_response_1.AppError('fail to fetch this asset', 404);
        }
        return (0, success_response_1.successResponse)({ res, data: { url } });
    });
    app.get('/upload/*path', async (req, res) => {
        const { downloadName, download = false } = req.query;
        const { path } = req.params;
        const Key = path.join('/');
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        if (!s3Response?.Body) {
            throw new error_response_1.AppError('fail to fetch this asset', 404);
        }
        res.setHeader('Content-Type', s3Response.ContentType || 'application/octet-stream');
        if (download == 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="${downloadName?.split('/').pop() || Key.split('/').pop()}"` || `attachment; filename="file"`);
        }
        return await createS3WriteStreamPipe(s3Response.Body, res);
    });
    app.use(error_response_1.globalErrorHandling);
    app.all('{/*dummy}', (req, res) => res.status(404).json({ message: 'In-valid app router' }));
    const httpServer = app.listen(port, () => console.log(`Server is running on port => ${port}!`));
    router.initializeIo(httpServer);
};
exports.default = bootstrap;
