"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const tokenSchema = new mongoose_1.default.Schema({
    jti: { type: String, required: true, unique: true },
    expiresIn: { type: Number, required: true },
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
}, {
    timestamps: true,
});
const TokenModels = mongoose_1.default.models.Token || mongoose_1.default.model("Token", tokenSchema);
TokenModels.syncIndexes();
exports.default = TokenModels;
