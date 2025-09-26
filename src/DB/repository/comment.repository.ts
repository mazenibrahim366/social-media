import {  Model } from 'mongoose'
import { IComment as TDocument } from '../models/models.dto'
import { DatabaseRepository } from './database.repository'

export class CommentRepository extends DatabaseRepository<TDocument> {
  constructor(protected override readonly model: Model<TDocument>) {
    super(model)
  }

  
}
