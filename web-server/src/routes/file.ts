import express from 'express'
import { FileService } from '../../../src/shared/services'
import { config } from '../config/environment'

const router = express.Router()

// Read file content
router.post('/read', async (req, res, next) => {
  try {
    const { filePath } = req.body
    const content = await FileService.readFile(config.workspacePath, filePath)
    res.json({ content })
  } catch (error) {
    next(error)
  }
})

// Get file last modified time
router.post('/get-last-modified-time', async (req, res, next) => {
  try {
    const { filePath } = req.body
    const lastModified = await FileService.getLastModifiedTime(config.workspacePath, filePath)
    res.json({ lastModified })
  } catch (error) {
    next(error)
  }
})

// Write file content
router.post('/write', async (req, res, next) => {
  try {
    const { filePath, content } = req.body
    await FileService.writeFile(config.workspacePath, filePath, content)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Create new file
router.post('/create', async (req, res, next) => {
  try {
    const { filePath, content = '' } = req.body
    await FileService.createFile(config.workspacePath, filePath, content)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Delete file or folder
router.post('/delete', async (req, res, next) => {
  try {
    const { filePath } = req.body
    await FileService.deleteFile(config.workspacePath, filePath)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Rename/move file
router.post('/rename', async (req, res, next) => {
  try {
    const { oldPath, newPath } = req.body
    await FileService.renameFile(config.workspacePath, oldPath, newPath)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Create directory
router.post('/create-directory', async (req, res, next) => {
  try {
    const { dirPath } = req.body
    await FileService.createDirectory(config.workspacePath, dirPath)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Get resolved image path relative to workspace and file
router.post('/get-image-path', async (req, res, next) => {
  try {
    const { src, currentFilePath } = req.body
    const imagePath = await FileService.getImagePath(src, config.workspacePath, currentFilePath)
    res.json({ imagePath })
  } catch (error) {
    next(error)
  }
})

// Save image data to local file and return relative path
router.post('/save-image', async (req, res, next) => {
  try {
    const { imageData, currentFilePath, extension = 'png' } = req.body
    const relativePath = await FileService.saveImage(imageData, config.workspacePath, currentFilePath, extension)
    res.json({ relativePath })
  } catch (error) {
    next(error)
  }
})

// Calculate relative path from current file to target file
router.post('/get-relative-path', async (req, res, next) => {
  try {
    const { currentFilePath, targetFilePath } = req.body
    const relativePath = await FileService.getRelativePath(config.workspacePath, currentFilePath, targetFilePath)
    res.json({ relativePath })
  } catch (error) {
    next(error)
  }
})

// Resolve file path relative to current file
router.post('/resolve-relative-path', async (req, res, next) => {
  try {
    const { currentFilePath, relativeFilePath } = req.body
    const resolvedPath = await FileService.resolveRelativePath(config.workspacePath, currentFilePath, relativeFilePath)
    res.json({ resolvedPath })
  } catch (error) {
    next(error)
  }
})

export default router