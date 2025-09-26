"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOne = exports.create = exports.findOneAndUpdate = exports.updateOne = exports.findById = exports.find = exports.findOne = void 0;
const findOne = async ({ model, filter = {}, select = "", populate = [], }) => {
    return model.findOne(filter).select(select).populate(populate);
};
exports.findOne = findOne;
const find = async ({ model, filter = {}, select = "", option = {}, populate = [], }) => {
    return model.find(filter, option).select(select).populate(populate);
};
exports.find = find;
const findById = async ({ model, id, select = "", populate = [], }) => {
    return model.findById(id).select(select).populate(populate);
};
exports.findById = findById;
const updateOne = async ({ model, filter = {}, data = {}, option = { runValidators: true }, }) => {
    return model.updateOne(filter, data, option);
};
exports.updateOne = updateOne;
const findOneAndUpdate = async ({ model, filter = {}, data = {}, option = { runValidators: true, new: true }, select = "", populate = [], }) => {
    return model
        .findOneAndUpdate(filter, data, option)
        .select(select)
        .populate(populate);
};
exports.findOneAndUpdate = findOneAndUpdate;
const create = async ({ model, data, option = { validateBeforeSave: true }, }) => {
    return model.create(data, option);
};
exports.create = create;
const deleteOne = async ({ model, filter = {}, }) => {
    return model.deleteOne(filter);
};
exports.deleteOne = deleteOne;
