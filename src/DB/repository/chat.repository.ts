import {
  FilterQuery,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
} from 'mongoose'
import { IChat as TDocument } from '../models/models.dto'
import { DatabaseRepository } from './database.repository'

export class ChatRepository extends DatabaseRepository<TDocument> {
  constructor(protected override readonly model: Model<TDocument>) {
    super(model)
  }

  async findOneChat({
    filter = {},
    select = {},
    option = {},
    page = 1,
    size = 5,
  }: {
    filter?: FilterQuery<TDocument>
    select?: ProjectionType<TDocument> | null
    option?: QueryOptions
    page?: number| undefined
    size?: number| undefined
  }): Promise<TDocument | null> {

 
      page = Math.floor(!page||page < 1 ? 1 : page)
    size = Math.floor(size < 1 || !size ? 5 : size)


    
    let doc = this.model.findOne(filter, { message: { $slice: [-(page*size), size] } })
    if (option?.populate) {
      doc = doc.populate(option.populate as PopulateOptions)
    }
    if (option?.lean) {
      doc.lean(option.lean)
    }
    return await doc.exec()
  }
}
