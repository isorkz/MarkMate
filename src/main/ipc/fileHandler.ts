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
  
  // Delete file
  ipcMain.handle('file:delete', async (_, workspacePath: string, filePath: string) => {
    try {
      const fullPath = path.join(workspacePath, filePath)
      await fs.unlink(fullPath)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
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
      return src
    }
  })
}