import mongoose from 'mongoose'
import { emailEvent } from '../../utils/Email/email.events'
import { genderEnum, providerEnum, roleEnum } from '../../utils/enums'
import { BadError } from '../../utils/response/error.response'
import { generateHash } from '../../utils/security/hash.security'
import { IUser } from './models.dto'

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: { type: String, required: true, minLength: 2, maxLength: 20 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 20 },
    slug: { type: String, required: true, minLength: 5, maxLength: 51 },
    email: { type: String, unique: true, required: true, minLength: 2 },
    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === providerEnum.system ? true : false
      },
      minLength: 2,
    },
    provider: {
      type: String,
      enum: { values: Object.values(providerEnum) },
      default: providerEnum.system,
    },
    phone: { type: String },
    confirmEmailOtp: {
      type: String,
      required: function (this: IUser) {
        return this.provider === providerEnum.system ? true : false
      },
    },
    otpExpired: {
      type: Date,
      required: function (this: IUser) {
        return this.provider === providerEnum.system ? true : false
      },
    },
    otpAttempts: {
      count: { type: Number, default: 0 },
      bannedUntil: { type: Date },
    },
    picture: String,
    temProfileImage: String,
    pictureCover: [String],
    gender: {
      type: String,
      enum: {
        values: Object.values(genderEnum),
        message: `gender only allow ${Object.values(genderEnum)} `,
      },
      default: genderEnum.male,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(roleEnum),
        message: `role only allow ${Object.values(roleEnum)} `,
      },
      default: roleEnum.User,
    },
    confirmEmail: { type: Date },
    deletedAt: { type: Date },
    freezeAt: { type: Date },
    freezeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    restoreAt: Date,
    restoreBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    oldPassword: [String],
    updatePassword: { type: Date },
    changeCredentialsTime: { type: Date },
    confirmPasswordOtp: { type: String },
    friend: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true, // pranoid
  }
)

userSchema
  .virtual('fullName')
  .set(function (this: IUser, value: string) {
    const [firstName, lastName] = value?.split(' ')
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, '-') })
  })
  .get(function (this: IUser) {
    return this.firstName + ' ' + this.lastName
  })

userSchema.pre(
  'save',
  async function (
    this: IUser & {
      wasNew: boolean
      confirmPasswordPlanOtp?: string | undefined
    },
    next
  ) {
    this.wasNew = this.isNew
    this.confirmPasswordPlanOtp = this.confirmEmailOtp

    if (this.isModified('password')) {
      this.password = await generateHash({ plainText: this.password })
    }
    if (this.isModified('confirmEmailOtp')) {
      this.confirmEmailOtp = await generateHash({
        plainText: this.confirmEmailOtp,
      })
    }
    if (!this.slug?.includes('-')) {
      return next(
        new BadError(
          'slug is required and must hold - like ex : any-something '
        )
      )
    }
  }
)
userSchema.post('save', async function (doc, next) {
  const that = this as unknown as IUser & {
    wasNew: boolean
    confirmPasswordPlanOtp?: string | undefined
  }
  // console.log(that.wasNew)
  if (that.wasNew && that.confirmPasswordPlanOtp) {
    emailEvent.emit('sendConfirmEmail', [
      this.email,
      'Confirm-Email',
      that.confirmPasswordPlanOtp,
    ])
  }
})
userSchema.pre(['findOne', 'find'], function (next) {
  const query = this.getQuery()
  // console.log(this)
  if (query.paranoid == false) {
    this.setQuery({ ...query })
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } })
  }
  next()
})

userSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const query = this.getQuery()
  // console.log(this)
  if (query.paranoid == false) {
    this.setQuery({ ...query })
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } })
  }
  next()
})

// userSchema.pre(['updateOne'], async function (next) {
//   // const query = this.getQuery()
//   const update = this.getUpdate() as UpdateQuery<IUser>

//   if (update.freezeAt) {
//     this.setUpdate({...update, changeCredentialsTime: new Date()})
//   }
// })
// userSchema.post(['updateOne'], async function (doc,next) {
//   const query = this.getQuery()
//   const update = this.getUpdate() as UpdateQuery<IUser>

//   if (update["$set"].changeCredentialsTime) {

//   const TokenModel = new TokenRepository(TokenModels)
// await TokenModel.deleteMany({filter:{userId:query._id}})

//   }
// })
// userSchema.post(['deleteOne'], async function (doc,next) {
//   const query = this.getQuery()
//   const update = this.getUpdate() as UpdateQuery<IUser>

//   if (update["$set"].changeCredentialsTime) {

//   const TokenModel = new TokenRepository(TokenModels)
// await TokenModel.deleteMany({filter:{userId:query._id}})

//   }
// })
const UserModels =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema)

UserModels.syncIndexes()

export default UserModels
