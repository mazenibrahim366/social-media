"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeActionEnum = exports.AvailabilityEnum = exports.AllowCommentsEnum = void 0;
var AllowCommentsEnum;
(function (AllowCommentsEnum) {
    AllowCommentsEnum["allow"] = "allow";
    AllowCommentsEnum["deny"] = "deny";
})(AllowCommentsEnum || (exports.AllowCommentsEnum = AllowCommentsEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["public"] = "public";
    AvailabilityEnum["friends"] = "friends";
    AvailabilityEnum["onlyMe"] = "only-me";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var LikeActionEnum;
(function (LikeActionEnum) {
    LikeActionEnum["like"] = "like";
    LikeActionEnum["unlike"] = "unlike";
})(LikeActionEnum || (exports.LikeActionEnum = LikeActionEnum = {}));
