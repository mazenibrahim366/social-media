import { CreateOptions, FilterQuery, Model, PopulateOptions, QueryOptions } from 'mongoose'
import { AppError } from '../../utils/response/error.response'
import { IUser as TDocument } from './../models/models.dto'
import { DatabaseRepository } from './database.repository'
import { decryptEncryption } from '../../utils/security/encryption.security'

export class UserRepository extends DatabaseRepository<TDocument> {
  constructor(protected override readonly model: Model<TDocument>) {
    super(model)
  }

  async createUser({
    data,
    option = { validateBeforeSave: true },
  }: {
    data: Partial<TDocument>[]
    option?: CreateOptions
  }): Promise<TDocument | TDocument[]> {
    const [user] = (await this.create({ data, option })) as TDocument[]

    if (!user) {
      throw new AppError('User not created', 404)
      
    }
  
    return user
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
      let users = []
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
    const decryptedPhone = await decryptEncryption({
      cipherText: doc?.phone as string,
    })
    doc.phone = decryptedPhone
    users.push(doc)
      }

      return users
    }
}
