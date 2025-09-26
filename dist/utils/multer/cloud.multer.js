"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudFileUpload = exports.fileValidation = exports.StorageEnum = void 0;
const multer_1 = __importDefault(require("multer"));
const error_response_1 = require("../response/error.response");
var StorageEnum;
(function (StorageEnum) {
    StorageEnum["memory"] = "memory";
    StorageEnum["disk"] = "disk";
})(StorageEnum || (exports.StorageEnum = StorageEnum = {}));
exports.fileValidation = {
    image: ['image/jpeg', 'image/png', 'image/gif'],
    document: ['application/pdf', 'application/msword'],
};
const cloudFileUpload = ({ maxSize = 2, validation = [], storageApproach = StorageEnum.memory, }) => {
    const storage = storageApproach === StorageEnum.memory
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({});
    const fileFilter = (req, file, callback) => {
        if (!validation.includes(file.mimetype)) {
            callback(new error_response_1.AppError('validation error', 401, {
                validationError: [
                    {
                        key: 'file',
                        issues: [{ path: 'file', message: 'Invalid file type!' }],
                    },
                ],
            }));
        }
        else {
            callback(null, true);
        }
    };
    return (0, multer_1.default)({
        storage,
        fileFilter,
        limits: { fileSize: 1024 * 1024 * maxSize },
    });
};
exports.cloudFileUpload = cloudFileUpload;
