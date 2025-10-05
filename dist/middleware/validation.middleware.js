"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphValidation = exports.validation = exports.generalFields = void 0;
const graphql_1 = require("graphql");
const mongoose_1 = require("mongoose");
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../utils/enums");
exports.generalFields = {
    fullName: zod_1.default
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters')
        .refine((value) => {
        const parts = value.split(' ');
        return parts.length === 2;
    }, {
        message: 'Full name must consist of exactly two words',
    }),
    email: zod_1.default.email('Invalid email address'),
    password: zod_1.default
        .string()
        .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, 'Password must contain at least 8 characters, one uppercase, one lowercase, and one number ,pattern :: /^(?=.*d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/'),
    confirmPassword: zod_1.default.string(),
    phone: zod_1.default
        .string()
        .regex(/^(002|\+2)?01[0125][0-9]{8}$/, 'Invalid Egyptian phone number ,pattern :: /^(002|+2)?01[0125][0-9]{8}$/'),
    otp: zod_1.default.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
    id: zod_1.default.string().refine((value) => mongoose_1.Types.ObjectId.isValid(value), {
        message: 'Invalid MongoDB ID',
    }),
    gender: zod_1.default.enum(Object.values(enums_1.genderEnum)),
    flag: zod_1.default.enum(Object.values(enums_1.logoutEnum)),
    file: function (mimetype) {
        return zod_1.default
            .object({
            fieldname: zod_1.default.string(),
            originalname: zod_1.default.string(),
            encoding: zod_1.default.string(),
            mimetype: zod_1.default.enum(mimetype),
            destination: zod_1.default.string().optional(),
            filename: zod_1.default.string().optional(),
            path: zod_1.default.string().optional(),
            buffer: zod_1.default.any().optional(),
            size: zod_1.default.number().positive(),
        })
            .refine((data) => {
            return data.buffer || data.path;
        }, { error: 'neither path or buffer is available', path: ['file'] });
    },
};
const validation = (schema) => {
    return (req, res, next) => {
        console.log(req.body);
        let error = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key]) {
                continue;
            }
            if (req.file) {
                req.body.attachment = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                error.push({
                    key,
                    issues: validationResult.error.issues.map((issue) => {
                        return { path: issue.path, message: issue.message };
                    }),
                });
            }
        }
        if (error.length) {
            return res.status(400).json({ message: 'validation error ', error });
        }
        return next();
    };
};
exports.validation = validation;
const GraphValidation = async (schema, args) => {
    const validationResult = await schema.safeParseAsync(args);
    if (!validationResult.success) {
        const ZError = validationResult.error;
        throw new graphql_1.GraphQLError('validation Error', {
            extensions: {
                statusCode: 400,
                issues: {
                    key: 'args',
                    issues: ZError.issues.map((issue) => {
                        return { path: issue.path, message: issue.message };
                    }),
                },
            },
        });
    }
};
exports.GraphValidation = GraphValidation;
