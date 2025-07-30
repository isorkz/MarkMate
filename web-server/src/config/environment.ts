import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  workspacePath: process.env.WORKSPACE_PATH || ''
}

// Validate required environment variables
if (!config.workspacePath) {
  console.error('ERROR: WORKSPACE_PATH environment variable is required')
  process.exit(1)
}

// Ensure workspace path is absolute
if (!path.isAbsolute(config.workspacePath)) {
  console.error('ERROR: WORKSPACE_PATH must be an absolute path')
  process.exit(1)
}