import { ipcMain, BrowserWindow } from 'electron'
import { FileService, FileWatchEvent } from '../../shared/services/FileService'

export function setupFileHandlers() {
  // Read file content
  ipcMain.handle('file:read', async (_, workspacePath: string, filePath: string) => {
    try {
      return await FileService.readFile(workspacePath, filePath)
    } catch (error) {
      console.error('Error reading file:', error)
      throw error
    }
  })

  // Get file last modified time
  ipcMain.handle('file:get-last-modified-time', async (_, workspacePath: string, filePath: string) => {
    try {
      return await FileService.getLastModifiedTime(workspacePath, filePath)
    } catch (error) {
      console.error('Error getting file last modified time:', error)
      throw error
    }
  })
  
  // Write file content
  ipcMain.handle('file:write', async (_, workspacePath: string, filePath: string, content: string) => {
    try {
      await FileService.writeFile(workspacePath, filePath, content)
      return true
    } catch (error) {
      console.error('Error writing file:', error)
      throw error
    }
  })
  
  // Create new file
  ipcMain.handle('file:create', async (_, workspacePath: string, filePath: string, content = '') => {
    try {
      await FileService.createFile(workspacePath, filePath, content)
      return true
    } catch (error) {
      console.error('Error creating file:', error)
      throw error
    }
  })
  
  // Delete file or folder
  ipcMain.handle('file:delete', async (_, workspacePath: string, filePath: string) => {
    try {
      await FileService.deleteFile(workspacePath, filePath)
      return true
    } catch (error) {
      console.error('Error deleting file/folder:', error)
      throw error
    }
  })
  
  // Rename/move file
  ipcMain.handle('file:rename', async (_, workspacePath: string, oldPath: string, newPath: string) => {
    try {
      await FileService.renameFile(workspacePath, oldPath, newPath)
      return true
    } catch (error) {
      console.error('Error renaming file:', error)
      throw error
    }
  })
  
  // Create directory
  ipcMain.handle('file:create-directory', async (_, workspacePath: string, dirPath: string) => {
    try {
      await FileService.createDirectory(workspacePath, dirPath)
      return true
    } catch (error) {
      console.error('Error creating directory:', error)
      throw error
    }
  })

  // Get resolved image URL
  ipcMain.handle('file:get-image-url', async (_, imagePath: string, workspacePath: string, currentFilePath: string) => {
    try {
      return await FileService.getImageUrl(imagePath, workspacePath, currentFilePath)
    } catch (error) {
      console.error('Error resolving image URL:', error)
      throw error
    }
  })

  // Save image data to local file and return relative path
  ipcMain.handle('file:save-image', async (_, imageData: string, workspacePath: string, currentFilePath: string, extension = 'png') => {
    try {
      return await FileService.saveImage(imageData, workspacePath, currentFilePath, extension)
    } catch (error) {
      console.error('Error saving image:', error)
      throw error
    }
  })

  // Calculate relative path from current file to target file
  ipcMain.handle('file:get-relative-path', async (_, workspacePath: string, currentFilePath: string, targetFilePath: string) => {
    try {
      return await FileService.getRelativePath(workspacePath, currentFilePath, targetFilePath)
    } catch (error) {
      console.error('Error calculating relative path:', error)
      throw error
    }
  })

  // Resolve file path relative to current file
  ipcMain.handle('file:resolve-relative-path', async (_, workspacePath: string, currentFilePath: string, relativeFilePath: string) => {
    try {
      return await FileService.resolveRelativePath(workspacePath, currentFilePath, relativeFilePath)
    } catch (error) {
      console.error('Error resolving relative path:', error)
      throw error
    }
  })

  // File watching handlers
  ipcMain.handle('file:watch-workspace', async (_, workspacePath: string) => {
    try {
      const callback = (event: FileWatchEvent) => {
        // Send file change event to all renderer processes
        BrowserWindow.getAllWindows().forEach(window => {
          window.webContents.send('file:external-change', {
            workspacePath,
            ...event
          })
        })
      }

      FileService.watchWorkspace(workspacePath, callback)
      return true
    } catch (error) {
      console.error('Error watching workspace:', error)
      throw error
    }
  })

  ipcMain.handle('file:unwatch-workspace', async (_, workspacePath: string) => {
    try {
      FileService.unwatchWorkspace(workspacePath)
      return true
    } catch (error) {
      console.error('Error unwatching workspace:', error)
      throw error
    }
  })

  ipcMain.handle('file:is-watching', async (_, workspacePath: string) => {
    try {
      return FileService.isWatching(workspacePath)
    } catch (error) {
      console.error('Error checking watch status:', error)
      throw error
    }
  })

  // Cleanup watchers when app quits
  ipcMain.on('app:before-quit', () => {
    FileService.unwatchAll()
  })
}