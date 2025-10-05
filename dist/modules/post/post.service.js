"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = exports.postAvailability = exports.postAvailabilityByUser = void 0;
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const repository_1 = require("../../DB/repository");
const mongoose_1 = require("mongoose");
const nanoid_1 = require("nanoid");
const Comment_model_1 = __importDefault(require("../../DB/models/Comment.model"));
const models_dto_1 = require("../../DB/models/models.dto");
const Post_model_1 = __importDefault(require("../../DB/models/Post.model"));
const email_events_1 = require("../../utils/Email/email.events");
const s3_config_1 = require("../../utils/multer/s3.config");
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const gateway_1 = require("../gateway");
const postAvailabilityByUser = (user) => {
    return [
        { availability: models_dto_1.AvailabilityEnum.public },
        { availability: models_dto_1.AvailabilityEnum.onlyMe, createdBy: user?._id },
        {
            availability: models_dto_1.AvailabilityEnum.friends,
            createdBy: { $in: [...(user?.friend || []), user?._id] },
        },
        {
            availability: { $ne: models_dto_1.AvailabilityEnum.onlyMe },
            tag: { $in: user?._id },
        },
    ];
};
exports.postAvailabilityByUser = postAvailabilityByUser;
const postAvailability = (req) => {
    return [
        { availability: models_dto_1.AvailabilityEnum.public },
        { availability: models_dto_1.AvailabilityEnum.onlyMe, createdBy: req.user?._id },
        {
            availability: models_dto_1.AvailabilityEnum.friends,
            createdBy: { $in: [...(req.user?.friend || []), req.user?._id] },
        },
        {
            availability: { $ne: models_dto_1.AvailabilityEnum.onlyMe },
            tag: { $in: req.user?._id },
        },
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    UserModel = new repository_1.UserRepository(User_model_1.default);
    CommentModel = new repository_1.CommentRepository(Comment_model_1.default);
    PostModel = new repository_1.PostRepository(Post_model_1.default);
    constructor() { }
    getPost = async (req, res) => {
        const { postId } = req.params;
        const getPost = await this.PostModel.findOne({
            filter: { _id: postId, createdBy: req.user?._id },
            option: { populate: [{ path: 'comments' }] },
        });
        console.log(req.user?._id);
        if (!getPost) {
            throw new error_response_1.BadError('fail to get  this post ');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            data: { getPost },
        });
    };
    createPost = async (req, res) => {
        const checkTags = (await this.UserModel.find({
            filter: { _id: { $in: req.body.tag, $ne: req.user?._id } },
        }));
        if (req.body.tag?.length && checkTags?.length !== req.body.tag?.length) {
            throw new error_response_1.AppError('some mentioned users are not exist', 404);
        }
        let attachments = [];
        let assetsFolderId = (0, nanoid_1.nanoid)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${assetsFolderId}`,
            });
        }
        if (req.body.tag?.length) {
            const emailsTag = await Promise.all(req.body.tag?.map(async (id) => {
                const doc = await this.UserModel.findById({ id });
                return doc?.email;
            }));
            console.log(emailsTag);
            email_events_1.emailEvent.emit('sendListEmails', [
                emailsTag,
                'mentioned by',
                req.user?.slug,
            ]);
        }
        const [post] = await this.PostModel.create({
            data: [
                { ...req.body, attachments, assetsFolderId, createdBy: req.user?._id },
            ],
        });
        if (!post) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadError('fail to create this post ');
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: { post },
        });
    };
    updatePost = async (req, res) => {
        const { postId } = req.params;
        const post = (await this.PostModel.findOne({
            filter: {
                _id: postId,
                createdBy: req.user?._id,
            },
        }));
        if (!post) {
            throw new error_response_1.AppError('fail to find matching result', 404);
        }
        const checkTags = (await this.UserModel.find({
            filter: { _id: { $in: req.body?.tag, $ne: req.user?._id } },
        }));
        if (req.body?.tag?.length && checkTags?.length !== req.body?.tag?.length) {
            throw new error_response_1.AppError('some mentioned users are not exist', 404);
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post?.createdBy}/post/${post?.assetsFolderId}`,
            });
        }
        const updated = await this.PostModel.updateOne({
            filter: { _id: post._id },
            data: [
                {
                    $set: {
                        content: req.body?.content,
                        allowComments: req.body?.allowComments || post?.allowComments,
                        availability: req.body?.availability || post?.availability,
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
            data: { post },
        });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        console.log(req.body);
        let updateData = { $addToSet: { likes: req.user?.id } };
        if (action && action == models_dto_1.LikeActionEnum.unlike) {
            updateData = { $pull: { likes: req.user?.id } };
        }
        const post = await this.PostModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(req),
            },
            data: updateData,
        });
        if (!post) {
            throw new error_response_1.AppError('invalid postId or post not exist  ', 404);
        }
        if (action !== models_dto_1.LikeActionEnum.unlike) {
            (0, gateway_1.getIo)()
                .to(gateway_1.connectedSockets.get(post.createdBy.toString()))
                .emit('likePost', { postId, userId: req.user?._id });
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
        });
    };
    postList = async (req, res) => {
        let { page, size } = req.query;
        const posts = await this.PostModel.paginate({
            filter: {
                $or: (0, exports.postAvailability)(req),
            },
            option: {
                populate: [
                    {
                        path: 'comments',
                        match: {
                            commentId: { $exists: false },
                            freezeAt: { $exists: false },
                        },
                        populate: [
                            { path: 'reply', match: { commentId: { $exists: false } } },
                        ],
                    },
                ],
            },
            page,
            size,
        });
        if (!posts) {
            throw new error_response_1.AppError('invalid postId or post not exist  ', 404);
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 201,
            data: posts,
        });
    };
    freezePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.PostModel.updateOne({
            filter: {
                _id: postId,
                createdBy: req.user?._id,
                allowComments: models_dto_1.AllowCommentsEnum.allow,
                freezeAt: { $exists: false },
            },
            data: {
                freezeAt: new Date(),
                freezeBy: req.user?._id,
                $unset: { restoreAt: 1, restoreBy: 1 },
            },
        });
        if (!post.matchedCount) {
            throw new error_response_1.AppError('fail to freeze this post  ', 404);
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDeletePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.PostModel.findOne({
            filter: {
                _id: postId,
                createdBy: req.user?._id,
                paranoid: false,
            },
            option: {
                populate: [
                    {
                        path: 'comments',
                    },
                ],
            },
        });
        console.log(post, postId);
        if (!post) {
            throw new error_response_1.AppError('post is not exist ', 404);
        }
        if (!post?.freezeAt) {
            throw new error_response_1.AppError('not freezed post ', 404);
        }
        if (post.comments?.length) {
            const deleteComment = await this.CommentModel.deleteMany({
                filter: {
                    postId,
                },
            });
            if (!deleteComment.deletedCount) {
                throw new error_response_1.AppError('fail to hard delete this comment', 404);
            }
        }
        const deletePost = await this.PostModel.deleteOne({
            filter: {
                _id: postId,
                freezeAt: { $exists: true },
            },
        });
        if (!deletePost.deletedCount) {
            throw new error_response_1.AppError('fail to hard delete this comment', 404);
        }
        await (0, s3_config_1.deleteFolderByPrefix)({
            path: `users/${post?.createdBy}/post/${post?.assetsFolderId}`,
        });
        return (0, success_response_1.successResponse)({ res, data: post });
    };
    getPostWithComments = async (req, res) => {
        const posts = await this.PostModel.findCursor({
            filter: {
                $or: (0, exports.postAvailability)(req),
            },
        });
        if (!posts) {
            throw new error_response_1.AppError('invalid postId or post not exist  ', 404);
        }
        return (0, success_response_1.successResponse)({
            res,
            status: 200,
            data: { posts },
        });
    };
    allPosts = async ({ page, size }, authUser) => {
        const posts = await this.PostModel.paginate({
            filter: {
                $or: (0, exports.postAvailabilityByUser)(authUser),
            },
            option: {
                populate: [
                    {
                        path: 'createdBy',
                    },
                ],
            },
            page,
            size,
        });
        if (!posts) {
            throw new error_response_1.AppError('invalid postId or post not exist  ', 404);
        }
        return posts;
    };
    likeGraphPost = async ({ postId, action }, authUser) => {
        let updateData = { $addToSet: { likes: authUser?.id } };
        if (action && action == models_dto_1.LikeActionEnum.unlike) {
            updateData = { $pull: { likes: authUser?.id } };
        }
        const post = await this.PostModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailabilityByUser)(authUser),
            },
            data: updateData,
        });
        if (!post) {
            throw new error_response_1.AppError('invalid postId or post not exist  ', 404);
        }
        if (action !== models_dto_1.LikeActionEnum.unlike) {
            (0, gateway_1.getIo)()
                .to(gateway_1.connectedSockets.get(post.createdBy.toString()))
                .emit('likePost', { postId, userId: authUser?._id });
        }
        return post;
    };
}
exports.PostService = PostService;
exports.postService = new PostService();
