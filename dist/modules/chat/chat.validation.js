"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChattingGroup = exports.getChattingGroup = exports.getChat = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../middleware/validation.middleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.getChat = {
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
    query: zod_1.default.strictObject({
        page: zod_1.default.coerce.number().int().min(1).optional(),
        size: zod_1.default.coerce.number().int().min(1).optional(),
    }),
};
exports.getChattingGroup = {
    params: zod_1.default.strictObject({
        groupId: validation_middleware_1.generalFields.id,
    }),
    query: exports.getChat.query,
};
exports.createChattingGroup = {
    body: zod_1.default
        .strictObject({
        participants: zod_1.default.array(validation_middleware_1.generalFields.id).min(1),
        group: zod_1.default.string().min(2).max(5000),
        attachment: validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image),
    })
        .superRefine((data, ctx) => {
        if (data.participants?.length &&
            data.participants?.length !== [...new Set(data.participants)]?.length) {
            ctx.addIssue({
                code: 'custom',
                path: ['participants'],
                message: 'Duplicated participants user ',
            });
        }
    }),
};
