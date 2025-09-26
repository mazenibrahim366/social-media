"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = __importDefault(require("node:events"));
const email_template_1 = require("../Email/email.template");
const send_email_1 = require("../Email/send.email");
exports.emailEvent = new node_events_1.default();
exports.emailEvent.on("sendConfirmEmail", async ([email, subject, otp]) => {
    await (0, send_email_1.sendEmail)({ to: email, subject: subject, html: await (0, email_template_1.emailTemplate)(otp) || otp });
});
