"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const models_dto_1 = require("./models.dto");
const postSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        minLength: 2,
        maxLength: 500000,
        required: function () {
            return this.attachments?.length ? true : false;
        },
    },
    attachments: [String],
    availability: {
        type: String,
        enum: models_dto_1.AvailabilityEnum,
        default: models_dto_1.AvailabilityEnum.public,
    },
    allowComments: {
        type: String,
        enum: models_dto_1.AllowCommentsEnum,
        default: models_dto_1.AllowCommentsEnum.allow,
    },
    assetsFolderId: { type: String, required: true },
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
postSchema.pre(['findOne', 'find', 'countDocuments'], function (next) {
    const query = this.getQuery();
    if (query.paranoid == false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeAt: { $exists: false } });
    }
    next();
});
postSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
    const query = this.getQuery();
    if (query.paranoid == false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeAt: { $exists: false } });
    }
    next();
});
postSchema.virtual("comments", { foreignField: "postId", localField: "_id", ref: "Comment", justOne: true });
const PostModels = mongoose_1.default.models.Post || mongoose_1.default.model('Post', postSchema);
PostModels.syncIndexes();
exports.default = PostModels;
