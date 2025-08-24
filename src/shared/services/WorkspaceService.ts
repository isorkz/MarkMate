import * as fs from 'fs/promises'
import * as path from 'path'
import { FileNode } from '../types/file'

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
        
        const stats = await fs.stat(itemPath)
        
        if (item.isDirectory()) {
          const childNodes = await buildFileTree(itemPath, itemRelativePath)
          children.push({
            id: itemRelativePath,
            name: item.name,
            path: itemRelativePath,
            type: 'folder',
            children: childNodes,
            lastModified: stats.mtime
          })
        } else if (item.name.endsWith('.md')) {
          children.push({
            id: itemRelativePath,
            name: item.name.replace(/\.md$/, ''), // Remove .md extension for display
            path: itemRelativePath,
            type: 'file',
            lastModified: stats.mtime
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

  // Get image files from specified image directory
  static async getImages(workspacePath: string, imagesDir: string): Promise<FileNode[]> {
    const imagesPath = path.join(workspacePath, imagesDir)
      
      // Check if image directory exists
      try {
        await fs.access(imagesPath)
      } catch (error) {
        // Directory doesn't exist, return empty array
        return []
      }
      
      const items = await fs.readdir(imagesPath, { withFileTypes: true })
      const imageFiles: FileNode[] = []
      
      // Define supported image extensions
      const imageExtensions = ['.png', '.jpg', '.jpeg']
      
      for (const item of items) {
        // Only process files (no subdirectories)
        if (item.isFile()) {
          const extension = path.extname(item.name).toLowerCase()
          
          // Check if it's an image file
          if (imageExtensions.includes(extension)) {
            const itemPath = path.join(imagesPath, item.name)
            const stats = await fs.stat(itemPath)
            
            imageFiles.push({
              id: `${imagesDir}/${item.name}`,
              name: item.name,
              path: `${imagesDir}/${item.name}`,
              type: 'file',
              lastModified: stats.mtime
            })
          }
        }
      }
      
      // Sort by name
      return imageFiles.sort((a, b) => a.name.localeCompare(b.name))
  }
}