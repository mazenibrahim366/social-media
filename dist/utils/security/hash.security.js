"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.generateHash = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const generateHash = async ({ plainText = '', saltRound = process.env.SALT, } = {}) => {
    return bcrypt_1.default.hashSync(plainText, parseInt(saltRound));
};
exports.generateHash = generateHash;
const compareHash = async ({ plainText = '', hashValue = '' }) => {
    return bcrypt_1.default.compareSync(plainText, hashValue);
};
exports.compareHash = compareHash;
