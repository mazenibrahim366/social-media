import cors from 'cors'
import { config } from 'dotenv'
import type { Express, Request, Response } from 'express'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { resolve } from 'node:path'
import ConnectionDB from './DB/connection.db'
// import authController from './modules/auth/auth.controller'
import * as router from './modules'
// import userController from './modules/user/user.controller'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { createGetPreSignedURL, getFile } from './utils/multer/s3.config'
import { AppError, globalErrorHandling } from './utils/response/error.response'
import { successResponse } from './utils/response/success.response'

const createS3WriteStreamPipe = promisify(pipeline)
config({ path: resolve('./config/.env.development') })

const bootstrap = async () => {
  const app: Express = express()
  const port: number | string = process.env.PORT || 5000

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    message: { error: 'too many request please try again later ' },
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
    // store: ... , // Redis, Memcached, etc. See below.
  })
  // helmet
  app.use(helmet())

  // cors
  app.use(cors())
  // Apply the rate limiting middleware to all requests.
  app.use(limiter)
  // DB connection
  await ConnectionDB()
  // app router

  app.use(express.json())
  app.get('/', (req: Request, res: Response) =>
    res.json({
      message: `welcome to ${process.env.APPLICATION_NAME} backend landing page `,
    })
  )
  //sup app router modules
  app.use('/auth', router.authRouter)
  app.use('/users', router.userRouter)
  app.use('/posts', router.postRouter)
  app.use('/chat', router.chatRouter)
  app.get('/upload/Pre-signed/*path', async (req: Request, res: Response) => {
    const { downloadName, download = 'false' } = req.query as unknown as {
      downloadName?: string
      download?: string
    }
    const { path } = req.params as unknown as { path: string[] }
    const Key = path.join('/')

    console.log({ Key }, path.join('/'))
    const url = await createGetPreSignedURL({
      Key,
      downloadName: downloadName as string,
      download,
    })
    if (!url) {
      throw new AppError('fail to fetch this asset', 404)
    }
    //
    return successResponse({ res, data: { url } as Object })
  })
  app.get('/upload/*path', async (req: Request, res: Response) => {
    const { downloadName, download = false } = req.query as unknown as {
      downloadName?: string
      download?: string
    }
    const { path } = req.params as unknown as { path: string[] }
    const Key = path.join('/')

    const s3Response = await getFile({ Key })
    if (!s3Response?.Body) {
      throw new AppError('fail to fetch this asset', 404)
    }
    res.setHeader(
      'Content-Type',
      (s3Response.ContentType as string) || 'application/octet-stream'
    )

    if (download == 'true') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${
          downloadName?.split('/').pop() || Key.split('/').pop()
        }"` || `attachment; filename="file"`
      )
    }

    // s3Response.Body.pipe(res)
    return await createS3WriteStreamPipe(
      s3Response.Body as NodeJS.ReadableStream,
      res
    )
  })

  // global error handling
  app.use(globalErrorHandling)

  app.all('{/*dummy}', (req, res) =>
    res.status(404).json({ message: 'In-valid app router' })
  )
  const httpServer = app.listen(port, () =>
    console.log(`Server is running on port => ${port}!`)
  )
  router.initializeIo(httpServer)
}
export default bootstrap
