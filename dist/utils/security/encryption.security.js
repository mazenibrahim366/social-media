"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptEncryption = exports.encryptEncryption = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const encryptEncryption = async ({ message = '', secretKey = process.env.ENC_SECRET } = {}) => {
    return crypto_js_1.default.AES.encrypt(message, secretKey).toString();
};
exports.encryptEncryption = encryptEncryption;
const decryptEncryption = async ({ cipherText = '', secretKey = process.env.ENC_SECRET } = {}) => {
    return crypto_js_1.default.AES.decrypt(cipherText, secretKey).toString(crypto_js_1.default.enc.Utf8);
};
exports.decryptEncryption = decryptEncryption;
