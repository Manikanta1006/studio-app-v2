import dotenv from 'dotenv'
import { rootEnvPath } from './paths.js'

dotenv.config({ path: rootEnvPath })
dotenv.config()

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dental-studio',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
}
