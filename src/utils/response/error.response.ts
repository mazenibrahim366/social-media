import type {  NextFunction, Request, Response } from "express"

interface IError extends Error{
statusCode:number,
  cause?: unknown
}

export class AppError extends Error {
  constructor(public override message:string,public statusCode:number ,public override cause?:unknown) {
    super(message)
    this.name= this.constructor.name
    Error.captureStackTrace(this,this.constructor)
  }

}
export class BadError extends AppError {
  constructor( message:string,statusCode?:number , cause?:unknown) {
    super(message,400,cause)


  }

}
export const globalErrorHandling= (error: IError, req: Request, res: Response, next: NextFunction) =>
    res.status(error.statusCode || 500).json({
      error_message: error.message || 'something went wrong ! ',
      stack: process.env.MOOD === 'development' ? error.stack : undefined,
      cause:error.cause
    })