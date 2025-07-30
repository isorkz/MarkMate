import express from 'express'
import { GitService } from '../../../src/shared/services'
import { config } from '../config/environment'

const router = express.Router()

// Configure Git
router.post('/config', async (req, res, next) => {
  try {
    const { gitUsername, gitEmail, gitRemoteUrl } = req.body
    await GitService.configGit(config.workspacePath, gitUsername, gitEmail, gitRemoteUrl)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Get file history
router.post('/history', async (req, res, next) => {
  try {
    const { filePath, limit = 20 } = req.body
    const history = await GitService.getFileHistory(config.workspacePath, filePath, limit)
    res.json(history)
  } catch (error) {
    next(error)
  }
})

// Get file content at specific commit
router.post('/get-file-commit', async (req, res, next) => {
  try {
    const { filePath, commitHash } = req.body
    const content = await GitService.getFileAtCommit(config.workspacePath, filePath, commitHash)
    res.json({ content })
  } catch (error) {
    next(error)
  }
})

// Get diff between two commits for a file
router.post('/get-file-commits-diff', async (req, res, next) => {
  try {
    const { filePath, fromCommit, toCommit } = req.body
    const diff = await GitService.getFileCommitsDiff(config.workspacePath, filePath, fromCommit, toCommit)
    res.json({ diff })
  } catch (error) {
    next(error)
  }
})

// Get working directory diff for a file
router.post('/get-uncommitted-diff', async (req, res, next) => {
  try {
    const { filePath } = req.body
    const diff = await GitService.getUncommittedDiff(config.workspacePath, filePath)
    res.json({ diff })
  } catch (error) {
    next(error)
  }
})

// Restore file to specific commit
router.post('/restore', async (req, res, next) => {
  try {
    const { filePath, commitHash } = req.body
    await GitService.restoreFile(config.workspacePath, filePath, commitHash)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Discard uncommitted changes for a specific file
router.post('/discard-changes', async (req, res, next) => {
  try {
    const { filePath } = req.body
    await GitService.discardChanges(config.workspacePath, filePath)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Sync workspace: pull + commit + push
router.post('/sync', async (req, res, next) => {
  try {
    const { commitMessage, remote = 'origin', branch = 'main' } = req.body
    await GitService.syncWorkspace(config.workspacePath, commitMessage, remote, branch)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Get Git status for a specific file
router.post('/check-local-status', async (req, res, next) => {
  try {
    const { filePath } = req.body
    const status = await GitService.checkLocalStatus(config.workspacePath, filePath)
    res.json(status)
  } catch (error) {
    next(error)
  }
})

// Check if local branch is ahead of remote
router.post('/check-remote-status', async (req, res, next) => {
  try {
    const { remote = 'origin', branch = 'main' } = req.body
    const status = await GitService.checkRemoteStatus(config.workspacePath, remote, branch)
    res.json(status)
  } catch (error) {
    next(error)
  }
})

export default router