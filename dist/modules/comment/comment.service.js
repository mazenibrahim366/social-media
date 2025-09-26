"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = void 0;
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const repository_1 = require("../../DB/repository");
const mongoose_1 = require("mongoose");
const Comment_model_1 = __importDefault(require("../../DB/models/Comment.model"));
const models_dto_1 = require("../../DB/models/models.dto");
const Post_model_1 = __importDefault(require("../../DB/models/Post.model"));
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const s3_config_1 = require("../../utils/multer/s3.config");
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const post_1 = require("../post");
class CommentService {
    UserModel = new repository_1.UserRepository(User_model_1.default);
    PostModel = new repository_1.PostRepository(Post_model_1.default);
    CommentModel = new repository_1.CommentRepository(Comment_model_1.default);
    constructor() { }
    getComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const getComment = await this.CommentModel.findOne({
            filter: { _id: commentId, createdBy: req.user?._id, postId },
        });
        if (!getComment) {
            throw new error_response_1.BadError('fail to get this comment ');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            data: { getComment },
        });
    };
    getCommentWithReply = async (req, res) => {
        const { postId, commentId } = req.params;
        const getComment = await this.CommentModel.findOne({
            filter: { _id: commentId, createdBy: req.user?._id, postId },
            option: { populate: [{ path: 'replyComment' }] },
        });
        if (!getComment) {
            throw new error_response_1.BadError('fail to get this comment ');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            data: { getComment },
        });
    };
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this.PostModel.findOne({
            filter: {
                _id: postId,
                allowComments: models_dto_1.AllowCommentsEnum.allow,
                $or: (0, post_1.postAvailability)(req),
            },
        });
        if (!post) {
            throw new error_response_1.AppError('some mentioned account  are not exist', 404);
        }
        console.log({ postId });
        const checkTags = (await this.UserModel.find({
            filter: { _id: { $in: req.body.tag, $ne: req.user?._id } },
        }));
        if (req.body.tag?.length && checkTags?.length !== req.body.tag?.length) {
            throw new error_response_1.AppError('some mentioned users are not exist', 404);
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                storageApproach: cloud_multer_1.StorageEnum.memory,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
            });
        }
        const [comment] = await this.CommentModel.create({
            data: [
                { ...req.body, attachments, postId, createdBy: req.user?._id },
            ],
        });
        if (!comment) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadError('fail to create this post ');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { comment },
        });
    };
    freezeComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = await this.CommentModel.updateOne({
            filter: {
                _id: commentId,
                postId,
                allowComments: models_dto_1.AllowCommentsEnum.allow,
                freezeAt: { $exists: false },
            },
            data: {
                freezeAt: new Date(),
                freezeBy: req.user?._id,
                $unset: { restoreAt: 1, restoreBy: 1 },
            },
        });
        if (!comment.matchedCount) {
            throw new error_response_1.AppError('fail to freeze this comment', 404);
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDeleteComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = await this.CommentModel.findOne({
            filter: {
                _id: commentId,
                postId,
                paranoid: false,
            },
            option: {
                populate: [
                    {
                        path: 'postId',
                    },
                    {
                        path: 'replyComment',
                    },
                ],
            },
        });
        console.log({ comment });
        console.log(comment?.replyComment);
        if (!comment) {
            throw new error_response_1.AppError('some mentioned account  are not exist', 404);
        }
        if (!comment?.freezeAt) {
            throw new error_response_1.AppError('not freezed comment ', 404);
        }
        const attachmentReply = comment.replyComment?.flatMap((e) => e.attachments || []) || [];
        const deleteComment = await this.CommentModel.deleteOne({
            filter: {
                _id: commentId,
                postId,
                freezeAt: { $exists: true },
            },
        });
        if (comment.replyComment?.length) {
            const deleteReply = await this.CommentModel.deleteMany({
                filter: {
                    commentId,
                    postId,
                },
            });
            if (!deleteReply.deletedCount) {
                throw new error_response_1.AppError('fail to hard delete this reply comment', 404);
            }
        }
        if (!deleteComment.deletedCount) {
            throw new error_response_1.AppError('fail to hard delete this comment', 404);
        }
        if (comment.attachments?.length) {
            if (attachmentReply) {
                await (0, s3_config_1.deleteFiles)({
                    urls: [
                        ...comment.attachments,
                        ...attachmentReply,
                    ],
                });
            }
            await (0, s3_config_1.deleteFiles)({
                urls: comment.attachments,
            });
        }
        return (0, success_response_1.successResponse)({ res, data: comment });
    };
    replyOnComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = await this.CommentModel.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            option: {
                populate: [
                    {
                        path: 'postId',
                        match: {
                            allowComments: models_dto_1.AllowCommentsEnum.allow,
                            $or: (0, post_1.postAvailability)(req),
                        },
                    },
                ],
            },
        });
        if (!comment?.postId) {
            throw new error_response_1.AppError('some mentioned account  are not exist', 404);
        }
        const checkTags = (await this.UserModel.find({
            filter: { _id: { $in: req.body.tag, $ne: req.user?._id } },
        }));
        if (req.body.tag?.length && checkTags?.length !== req.body.tag?.length) {
            throw new error_response_1.AppError('some mentioned users are not exist', 404);
        }
        let attachments = [];
        if (req.files?.length) {
            const post = comment.postId;
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                storageApproach: cloud_multer_1.StorageEnum.memory,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
            });
        }
        const [reply] = await this.CommentModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    postId,
                    commentId,
                    createdBy: req.user?._id,
                },
            ],
        });
        if (!reply) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadError('fail to create this post ');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { reply },
        });
    };
    updateComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = (await this.CommentModel.findOne({
            filter: {
                _id: commentId,
                postId,
                createdBy: req.user?._id,
            },
            option: { populate: [{ path: 'postId' }] },
        }));
        if (!comment) {
            throw new error_response_1.AppError('fail to find matching result', 404);
        }
        const checkTags = (await this.UserModel.find({
            filter: { _id: { $in: req.body?.tag, $ne: req.user?._id } },
        }));
        if (req.body?.tag?.length && checkTags?.length !== req.body?.tag?.length) {
            throw new error_response_1.AppError('some mentioned users are not exist', 404);
        }
        let attachments = [];
        let folderId;
        if (comment?.postId && !(comment.postId instanceof mongoose_1.Types.ObjectId)) {
            folderId = comment.postId.assetsFolderId;
        }
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${comment?.createdBy}/post/${folderId}`,
            });
        }
        const updated = await this.CommentModel.updateOne({
            filter: { _id: comment._id },
            data: [
                {
                    $set: {
                        content: req.body?.content,
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        '$attachments',
                                        req.body?.removeAttachments || [],
                                    ],
                                },
                                attachments,
                            ],
                        },
                        tag: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        '$tag',
                                        (req.body?.removeTag || []).map((tag) => {
                                            return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                        }),
                                    ],
                                },
                                (req.body?.tag || []).map((tag) => {
                                    return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                }),
                            ],
                        },
                    },
                },
            ],
        });
        if (!updated.matchedCount) {
            if (attachments?.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadError('fail to create this post ');
        }
        else {
            if (req.body?.removeAttachments?.length) {
                await (0, s3_config_1.deleteFiles)({ urls: req.body?.removeAttachments });
            }
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { comment },
        });
    };
    likeComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const { action } = req.query;
        console.log(req.body);
        let updateData = {
            $addToSet: { likes: req.user?.id },
        };
        if (action && action == models_dto_1.LikeActionEnum.unlike) {
            updateData = { $pull: { likes: req.user?.id } };
        }
        const comment = await this.CommentModel.findOneAndUpdate({
            filter: {
                _id: commentId,
                postId,
            },
            data: updateData,
        });
        if (!comment) {
            throw new error_response_1.AppError('invalid postId or commentId or post or comment not exist  ', 404);
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
        });
    };
}
exports.commentService = new CommentService();
