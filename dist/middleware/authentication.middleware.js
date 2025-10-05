"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphAuthorization = exports.authorization = exports.authentication = void 0;
const graphql_1 = require("graphql");
const enums_js_1 = require("../utils/enums.js");
const error_response_js_1 = require("../utils/response/error.response.js");
const token_security_js_1 = require("../utils/security/token.security.js");
const authentication = ({ tokenType = enums_js_1.tokenTypeEnum.access } = {}) => {
    return async (req, res, next) => {
        const authorization = req.headers.authorization;
        if (!authorization) {
            return next(new Error('Authorization header missing'));
        }
        const result = await (0, token_security_js_1.decodedToken)({ authorization, tokenType });
        if (!result) {
            return next(new Error('Invalid token'));
        }
        const { user, decoded } = result;
        req.decoded = decoded;
        req.user = user;
        return next();
    };
};
exports.authentication = authentication;
const authorization = (accessRoles = []) => {
    return async (req, res, next) => {
        if (!accessRoles.includes(req.user?.role)) {
            throw new error_response_js_1.AppError('Not authorized account', 403);
        }
        return next();
    };
};
exports.authorization = authorization;
const graphAuthorization = async (accessRoles = [], role) => {
    if (!accessRoles.includes(role)) {
        throw new graphql_1.GraphQLError('authorized account', {
            extensions: { statusCode: 403 },
        });
    }
};
exports.graphAuthorization = graphAuthorization;
