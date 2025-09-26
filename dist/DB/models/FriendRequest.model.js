"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const friendRequestSchema = new mongoose_1.default.Schema({
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sendTo: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    acceptedAt: Date,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
friendRequestSchema.pre(['findOne', 'find', 'countDocuments'], function (next) {
    const query = this.getQuery();
    if (query.paranoid == false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeAt: { $exists: false } });
    }
    next();
});
friendRequestSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
    const query = this.getQuery();
    if (query.paranoid == false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeAt: { $exists: false } });
    }
    next();
});
const FriendRequestModels = mongoose_1.default.models.FriendRequest ||
    mongoose_1.default.model('FriendRequest', friendRequestSchema);
FriendRequestModels.syncIndexes();
exports.default = FriendRequestModels;
