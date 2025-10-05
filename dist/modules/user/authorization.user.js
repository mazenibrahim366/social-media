"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const enums_1 = require("../../utils/enums");
exports.endPoint = {
    profile: [enums_1.roleEnum.User, enums_1.roleEnum.Admin, enums_1.roleEnum.superAdmin],
    hallo: [enums_1.roleEnum.User, enums_1.roleEnum.Admin, enums_1.roleEnum.superAdmin],
    hardDelete: [enums_1.roleEnum.Admin, enums_1.roleEnum.superAdmin],
    dashboard: [enums_1.roleEnum.Admin, enums_1.roleEnum.superAdmin],
    changeRole: [enums_1.roleEnum.Admin, enums_1.roleEnum.superAdmin],
};
