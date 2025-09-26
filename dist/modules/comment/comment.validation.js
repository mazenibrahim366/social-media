"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDelete = exports.likeComment = exports.updateComment = exports.replyOnComment = exports.createComment = void 0;
const zod_1 = __importDefault(require("zod"));
const models_dto_1 = require("../../DB/models/models.dto");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.createComment = {
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.default
        .object({
        content: zod_1.default.string().min(2).max(50000).optional(),
        attachments: zod_1.default
            .array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image))
            .max(2)
            .optional(),
        tag: zod_1.default.array(validation_middleware_1.generalFields.id).optional(),
    })
        .superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: 'custom',
                path: ['context'],
                message: 'sorry we cannot make post without content or attachment',
            });
        }
        if (data.tag?.length &&
            data.tag?.length !== [...new Set(data.tag)]?.length) {
            ctx.addIssue({
                code: 'custom',
                path: ['tag'],
                message: 'Duplicated tagged user ',
            });
        }
    }),
};
exports.replyOnComment = {
    params: exports.createComment.params.extend({
        commentId: validation_middleware_1.generalFields.id,
    }),
    body: exports.createComment.body,
};
exports.updateComment = {
    params: exports.createComment.params.extend({
        commentId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.default
        .strictObject({
        content: zod_1.default.string().min(2).max(50000).optional(),
        attachments: zod_1.default.array(zod_1.default.string()).max(2).optional(),
        removeAttachments: zod_1.default
            .array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image))
            .max(2)
            .optional(),
        availability: zod_1.default.enum(models_dto_1.AvailabilityEnum).optional(),
        removeTag: zod_1.default.array(validation_middleware_1.generalFields.id).optional(),
        allowComments: zod_1.default.enum(models_dto_1.AllowCommentsEnum).optional(),
        tag: zod_1.default.array(validation_middleware_1.generalFields.id).optional(),
    })
        .superRefine((data, ctx) => {
        if (!Object.values(data)?.length) {
            ctx.addIssue({
                code: 'custom',
                path: ['context'],
                message: 'all fields are empty',
            });
        }
        if (data.tag?.length &&
            data.tag?.length !== [...new Set(data.tag)]?.length) {
            ctx.addIssue({
                code: 'custom',
                path: ['tag'],
                message: 'Duplicated tagged user ',
            });
        }
        if (data.removeTag?.length &&
            data.removeTag?.length !== [...new Set(data.tag)]?.length) {
            ctx.addIssue({
                code: 'custom',
                path: ['removeTag'],
                message: 'Duplicated tagged user ',
            });
        }
    }),
};
exports.likeComment = {
    params: exports.createComment.params.extend({
        commentId: validation_middleware_1.generalFields.id,
    }),
    query: zod_1.default.strictObject({
        action: zod_1.default.enum(models_dto_1.LikeActionEnum).default(models_dto_1.LikeActionEnum.like).optional(),
    }),
};
exports.hardDelete = {
    params: exports.createComment.params.extend({
        commentId: validation_middleware_1.generalFields.id,
    }),
};
