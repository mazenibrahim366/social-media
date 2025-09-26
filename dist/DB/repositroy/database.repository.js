"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async findOne({ filter = {}, select = '', populate = [], }) {
        return this.model.findOne(filter).select(select).populate(populate);
    }
    async find({ filter = {}, select = '', option = {}, populate = [], }) {
        return this.model.find(filter, option).select(select).populate(populate);
    }
    async findById({ id, select = '', populate = [], }) {
        return this.model.findById(id).select(select).populate(populate);
    }
    async updateOne({ filter = {}, data = {}, option = { runValidators: true }, }) {
        return this.model.updateOne(filter, data, option);
    }
    async findOneAndUpdate({ filter = {}, data = {}, option = { runValidators: true, new: true }, select = '', populate = [], }) {
        return this.model
            .findOneAndUpdate(filter, data, option)
            .select(select)
            .populate(populate);
    }
    async create({ data, option = { validateBeforeSave: true }, }) {
        return this.model.create(data, option);
    }
    async deleteOne({ filter = {} }) {
        return this.model.deleteOne(filter);
    }
    async deleteMany({ filter = {} }) {
        return this.model.deleteMany(filter);
    }
}
exports.DatabaseRepository = DatabaseRepository;
