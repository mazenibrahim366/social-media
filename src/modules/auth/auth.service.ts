import type { Request, Response } from 'express'
import { customAlphabet } from 'nanoid'
import { IUser } from '../../DB/models/models.dto'
import UserModels from '../../DB/models/User.model'
// import { UserRepository } from '../../DB/repository/user.repository'
// import { emailEvent } from '../../utils/Email/email.events'
import { UserRepository } from '../../DB/repository/'
import {
  newConfirmOtp,
  newOtpPassword,
} from '../../utils/Email/newConfirmOtp.email'
import { providerEnum } from '../../utils/enums'
import { AppError, BadError } from '../../utils/response/error.response'
import { successResponse } from '../../utils/response/success.response'
import { encryptEncryption } from '../../utils/security/encryption.security'
import { compareHash, generateHash } from '../../utils/security/hash.security'
import { generateLoginToken } from '../../utils/security/token.security'
const { OAuth2Client } = require('google-auth-library')
async function verify(idToken: string) {
  const client = new OAuth2Client()
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.WEB_CLIENT_ID as string | string[], // Specify the WEB_CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
  })
  const payload = ticket.getPayload()
  return payload
}

class AuthenticationService {
  private UserModel = new UserRepository(UserModels)
  constructor() {}
  signupByGmail = async (
    req: Request,
    res: Response
  ): Promise<Response | Error> => {
    const { idToken } = req.body
    const { email, email_verified, name, picture } = await verify(idToken)

    if (!email_verified) {
      throw new AppError('Email not verified', 400)
    }
    const user = await this.UserModel.findOne({ filter: { email } })
    if (user) {
      return new AppError('Email exist', 409)
    }

    const [signupUser] = (await this.UserModel.create({
      data: [
        {
          fullName: name,
          email,
          provider: providerEnum.google,
          picture,
          confirmEmail: Date.now() as unknown as Date,
        },
      ],
    })) as IUser[]

    return successResponse({
      res,
      status: 201,
      // data: process.env.MOOD === 'development' ? { signupUser } : {},
      data: { signupUser },
    })
  }
  loginByGmail = async (
    req: Request,
    res: Response
  ): Promise<Response | Error> => {
    const { idToken } = req.body
    const { email, email_verified } = await verify(idToken)

    if (!email_verified) {
      throw new AppError('Email not verified', 400)
    }

    const user = await this.UserModel.findOne({
      filter: { email, provider: providerEnum.google },
    })
    if (!user) {
      throw new AppError('In-valid login data or provider', 400)
    }
    const data = await generateLoginToken(user)

    return successResponse({
      res,
      status: 201,
      data: process.env.MOOD === 'development' ? { data } : {},
    })
  }
  signup = async (req: Request, res: Response) => {
    let dateExpired = new Date(Date.now() + 2 * 60 * 1000)
    const { fullName, email, password, phone } = req.body

    const encPhone = await encryptEncryption({ message: phone })
    const user = await this.UserModel.findOne({
      filter: { email },
    })

    if (user) {
      throw new AppError('Email exist', 409)
    }
    const otp = customAlphabet('0123456789', 6)()

    // const hashOto = await generateHash({ plainText: otp })
    // const hashPassword = await generateHash({ plainText: password })

    // emailEvent.emit('sendConfirmEmail', [email, 'Confirm-Email', otp])
    // await  sendEmail({to:email ,subject:"Confirm-Email" ,html:await emailTemplate(otp), res ,next})
    const [signupUser] = (await this.UserModel.create({
      data: [
        {
          fullName,
          email,
          // password: hashPassword,
          password,
          phone: encPhone,
          confirmEmailOtp: otp,
          // confirmEmailOtp: hashOto,
          otpExpired: dateExpired,
          otpAttempts: { bannedUntil: null, count: 0 },
        },
      ],
    })) as IUser[]

    return successResponse({
      res,
      status: 201,
      data: process.env.MOOD === 'development' ? { signupUser } : {},
    })
  }

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body
    const user = await this.UserModel.findOne({
      filter: { email, provider: providerEnum.system },
    })
    if (!user) {
      throw new AppError(
        'In-valid login data or provider or email not confirmed',
        404
      )
    }
    if (!user.confirmEmail) {
      throw new BadError('please verify your access first ')
    }
    if (user.deletedAt) {
      throw new BadError('this account is deleted')
    }
    if (
      !(await compareHash({ plainText: password, hashValue: user.password }))
    ) {
      throw new AppError('In-valid login data', 404)
    }
    const data = await generateLoginToken(user)
    return successResponse({ res, status: 200, data })
  }
  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp } = req.body
    const user: IUser | null = await this.UserModel.findOne({
      filter: {
        email,
        provider: providerEnum.system,
        confirmEmail: { $exists: false },
        confirmEmailOtp: { $exists: true },
      },
    })
    if (!user) {
      throw new AppError('In-valid account', 404)
    }
    if (user.otpExpired && user.otpExpired < new Date()) {
      throw new BadError(`OTP Expired `)
    }
    if (
      user.otpAttempts.bannedUntil &&
      user.otpAttempts.bannedUntil > new Date()
    ) {
      throw new BadError(
        `You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`
      )
    }

    if (
      !(await compareHash({ plainText: otp, hashValue: user.confirmEmailOtp }))
    ) {
      throw new BadError('In-valid OTP')
    }

    await this.UserModel.updateOne({
      filter: { email },
      data: {
        $set: { confirmEmail: Date.now() },
        $unset: { confirmEmailOtp: 1, otpExpired: 1, otpAttempts: 1 },
      },
    })

    return successResponse({ res })
  }
  newConfirmEmail = async (
    req: Request,
    res: Response
  ): Promise<Response | void> => {
    const { email } = req.body

    await newConfirmOtp({ email, subject: 'Confirm-Email', res })
  }
  newConfirmPassword = async (
    req: Request,
    res: Response
  ): Promise<Response | void> => {
    const { email } = req.body

    await newOtpPassword({ email, subject: 'Confirm Password', res })
    return successResponse({ res })
  }
  verifyForgotPassword = async (
    req: Request,
    res: Response
  ): Promise<Response | void> => {
    const { email, otp } = req.body

    const user = await this.UserModel.findOne({
      filter: {
        email,
        provider: providerEnum.system,
        confirmEmail: { $exists: true },
        deletedAt: { $exists: false },
        confirmPasswordOtp: { $exists: true },
      },
    })
    if (!user) {
      throw new AppError('In-valid account', 404)
    }
    if (user.confirmEmailOtp) {
      throw new AppError(
        'In-valid login data or provider or email not confirmed',
        404
      )
    }
    if (user.otpExpired && user.otpExpired < new Date()) {
      throw new AppError(`OTP Expired `, 400)
    }
    if (
      user.otpAttempts.bannedUntil &&
      user.otpAttempts.bannedUntil > new Date()
    ) {
      throw new AppError(
        `You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`,
        400
      )
    }

    if (
      !(await compareHash({
        plainText: otp,
        hashValue: user.confirmPasswordOtp,
      }))
    ) {
      throw new AppError('In-valid OTP', 400)
    }
    return successResponse({ res })
  }
  forgotPassword = async (
    req: Request,
    res: Response
  ): Promise<Response | void> => {
    const { email, password, otp } = req.body

    const user: IUser | null = await this.UserModel.findOne({
      filter: {
        email,
        provider: providerEnum.system,
        confirmEmail: { $exists: true },
        deletedAt: { $exists: false },
      },
    })
    if (!user) {
      throw new AppError('In-valid account', 404)
    }
    if (user.confirmEmailOtp) {
      throw new AppError(
        'In-valid login data or provider or email not confirmed',
        404
      )
    }
    if (user.otpExpired && user.otpExpired < new Date()) {
      throw new AppError(`OTP Expired `, 400)
    }
    if (
      user.otpAttempts.bannedUntil &&
      user.otpAttempts.bannedUntil > new Date()
    ) {
      throw new AppError(
        `You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`,
        400
      )
    }

    if (
      !(await compareHash({
        plainText: otp,
        hashValue: user.confirmPasswordOtp,
      }))
    ) {
      throw new AppError('In-valid OTP', 400)
    }
    if (user.oldPassword?.length) {
      for (const historyPassword of user.oldPassword) {
        if (
          await compareHash({ plainText: password, hashValue: historyPassword })
        ) {
          throw new AppError('this password is used before In-valid old ', 400)
        }
      }
    }
    const hashPassword = await generateHash({ plainText: password })

    await this.UserModel.updateOne({
      filter: { email },
      data: {
        $set: {
          updatePassword: Date.now(),
          changeCredentialsTime: new Date(),
          password: hashPassword,
        },
        $unset: { confirmPasswordOtp: 1, otpExpired: 1, otpAttempts: 1 },
        $inc: { __v: 1 },
        $push: { oldPassword: user.password },
      },
    })
    return successResponse({ res })
  }
}

export default new AuthenticationService()
