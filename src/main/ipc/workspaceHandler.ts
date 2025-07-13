import { ipcMain, dialog } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

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
      lastAccessed: new Date(),
      settings: {
        autoSave: true,
        autoSaveDelay: 2000,
        gitAutoCommit: false
      }
    }
  })
  
  // Get workspace file tree
  ipcMain.handle('workspace:get-file-tree', async (_, workspacePath: string) => {
    try {
      const buildFileTree = async (dirPath: string, relativePath = ''): Promise<any> => {
        const items = await fs.readdir(dirPath, { withFileTypes: true })
        const children: any[] = []
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name)
          const itemRelativePath = path.join(relativePath, item.name)
          
          // Skip hidden files and node_modules
          if (item.name.startsWith('.')) {
            continue
          }
          
          // const stats = await fs.stat(itemPath)
          
          if (item.isDirectory()) {
            const childNodes = await buildFileTree(itemPath, itemRelativePath)
            children.push({
              id: itemRelativePath,
              name: item.name,
              path: itemRelativePath,
              type: 'folder',
              children: childNodes,
              // lastModified: stats.mtime,
              isExpanded: false
            })
          } else if (item.name.endsWith('.md')) {
            children.push({
              id: itemRelativePath,
              name: item.name,
              path: itemRelativePath,
              type: 'file',
              // lastModified: stats.mtime,
            })
          }
        }
        
        // Sort: folders first, then files, both alphabetically
        return children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })
      }
      
      return await buildFileTree(workspacePath)
    } catch (error) {
      console.error('Error reading workspace directory:', error)
      throw error
    }
  })
}