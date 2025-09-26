import type { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import z, { ZodType } from 'zod'
import { genderEnum, logoutEnum } from '../utils/enums'
export const generalFields = {
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    // .transform((value) => value.trim().split(/\s+/).join(' '))
    .refine(
      (value) => {
        const parts = value.split(' ')
        return parts.length === 2
      },
      {
        message: 'Full name must consist of exactly two words',
      }
    ),
  email: z.email('Invalid email address'),
  password: z
    .string()
    .regex(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
      'Password must contain at least 8 characters, one uppercase, one lowercase, and one number ,pattern :: /^(?=.*d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/'
    ),
  confirmPassword: z.string(),
  phone: z
    .string()
    .regex(
      /^(002|\+2)?01[0125][0-9]{8}$/,
      'Invalid Egyptian phone number ,pattern :: /^(002|+2)?01[0125][0-9]{8}$/'
    ),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid MongoDB ID',
  }),
  gender: z.enum(Object.values(genderEnum) as [string, ...string[]]),
  flag: z.enum(Object.values(logoutEnum) as [string, ...string[]]),
  file: function (mimetype : string[]) {
    return z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum(mimetype),
    destination: z.string().optional() ,
    filename: z.string().optional(),
    path: z.string().optional(),
    buffer: z.any().optional(),
    size: z.number().positive(),
  }).refine((data)=>{
return  data.buffer|| data.path


  },{error:"neither path or buffer is available" ,path :["file"]})
  },
}


// {
// [1]     fieldname: 'attachments',
// [1]     originalname: '12441386.png',
// [1]     encoding: '7bit',
// [1]     mimetype: 'image/png',
// [1]     buffer: <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 01 00 00 00 01 00 08 06 00 00 00 5c 72 a8 66 00 00 00 09 70 48 59 73 00 00 07 61 00 00 07 61 01 ... 16758 more bytes>,
// [1]     size: 16808
// [1]   }




type KeyReqType = keyof Request
type SchemaTypes = Partial<Record<KeyReqType, ZodType>>
export const validation = (schema: SchemaTypes) => {

  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): NextFunction | Response => {
     console.log(req.body)
    let error: Array<{
      key: KeyReqType
      issues: { path: (string | number | symbol | undefined)[]; message: string }[]
    }> = []
    for (const key of Object.keys(schema) as KeyReqType[]) {
      if (!schema[key]) {
        continue
      }
      if (req.file) {
        req.body.attachment = req.file
      }
      if (req.files) {
        req.body.attachments = req.files
        // console.log(req.files)
      }
      const validationResult = schema[key].safeParse(req[key])
      if (!validationResult.success) {
        error.push({
          key,
          issues: validationResult.error.issues.map((issue) => {
            return { path: issue.path, message: issue.message , }
          }),
        })
      }
    }
    if (error.length) {
      return res.status(400).json({ message: 'validation error ', error })
    }
    return next() as unknown as NextFunction
  }
}
