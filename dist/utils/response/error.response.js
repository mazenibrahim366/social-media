"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = exports.BadError = exports.AppError = void 0;
class AppError extends Error {
    message;
    statusCode;
    cause;
    constructor(message, statusCode, cause) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.cause = cause;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadError extends AppError {
    constructor(message, statusCode, cause) {
        super(message, 400, cause);
    }
}
exports.BadError = BadError;
const globalErrorHandling = (error, req, res, next) => res.status(error.statusCode || 500).json({
    error_message: error.message || 'something went wrong ! ',
    stack: process.env.MOOD === 'development' ? error.stack : undefined,
    cause: error.cause
});
exports.globalErrorHandling = globalErrorHandling;
