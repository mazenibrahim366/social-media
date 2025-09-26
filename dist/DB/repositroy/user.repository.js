"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const error_response_1 = require("../../utils/response/error.response");
const database_repository_1 = require("./database.repository");
class userRepository extends database_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async createUser({ data, option = { validateBeforeSave: true }, }) {
        const [user] = (await this.create({ data, option }));
        if (!user) {
            throw new error_response_1.AppError('User not created', 404);
        }
        return user;
    }
}
exports.userRepository = userRepository;
