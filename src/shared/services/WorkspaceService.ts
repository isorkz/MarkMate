import * as fs from 'fs/promises'
import * as path from 'path'

interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  isExpanded?: boolean
}

export class WorkspaceService {
  // Get workspace file tree
  static async getFileTree(workspacePath: string): Promise<FileNode[]> {
    const buildFileTree = async (dirPath: string, relativePath = ''): Promise<FileNode[]> => {
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      const children: FileNode[] = []
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name)
        const itemRelativePath = path.join(relativePath, item.name)
        
        // Skip hidden files and node_modules
        if (item.name.startsWith('.')) {
          continue
        }
        
        if (item.isDirectory()) {
          const childNodes = await buildFileTree(itemPath, itemRelativePath)
          children.push({
            id: itemRelativePath,
            name: item.name,
            path: itemRelativePath,
            type: 'folder',
            children: childNodes,
            isExpanded: false
          })
        } else if (item.name.endsWith('.md')) {
          children.push({
            id: itemRelativePath,
            name: item.name.replace(/\.md$/, ''), // Remove .md extension for display
            path: itemRelativePath,
            type: 'file',
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
  }
}