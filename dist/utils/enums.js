"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerEnum = exports.roleEnum = exports.genderEnum = exports.logoutEnum = exports.tokenTypeEnum = exports.signatureTypeEnum = void 0;
var signatureTypeEnum;
(function (signatureTypeEnum) {
    signatureTypeEnum["system"] = "System";
    signatureTypeEnum["bearer"] = "Bearer";
})(signatureTypeEnum || (exports.signatureTypeEnum = signatureTypeEnum = {}));
var tokenTypeEnum;
(function (tokenTypeEnum) {
    tokenTypeEnum["access"] = "access";
    tokenTypeEnum["refresh"] = "refresh";
})(tokenTypeEnum || (exports.tokenTypeEnum = tokenTypeEnum = {}));
exports.logoutEnum = {
    signoutFromAllDevice: 'signoutFromAllDevice',
    signout: 'signout',
    stayLoggedIn: 'stayLoggedIn',
};
var genderEnum;
(function (genderEnum) {
    genderEnum["male"] = "male";
    genderEnum["female"] = "female";
})(genderEnum || (exports.genderEnum = genderEnum = {}));
var roleEnum;
(function (roleEnum) {
    roleEnum["User"] = "User";
    roleEnum["Admin"] = "Admin";
    roleEnum["superAdmin"] = "super-admin";
})(roleEnum || (exports.roleEnum = roleEnum = {}));
var providerEnum;
(function (providerEnum) {
    providerEnum["system"] = "system";
    providerEnum["google"] = "google";
})(providerEnum || (exports.providerEnum = providerEnum = {}));
