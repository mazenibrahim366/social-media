import { FilterQuery, Model, PopulateOptions, QueryOptions } from 'mongoose'
import CommentModels from '../models/Comment.model'
import { IPost as TDocument } from './../models/models.dto'
import { CommentRepository } from './comment.repository'
import { DatabaseRepository } from './database.repository'

export class PostRepository extends DatabaseRepository<TDocument> {
  private CommentModel = new CommentRepository(CommentModels)

  constructor(protected override readonly model: Model<TDocument>) {
    super(model)
  }
  async findCursor({
    filter = {},
    select = '',
    option = {},
  }: {
    filter?: FilterQuery<TDocument>
    select?: string
    option?: QueryOptions
  }): Promise<TDocument[] | unknown> {
    let result = []
    let cursor = this.model
      .find(filter)
      .select(select)
      .populate(option?.populate as PopulateOptions)
      .cursor()

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      const comments = await this.CommentModel.find({
        filter: { postId: doc._id, commentId: { $exists: false } },
      })

      result.push({ post: doc, comments })
    }
    // if (option?.populate) {
    //   doc = doc.populate(option.populate as PopulateOptions)
    // }
    // if (option?.lean) {
    //   doc.lean(option.lean)
    // }
    // if (option?.limit) {
    //   doc.limit(option.limit)
    // }
    // if (option?.skip) {
    //   doc.skip(option.skip)
    // }
    return result
  }
}
