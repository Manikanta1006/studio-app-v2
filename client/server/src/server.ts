import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import casesRouter from './routes/cases.js'
import remoteModelRouter from './routes/remoteModel.js'
import stepsRouter from './routes/steps.js'
import uploadRouter from './routes/upload.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'
import { uploadsDir } from './config/paths.js'

const app = express()

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (_request, response) => {
  response.json({ success: true, message: 'Dental Studio API is running' })
})

app.use('/api/cases', casesRouter)
app.use('/api/remote-model', remoteModelRouter)
app.use('/api/steps', stepsRouter)
app.use('/api/upload', uploadRouter)

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error)
  response.status(500).json({ success: false, error: error.message || 'Internal server error' })
})

async function startServer() {
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`)
  })

  try {
    await connectDatabase()
    console.log('Database connected')
  } catch (error) {
    console.error('Database connection failed, continuing without database:', error)
  }
}

startServer().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
