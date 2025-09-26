"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const Comment_model_1 = __importDefault(require("../models/Comment.model"));
const comment_repository_1 = require("./comment.repository");
const database_repository_1 = require("./database.repository");
class PostRepository extends database_repository_1.DatabaseRepository {
    model;
    CommentModel = new comment_repository_1.CommentRepository(Comment_model_1.default);
    constructor(model) {
        super(model);
        this.model = model;
    }
    async findCursor({ filter = {}, select = '', option = {}, }) {
        let result = [];
        let cursor = this.model
            .find(filter)
            .select(select)
            .populate(option?.populate)
            .cursor();
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const comments = await this.CommentModel.find({
                filter: { postId: doc._id, commentId: { $exists: false } },
            });
            result.push({ post: doc, comments });
        }
        return result;
    }
}
exports.PostRepository = PostRepository;
