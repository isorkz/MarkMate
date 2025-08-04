import express from 'express'
import cors from 'cors'
import path from 'path'
import { config } from './config/environment'
import { errorHandler } from './middleware/errorHandler'
import { tokenAuth } from './middleware/auth'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files (React frontend)
// In development (ts-node): __dirname = /Users/.../web-server/src
// In production (compiled): __dirname = /Users/.../web-server/dist/backend/web-server/src
const isDevelopment = !__dirname.includes('/dist/backend/')
const frontendPath = isDevelopment
  ? path.join(__dirname, '../dist/frontend')  // Development
  : path.join(__dirname, '../../../frontend')  // Production
app.use(express.static(frontendPath))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', workspace: config.workspacePath })
})

// API routes
import fileRoutes from './routes/file'
import gitRoutes from './routes/git'
import workspaceRoutes from './routes/workspace'

// Apply authentication to all API routes
app.use('/api', tokenAuth)
app.use('/api/file', fileRoutes)
app.use('/api/git', gitRoutes)
app.use('/api/workspace', workspaceRoutes)

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(config.port, () => {
  console.log(`MarkMate Web Server running on port ${config.port}`)
  console.log(`Workspace: ${config.workspacePath}`)
})

export default app