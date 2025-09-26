import mongoose from 'mongoose'
import { IComment } from './models.dto'

const commentSchema = new mongoose.Schema<IComment>(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 500000,
      required: function () {
        return this.attachments?.length ? true : false
      },
    },

    attachments: [String],

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    tag: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    freezeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    freezeAt: Date,

    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    restoredAt: Date,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)
commentSchema.pre(['findOne', 'find', 'countDocuments'], function (next) {
  const query = this.getQuery()
  // console.log(this)
  if (query.paranoid == false) {
    this.setQuery({ ...query })
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } })
  }
  next()
})
commentSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const query = this.getQuery()
  // console.log(this)/
  if (query.paranoid == false) {
    this.setQuery({ ...query })
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } })
  }
  next()
})

commentSchema.virtual('replyComment', {
  foreignField: 'commentId',
  localField: '_id',
  ref: 'Comment',
})
commentSchema.virtual('reply', {
  foreignField: 'commentId',
  localField: '_id',
  ref: 'Comment',

  justOne : true
})

const CommentModels =
  mongoose.models.Comment || mongoose.model('Comment', commentSchema)
//  mongoose.Model.User  ||
CommentModels.syncIndexes()

export default CommentModels
