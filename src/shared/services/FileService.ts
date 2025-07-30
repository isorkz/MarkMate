import * as fs from 'fs/promises'
import * as path from 'path'
import { isImagePathResolved } from '../commonUtils'

export class FileService {
  // Read file content
  static async readFile(workspacePath: string, filePath: string): Promise<string> {
    const fullPath = path.join(workspacePath, filePath)
    return await fs.readFile(fullPath, 'utf-8')
  }

  // Get file last modified time
  static async getLastModifiedTime(workspacePath: string, filePath: string): Promise<Date> {
    const fullPath = path.join(workspacePath, filePath)
    const stats = await fs.stat(fullPath)
    return stats.mtime
  }

  // Write file content
  static async writeFile(workspacePath: string, filePath: string, content: string): Promise<void> {
    const fullPath = path.join(workspacePath, filePath)
    
    // Ensure directory exists
    const dir = path.dirname(fullPath)
    await fs.mkdir(dir, { recursive: true })
    
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  // Create new file
  static async createFile(workspacePath: string, filePath: string, content = ''): Promise<void> {
    const fullPath = path.join(workspacePath, filePath)
    
    // Check if file already exists
    try {
      await fs.access(fullPath)
      throw new Error('File already exists')
    } catch (error) {
      // File doesn't exist, we can create it
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
        throw error
      }
    }
    
    // Ensure directory exists
    const dir = path.dirname(fullPath)
    await fs.mkdir(dir, { recursive: true })
    
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  // Delete file or folder
  static async deleteFile(workspacePath: string, filePath: string): Promise<void> {
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
  }

  // Rename/move file
  static async renameFile(workspacePath: string, oldPath: string, newPath: string): Promise<void> {
    const oldFullPath = path.join(workspacePath, oldPath)
    const newFullPath = path.join(workspacePath, newPath)
    
    // Ensure target directory exists
    const dir = path.dirname(newFullPath)
    await fs.mkdir(dir, { recursive: true })
    
    await fs.rename(oldFullPath, newFullPath)
  }

  // Create directory
  static async createDirectory(workspacePath: string, dirPath: string): Promise<void> {
    const fullPath = path.join(workspacePath, dirPath)
    await fs.mkdir(fullPath, { recursive: true })
  }

  // Get resolved image path relative to workspace and file
  static async getImagePath(src: string, workspacePath: string, currentFilePath: string): Promise<string> {
    // If it's already an absolute path, base64, or URL, return as is
    if (isImagePathResolved(src)) {
      return src
    }

    // Resolve relative path to get absolute path
    const currentFileAbsolutePath = path.join(workspacePath, currentFilePath)
    const currentFileDir = path.dirname(currentFileAbsolutePath)
    const absolutePath = path.resolve(currentFileDir, src)
    return `file://${absolutePath}`
  }

  // Save image data to local file and return relative path
  static async saveImage(
    imageData: string, 
    workspacePath: string, 
    currentFilePath: string, 
    extension = 'png'
  ): Promise<string> {
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
  }

  // Calculate relative path from current file to target file
  // For example:
  // currentFilePath: 'src/components/current.md'
  // targetFilePath: 'src/target.md'
  // returns: '../target.md'
  static async getRelativePath(
    workspacePath: string, 
    currentFilePath: string, 
    targetFilePath: string
  ): Promise<string> {
    // Get absolute paths for both files within the workspace
    const currentFileAbsolutePath = path.join(workspacePath, currentFilePath)
    const targetFileAbsolutePath = path.join(workspacePath, targetFilePath)
    
    // Get the directory of the current file
    const currentFileDir = path.dirname(currentFileAbsolutePath)
    
    // Calculate relative path from current file's directory to target file
    const relativePath = path.relative(currentFileDir, targetFileAbsolutePath)
    
    // Normalize path separators for cross-platform compatibility
    return relativePath.replace(/\\/g, '/')
  }

  // Resolve file path relative to current file
  // For example:
  // currentFilePath: 'src/components/current.md'
  // relativeFilePath: '../target.md'
  // returns: 'src/target.md'
  static async resolveRelativePath(
    workspacePath: string, 
    currentFilePath: string, 
    relativeFilePath: string
  ): Promise<string> {
    // Get the directory of the current file
    const currentFileAbsolutePath = path.join(workspacePath, currentFilePath)
    const currentFileDir = path.dirname(currentFileAbsolutePath)
    
    // Resolve the relative path to get absolute path
    const resolvedAbsolutePath = path.resolve(currentFileDir, relativeFilePath)
    
    // Calculate the path relative to workspace
    const workspaceRelativePath = path.relative(workspacePath, resolvedAbsolutePath)
    
    // Normalize path separators for cross-platform compatibility
    return workspaceRelativePath.replace(/\\/g, '/')
  }
}