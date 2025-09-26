"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const commentSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        minLength: 2,
        maxLength: 500000,
        required: function () {
            return this.attachments?.length ? true : false;
        },
    },
    attachments: [String],
    postId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    commentId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Comment' },
    tag: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    freezeBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    freezeAt: Date,
    restoredBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    restoredAt: Date,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
commentSchema.pre(['findOne', 'find', 'countDocuments'], function (next) {
    const query = this.getQuery();
    if (query.paranoid == false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeAt: { $exists: false } });
    }
    next();
});
commentSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
    const query = this.getQuery();
    if (query.paranoid == false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeAt: { $exists: false } });
    }
    next();
});
commentSchema.virtual('replyComment', {
    foreignField: 'commentId',
    localField: '_id',
    ref: 'Comment',
});
commentSchema.virtual('reply', {
    foreignField: 'commentId',
    localField: '_id',
    ref: 'Comment',
    justOne: true
});
const CommentModels = mongoose_1.default.models.Comment || mongoose_1.default.model('Comment', commentSchema);
CommentModels.syncIndexes();
exports.default = CommentModels;
