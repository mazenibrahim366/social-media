"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolderByPrefix = exports.listDirectoryFiles = exports.deleteFiles = exports.deleteFile = exports.getFile = exports.createGetPreSignedURL = exports.createPreSignedUploadURL = exports.uploadLargeFile = exports.uploadLargeFiles = exports.uploadFiles = exports.uploadFile = exports.s3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs_1 = require("fs");
const nanoid_1 = require("nanoid");
const error_response_1 = require("../response/error.response");
const cloud_multer_1 = require("./cloud.multer");
const s3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
};
exports.s3Config = s3Config;
const uploadFile = async ({ storageApproach = cloud_multer_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = 'private', path = 'general', file, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.AWS_BUCKET_NAME}/${path}/${(0, nanoid_1.nanoid)()}_${file.originalname}`,
        Body: storageApproach === cloud_multer_1.StorageEnum.memory
            ? file.buffer
            : (0, fs_1.createReadStream)(file.path),
        ContentType: file.mimetype,
    });
    await (0, exports.s3Config)().send(command);
    if (!command?.input.Key) {
        throw new error_response_1.AppError('File to generate upload key', 401);
    }
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadFiles = async ({ storageApproach = cloud_multer_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = 'private', path = 'general', files, useLargeFiles = false, }) => {
    let urls = [];
    if (useLargeFiles) {
        urls = await (0, exports.uploadLargeFiles)({ storageApproach, Bucket, ACL, path, files });
        return urls;
    }
    urls = await Promise.all(files?.map((file) => {
        return (0, exports.uploadFile)({ storageApproach, Bucket, ACL, path, file });
    }));
    return urls;
};
exports.uploadFiles = uploadFiles;
const uploadLargeFiles = async ({ storageApproach = cloud_multer_1.StorageEnum.disk, Bucket = process.env.AWS_BUCKET_NAME, ACL = 'private', path = 'general', files, }) => {
    let urls = [];
    urls = await Promise.all(files?.map((file) => {
        return (0, exports.uploadLargeFile)({ storageApproach, Bucket, ACL, path, file });
    }));
    return urls;
};
exports.uploadLargeFiles = uploadLargeFiles;
const uploadLargeFile = async ({ storageApproach = cloud_multer_1.StorageEnum.disk, Bucket = process.env.AWS_BUCKET_NAME, ACL = 'private', path = 'general', file, PSize = 5, }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.s3Config)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.AWS_BUCKET_NAME}/${path}/${(0, nanoid_1.nanoid)()}_${file.originalname}`,
            Body: storageApproach === cloud_multer_1.StorageEnum.memory
                ? file.buffer
                : (0, fs_1.createReadStream)(file.path),
            ContentType: file.mimetype,
        },
        partSize: PSize * 1024 * 1024,
    });
    upload.on('httpUploadProgress', (progress) => {
        console.log({ progress });
    });
    const { Key } = await upload.done();
    if (!Key) {
        throw new error_response_1.AppError('File to generate upload key', 401);
    }
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const createPreSignedUploadURL = async ({ Bucket = process.env.AWS_BUCKET_NAME, ACL = 'private', path = 'general', ContentType, originalname, expiresIn = 120, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.AWS_BUCKET_NAME}/${path}/${(0, nanoid_1.nanoid)()}_${originalname}`,
        ContentType,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn });
    if (!url || !command?.input.Key) {
        throw new error_response_1.AppError('File to generate upload url', 401);
    }
    return { url, key: command.input.Key };
};
exports.createPreSignedUploadURL = createPreSignedUploadURL;
const createGetPreSignedURL = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, expiresIn = 120, downloadName, download = 'false', }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: download === 'true'
            ? `attachment; filename="${Key.split('/').pop()}"` ||
                `attachment; filename="file"`
            : undefined,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn });
    if (!url) {
        throw new error_response_1.AppError('File to generate upload url', 401);
    }
    return url;
};
exports.createGetPreSignedURL = createGetPreSignedURL;
const getFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key,
    });
    return await (0, exports.s3Config)().send(command);
};
exports.getFile = getFile;
const deleteFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, }) => {
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket,
        Key,
    });
    return await (0, exports.s3Config)().send(command);
};
exports.deleteFile = deleteFile;
const deleteFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, Quiet = false, urls, }) => {
    const command = new client_s3_1.DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects: urls?.map((url) => ({ Key: url })),
            Quiet,
        },
    });
    return await (0, exports.s3Config)().send(command);
};
exports.deleteFiles = deleteFiles;
const listDirectoryFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, path, }) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLICATION_NAME}/${path}/`,
    });
    return await (0, exports.s3Config)().send(command);
};
exports.listDirectoryFiles = listDirectoryFiles;
const deleteFolderByPrefix = async ({ Bucket = process.env.AWS_BUCKET_NAME, path, Quiet = false, }) => {
    const fileList = await (0, exports.listDirectoryFiles)({ Bucket, path });
    if (!fileList.Contents?.length) {
        console.log('No files found in this directory', 404);
        return fileList;
    }
    return await (0, exports.deleteFiles)({
        Bucket,
        urls: fileList.Contents?.map((file) => file.Key),
        Quiet,
    });
};
exports.deleteFolderByPrefix = deleteFolderByPrefix;
