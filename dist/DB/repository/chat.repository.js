"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const database_repository_1 = require("./database.repository");
class ChatRepository extends database_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async findOneChat({ filter = {}, select = {}, option = {}, page = 1, size = 5, }) {
        page = Math.floor(!page || page < 1 ? 1 : page);
        size = Math.floor(size < 1 || !size ? 5 : size);
        let doc = this.model.findOne(filter, { message: { $slice: [-(page * size), size] } });
        if (option?.populate) {
            doc = doc.populate(option.populate);
        }
        if (option?.lean) {
            doc.lean(option.lean);
        }
        return await doc.exec();
    }
}
exports.ChatRepository = ChatRepository;
