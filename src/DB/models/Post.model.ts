import mongoose from 'mongoose'
import { AllowCommentsEnum, AvailabilityEnum, IPost } from './models.dto'

const postSchema = new mongoose.Schema<IPost>(
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
    availability: {
      type: String,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.public,
    },
    allowComments: {
      type: String,
      enum: AllowCommentsEnum,
      default: AllowCommentsEnum.allow,
    },
    assetsFolderId: { type: String, required: true },
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
postSchema.pre(['findOne', 'find', 'countDocuments'], function (next) {
  const query = this.getQuery()
  // console.log(this)
  if (query.paranoid == false) {
    this.setQuery({ ...query })
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } })
  }
  next()
})
postSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const query = this.getQuery()
  // console.log(this)/
  if (query.paranoid == false) {
    this.setQuery({ ...query })
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } })
  }
  next()
})

postSchema.virtual("comments",{foreignField:"postId" ,localField:"_id",ref:"Comment",justOne:true})

const PostModels = mongoose.models.Post || mongoose.model('Post', postSchema)
//  mongoose.Model.User  ||
PostModels.syncIndexes()

export default PostModels
