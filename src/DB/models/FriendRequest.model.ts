import mongoose from 'mongoose'
import { IFriendRequest } from './models.dto'

const friendRequestSchema = new mongoose.Schema<IFriendRequest>(
  {
    // createdBy: Types.ObjectId
    // sendTo: Types.ObjectId

    // acceptedAt?: Date
    // createdAt?: Date
    // updatedAt?: Date
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sendTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    acceptedAt: Date,


  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)
friendRequestSchema.pre(['findOne', 'find', 'countDocuments'], function (next) {
  const query = this.getQuery()
  // console.log(this)
  if (query.paranoid == false) {
    this.setQuery({ ...query })
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } })
  }
  next()
})
friendRequestSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const query = this.getQuery()
  // console.log(this)/
  if (query.paranoid == false) {
    this.setQuery({ ...query })
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } })
  }
  next()
})

const FriendRequestModels =
  mongoose.models.FriendRequest ||
  mongoose.model('FriendRequest', friendRequestSchema)
//  mongoose.Model.User  ||
FriendRequestModels.syncIndexes()

export default FriendRequestModels
