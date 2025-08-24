import { ipcMain, dialog } from 'electron'
import * as path from 'path'
import { WorkspaceService } from '../../shared/services'

export function setupWorkspaceHandlers() {
  // Open workspace folder dialog
  ipcMain.handle('workspace:open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Workspace Folder'
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    
    const workspacePath = result.filePaths[0]
    const workspaceName = path.basename(workspacePath)
    
    return {
      id: Date.now().toString(),
      name: workspaceName,
      path: workspacePath,
      lastAccessed: new Date()
    }
  })
  
  // Get workspace file tree
  ipcMain.handle('workspace:get-file-tree', async (_, workspacePath: string) => {
    try {
      return await WorkspaceService.getFileTree(workspacePath)
    } catch (error) {
      console.error('Error reading workspace directory:', error)
      throw error
    }
  })

  // Get images from specified directory
  ipcMain.handle('workspace:get-images', async (_, workspacePath: string, imagesDir: string) => {
    try {
      return await WorkspaceService.getImages(workspacePath, imagesDir)
    } catch (error) {
      console.error('Error reading images from directory:', error)
      throw error
    }
  })
}