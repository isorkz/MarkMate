import express from 'express'
import { WorkspaceService } from '../../../src/shared/services'
import { config } from '../config/environment'
import * as path from 'path'

const router = express.Router()

// Get workspace info (for web version, workspace is predefined)
router.get('/info', async (req, res, next) => {
  try {
    const workspaceName = path.basename(config.workspacePath)
    res.json({
      id: 'web-workspace',
      name: workspaceName,
      path: config.workspacePath,
      lastAccessed: new Date()
    })
  } catch (error) {
    next(error)
  }
})

// Get workspace file tree
router.get('/file-tree', async (req, res, next) => {
  try {
    const fileTree = await WorkspaceService.getFileTree(config.workspacePath)
    res.json(fileTree)
  } catch (error) {
    next(error)
  }
})

export default router