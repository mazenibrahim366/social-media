import mongoose, { Schema } from 'mongoose'
import { IChat, IMessage } from './models.dto'

const messageSchema = new mongoose.Schema<IMessage>(
  {
    content: { type: String, minLength: 2, maxLength: 50000, required: true },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)
const chatSchema = new mongoose.Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomId: {
      type: String,
      required: function () {
        return this.group
      },
    },
    group: String,
    group_image: String,
    message: [messageSchema],
  },
  {
    timestamps: true,
    strictQuery: true,
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  }
)
// chatSchema.pre(['findOne', 'find', 'countDocuments'], function (next) {
//   const query = this.getQuery()
//   // console.log(this)
//   if (query.paranoid == false) {
//     this.setQuery({ ...query })
//   } else {
//     this.setQuery({ ...query, freezeAt: { $exists: false } })
//   }
//   next()
// })
// chatSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
//   const query = this.getQuery()
//   // console.log(this)/
//   if (query.paranoid == false) {
//     this.setQuery({ ...query })
//   } else {
//     this.setQuery({ ...query, freezeAt: { $exists: false } })
//   }
//   next()
// })

// chatSchema.virtual('replyChat', {
//   foreignField: 'ChatId',
//   localField: '_id',
//   ref: 'Chat',
// })

const ChatModels = mongoose.models.Chat || mongoose.model('Chat', chatSchema)
//  mongoose.Model.User  ||
ChatModels.syncIndexes()

export default ChatModels
