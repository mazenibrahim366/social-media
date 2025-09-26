"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Event = void 0;
const node_events_1 = __importDefault(require("node:events"));
const User_model_1 = __importDefault(require("../../DB/models/User.model"));
const user_repository_1 = require("../../DB/repository/user.repository");
const s3_config_1 = require("./s3.config");
exports.s3Event = new node_events_1.default();
exports.s3Event.on('trackFileUpload', (data) => {
    setTimeout(async () => {
        const userModel = new user_repository_1.UserRepository(User_model_1.default);
        try {
            await userModel.updateOne({
                filter: { _id: data.userId },
                data: { $unset: { temProfileImage: 1 } },
            });
            await (0, s3_config_1.getFile)({ Key: data.key });
            console.log('Done file uploaded');
        }
        catch (error) {
            if (error && error.Code === 'NoSuchKey') {
                await userModel.updateOne({
                    filter: { _id: data.userId },
                    data: { picture: data.oldKey, $unset: { temProfileImage: 1 } },
                });
                console.log(error);
            }
        }
    }, data.expiresIn || 30000);
});
