"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async findOne({ filter = {}, select = '', option = {}, }) {
        let doc = this.model.findOne(filter).select(select);
        if (option?.populate) {
            doc = doc.populate(option.populate);
        }
        if (option?.lean) {
            doc.lean(option.lean);
        }
        return await doc.exec();
    }
    async find({ filter = {}, select = '', option = {}, }) {
        let doc = this.model.find(filter).select(select);
        if (option?.populate) {
            doc = doc.populate(option.populate);
        }
        if (option?.lean) {
            doc.lean(option.lean);
        }
        if (option?.limit) {
            doc.limit(option.limit);
        }
        if (option?.skip) {
            doc.skip(option.skip);
        }
        return await doc.exec();
    }
    async paginate({ filter = {}, select = '', option = {}, page = 'all', size = 5, }) {
        let docCount = undefined;
        let pages = undefined;
        docCount = await this.model.countDocuments(filter);
        if (page !== 'all') {
            page = Math.floor(page < 1 ? 1 : page);
            option.limit = Math.floor(size < 1 || !size ? 5 : size);
            option.skip = (page - 1) * option.limit;
            pages = Math.ceil(docCount / option.limit);
        }
        let result = await this.find({ filter, option, select });
        return { docCount, pages, limit: option.limit, currentPage: page, result };
    }
    async findById({ id, select = '', option = {}, }) {
        let doc = this.model.findById(id).select(select);
        if (option?.populate) {
            doc = doc.populate(option.populate);
        }
        if (option?.lean) {
            doc.lean(option.lean);
        }
        return await doc.exec();
    }
    async updateOne({ filter = {}, data = {}, option = { runValidators: true }, }) {
        if (Array.isArray(data)) {
            data.push({
                $set: { __v: { $add: ['$__v', 1] } },
            });
            return await this.model.updateOne(filter, data, option);
        }
        return await this.model.updateOne(filter, { ...data, $inc: { __v: 1 } }, option);
    }
    async findOneAndUpdate({ filter = {}, data = {}, option = { runValidators: true, new: true }, select = '', populate = [], }) {
        return this.model
            .findOneAndUpdate(filter, { ...data, $inc: { __v: 1 } }, option)
            .select(select)
            .populate(populate);
    }
    async findByIdAndUpdate({ id, data = {}, option = { runValidators: true, new: true }, select = '', populate = [], }) {
        return this.model
            .findByIdAndUpdate(id, { ...data, $inc: { __v: 1 } }, option)
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
