"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const error_response_1 = require("../../utils/response/error.response");
const database_repository_1 = require("./database.repository");
const encryption_security_1 = require("../../utils/security/encryption.security");
class UserRepository extends database_repository_1.DatabaseRepository {
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
    async findCursor({ filter = {}, select = '', option = {}, }) {
        let users = [];
        let cursor = this.model
            .find(filter)
            .select(select)
            .populate(option?.populate)
            .cursor();
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const decryptedPhone = await (0, encryption_security_1.decryptEncryption)({
                cipherText: doc?.phone,
            });
            doc.phone = decryptedPhone;
            users.push(doc);
        }
        return users;
    }
}
exports.UserRepository = UserRepository;
