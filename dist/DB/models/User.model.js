"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const email_events_1 = require("../../utils/Email/email.events");
const enums_1 = require("../../utils/enums");
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const userSchema = new mongoose_1.default.Schema({
    firstName: { type: String, required: true, minLength: 2, maxLength: 20 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 20 },
    slug: { type: String, required: true, minLength: 5, maxLength: 51 },
    email: { type: String, unique: true, required: true, minLength: 2 },
    password: {
        type: String,
        required: function () {
            return this.provider === enums_1.providerEnum.system ? true : false;
        },
        minLength: 2,
    },
    provider: {
        type: String,
        enum: { values: Object.values(enums_1.providerEnum) },
        default: enums_1.providerEnum.system,
    },
    phone: { type: String },
    confirmEmailOtp: {
        type: String,
        required: function () {
            return this.provider === enums_1.providerEnum.system ? true : false;
        },
    },
    otpExpired: {
        type: Date,
        required: function () {
            return this.provider === enums_1.providerEnum.system ? true : false;
        },
    },
    otpAttempts: {
        count: { type: Number, default: 0 },
        bannedUntil: { type: Date },
    },
    picture: String,
    temProfileImage: String,
    pictureCover: [String],
    gender: {
        type: String,
        enum: {
            values: Object.values(enums_1.genderEnum),
            message: `gender only allow ${Object.values(enums_1.genderEnum)} `,
        },
        default: enums_1.genderEnum.male,
    },
    role: {
        type: String,
        enum: {
            values: Object.values(enums_1.roleEnum),
            message: `role only allow ${Object.values(enums_1.roleEnum)} `,
        },
        default: enums_1.roleEnum.User,
    },
    confirmEmail: { type: Date },
    deletedAt: { type: Date },
    freezeAt: { type: Date },
    freezeBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    restoreAt: Date,
    restoreBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    oldPassword: [String],
    updatePassword: { type: Date },
    changeCredentialsTime: { type: Date },
    confirmPasswordOtp: { type: String },
    friend: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    blockList: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true,
});
userSchema
    .virtual('fullName')
    .set(function (value) {
    const [firstName, lastName] = value?.split(' ');
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, '-') });
})
    .get(function () {
    return this.firstName + ' ' + this.lastName;
});
userSchema.pre('save', async function (next) {
    this.wasNew = this.isNew;
    this.confirmPasswordPlanOtp = this.confirmEmailOtp;
    if (this.isModified('password')) {
        this.password = await (0, hash_security_1.generateHash)({ plainText: this.password });
    }
    if (this.isModified('confirmEmailOtp')) {
        this.confirmEmailOtp = await (0, hash_security_1.generateHash)({
            plainText: this.confirmEmailOtp,
        });
    }
    if (!this.slug?.includes('-')) {
        return next(new error_response_1.BadError('slug is required and must hold - like ex : any-something '));
    }
});
userSchema.post('save', async function (doc, next) {
    const that = this;
    if (that.wasNew && that.confirmPasswordPlanOtp) {
        email_events_1.emailEvent.emit('sendConfirmEmail', [
            this.email,
            'Confirm-Email',
            that.confirmPasswordPlanOtp,
        ]);
    }
});
userSchema.pre(['findOne', 'find'], function (next) {
    const query = this.getQuery();
    if (query.paranoid == false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeAt: { $exists: false } });
    }
    next();
});
userSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
    const query = this.getQuery();
    if (query.paranoid == false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeAt: { $exists: false } });
    }
    next();
});
const UserModels = mongoose_1.default.models.User || mongoose_1.default.model('User', userSchema);
UserModels.syncIndexes();
exports.default = UserModels;
