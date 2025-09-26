import z from 'zod'
import { generalFields } from '../../middleware/validation.middleware'

export const signup = {
  body: z
    .strictObject({
      fullName: generalFields.fullName,
      email: generalFields.email,
      password: generalFields.password,
      confirmPassword: generalFields.confirmPassword,
      phone: generalFields.phone,
    })
    .refine((data) => data.password === data.confirmPassword, {
      
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
}
export const login = {
  body: z
    .strictObject({
      email: generalFields.email,
      password: generalFields.password,
    })
}
export const confirmEmail = {
  body: z
    .strictObject({
      email: generalFields.email,
      otp: generalFields.otp,
    })
}
export const newConfirmEmail =  {
  body: z
    .strictObject({
      email: generalFields.email,
  
    })
}

export const signupByGmail = {
  body: z
    .strictObject({
      idToken: z.string().min(1, 'idToken is required'),

    })

}


export const loginByGmail = {
  body: z
    .strictObject({
    idToken: z.string().min(1, 'idToken is required'),

    })

}
export const updatePassword = {
  body: z
    .strictObject({
    email:generalFields.email,
otp: generalFields.otp,
password: generalFields.password,
confirmPassword: generalFields.confirmPassword,



    })

}
export const verifyForgotPassword = {
  body: z
    .strictObject({
   email: generalFields.email,
      otp: generalFields.otp,
    })

}
export const confirmPasswordOtp = {
  body: z
    .strictObject({
    email: generalFields.email,

    })

}
