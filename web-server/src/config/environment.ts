import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  workspacePath: process.env.MARKMATE_WEB_WORKSPACE_PATH || '',
  accessKey: process.env.MARKMATE_WEB_ACCESS_KEY || ''
}

// Validate required environment variables
if (!config.workspacePath) {
  console.error('ERROR: MARKMATE_WEB_WORKSPACE_PATH environment variable is required')
  process.exit(1)
}

if (!config.accessKey) {
  console.error('ERROR: MARKMATE_WEB_ACCESS_KEY environment variable is required')
  process.exit(1)
}

// Ensure workspace path is absolute
if (!path.isAbsolute(config.workspacePath)) {
  console.error('ERROR: MARKMATE_WEB_WORKSPACE_PATH must be an absolute path')
  process.exit(1)
}