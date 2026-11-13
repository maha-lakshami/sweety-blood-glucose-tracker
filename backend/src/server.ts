
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import readingRoutes from './routes/readingRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Sweety API is running!'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/readings', readingRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`Sweety API running at http://localhost:${PORT}`)
})
