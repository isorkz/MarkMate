import { ipcMain } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
import { isImagePathResolved } from '../../shared/commonUtils'

export function setupFileHandlers() {
  // Read file content
  ipcMain.handle('file:read', async (_, workspacePath: string, filePath: string) => {
    try {
      const fullPath = path.join(workspacePath, filePath)
      const content = await fs.readFile(fullPath, 'utf-8')
      return content
    } catch (error) {
      console.error('Error reading file:', error)
      throw error
    }
  })
  
  // Write file content
  ipcMain.handle('file:write', async (_, workspacePath: string, filePath: string, content: string) => {
    try {
      const fullPath = path.join(workspacePath, filePath)
      
      // Ensure directory exists
      const dir = path.dirname(fullPath)
      await fs.mkdir(dir, { recursive: true })
      
      await fs.writeFile(fullPath, content, 'utf-8')
      return true
    } catch (error) {
      console.error('Error writing file:', error)
      throw error
    }
  })
  
  // Create new file
  ipcMain.handle('file:create', async (_, workspacePath: string, filePath: string, content = '') => {
    try {
      const fullPath = path.join(workspacePath, filePath)
      
      // Check if file already exists
      try {
        await fs.access(fullPath)
        throw new Error('File already exists')
      } catch (error) {
        // File doesn't exist, we can create it
        if (error.code !== 'ENOENT') {
          throw error
        }
      }
      
      // Ensure directory exists
      const dir = path.dirname(fullPath)
      await fs.mkdir(dir, { recursive: true })
      
      await fs.writeFile(fullPath, content, 'utf-8')
      return true
    } catch (error) {
      console.error('Error creating file:', error)
      throw error
    }
  })
  
  // Delete file or folder
  ipcMain.handle('file:delete', async (_, workspacePath: string, filePath: string) => {
    try {
      const fullPath = path.join(workspacePath, filePath)
      
      // Check if it's a file or directory
      const stats = await fs.stat(fullPath)
      
      if (stats.isDirectory()) {
        // Delete directory and all its contents
        await fs.rm(fullPath, { recursive: true, force: true })
      } else {
        // Delete file
        await fs.unlink(fullPath)
      }
      
      return true
    } catch (error) {
      console.error('Error deleting file/folder:', error)
      throw error
    }
  })
  
  // Rename/move file
  ipcMain.handle('file:rename', async (_, workspacePath: string, oldPath: string, newPath: string) => {
    try {
      const oldFullPath = path.join(workspacePath, oldPath)
      const newFullPath = path.join(workspacePath, newPath)
      
      // Ensure target directory exists
      const dir = path.dirname(newFullPath)
      await fs.mkdir(dir, { recursive: true })
      
      await fs.rename(oldFullPath, newFullPath)
      return true
    } catch (error) {
      console.error('Error renaming file:', error)
      throw error
    }
  })
  
  // Create directory
  ipcMain.handle('file:create-directory', async (_, workspacePath: string, dirPath: string) => {
    try {
      const fullPath = path.join(workspacePath, dirPath)
      await fs.mkdir(fullPath, { recursive: true })
      return true
    } catch (error) {
      console.error('Error creating directory:', error)
      throw error
    }
  })

  // Get resolved image path relative to workspace and file
  ipcMain.handle('file:get-image-path', async (_, src: string, workspacePath: string, currentFilePath: string) => {
    try {
      // If it's already an absolute path, base64, or URL, return as is
      if (isImagePathResolved(src)) {
        return src
      }

      // Resolve relative path to get absolute path
      const currentFileAbsolutePath = path.join(workspacePath, currentFilePath)
      const currentFileDir = path.dirname(currentFileAbsolutePath)
      const absolutePath = path.resolve(currentFileDir, src)
      return `file://${absolutePath}`
    } catch (error) {
      console.error('Error resolving image path:', error)
      throw error
    }
  })

  // Save image data to local file and return relative path
  ipcMain.handle('file:save-image', async (_, imageData: string, workspacePath: string, currentFilePath: string, extension = 'png') => {
    try {
      // Create images directory in workspace root
      const imagesDir = path.join(workspacePath, '.images')

      // Ensure images directory exists
      await fs.mkdir(imagesDir, { recursive: true })

      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `pasted-image-${timestamp}.${extension}`
      const imagePath = path.join(imagesDir, filename)

      // Remove data URL prefix and decode base64
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // Write image file
      await fs.writeFile(imagePath, buffer)

      // Return relative path from current file to the image
      const relativePath = path.relative(path.dirname(path.join(workspacePath, currentFilePath)), imagePath)
      return relativePath.replace(/\\/g, '/') // Normalize path separators
    } catch (error) {
      console.error('Error saving image:', error)
      throw error
    }
  })
}