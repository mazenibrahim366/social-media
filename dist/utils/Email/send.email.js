"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async ({ to, from = process.env.EMAIL_USER, subject = process.env.TEST_SUBJECT, text = process.env.TEST_MESSAGE_EMAIL, cc = [], bcc = [], html = "", attachments = [], }) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });
        const mailOptions = {
            from: ` ${process.env.EMAIL_NAME_FORM} <${from}>`,
            to,
            cc,
            bcc,
            subject,
            text,
            attachments,
            html
        };
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        return;
    }
};
exports.sendEmail = sendEmail;
