import * as fs from 'fs/promises'
import * as path from 'path'
import * as chokidar from 'chokidar'
import { isImagePathResolved } from '../commonUtils'
import { FileContentWithDate } from '../types/file'

export interface FileWatchEvent {
  type: 'change' | 'add' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  stats?: any
}

export type FileWatchCallback = (event: FileWatchEvent) => void

export class FileService {
  private static watchers = new Map<string, chokidar.FSWatcher>()
  private static callbacks = new Map<string, Set<FileWatchCallback>>()
  // Read file content with last modified time
  static async readFile(workspacePath: string, filePath: string): Promise<FileContentWithDate> {
    const fullPath = path.join(workspacePath, filePath)
    const [content, stats] = await Promise.all([
      fs.readFile(fullPath, 'utf-8'),
      fs.stat(fullPath)
    ])
    return {
      content,
      lastModified: stats.mtime
    }
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

  // Get resolved image URL
  // imagePath: the image path in markdown content (e.g. ../../.images/image.png)
  // asDataUrl: true - return as data URL (base64 encoded), false - return as file:// URL
  static async getImageUrl(imagePath: string, workspacePath: string, currentFilePath: string, asDataUrl = false): Promise<string> {
    // If it's already an absolute path, base64, or URL, return as is
    if (isImagePathResolved(imagePath)) {
      return imagePath
    }

    const currentFileAbsolutePath = path.join(workspacePath, currentFilePath)
    const currentFileDir = path.dirname(currentFileAbsolutePath)
    const absolutePath = path.resolve(currentFileDir, imagePath)

    if (!asDataUrl) {
      // Return as file:// URL
      return `file://${absolutePath}`
    }
    
    // Return as data URL (base64 encoded)
    if (!absolutePath.startsWith(workspacePath)) {
      throw new Error('Access denied: Path outside workspace')
    }
    
    // Read the image file
    const imageBuffer = await fs.readFile(absolutePath)
    
    // Determine content type based on file extension
    const ext = path.extname(absolutePath).toLowerCase()
    const contentTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon'
    }
    
    const mimeType = contentTypes[ext] || 'application/octet-stream'
    
    // Convert to data URL for web version
    const base64Data = imageBuffer.toString('base64')
    return `data:${mimeType};base64,${base64Data}`
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

  // File watching methods
  static watchWorkspace(workspacePath: string, callback: FileWatchCallback): void {
    const absolutePath = path.resolve(workspacePath)
    
    // Add callback to the set for this workspace
    if (!this.callbacks.has(absolutePath)) {
      this.callbacks.set(absolutePath, new Set())
    }
    this.callbacks.get(absolutePath)!.add(callback)

    // If watcher already exists for this workspace, don't create a new one
    if (this.watchers.has(absolutePath)) {
      return
    }

    const watcher = chokidar.watch(absolutePath, {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        '**/node_modules/**',
        '**/.git/**',
        '**/.DS_Store',
        '**/Thumbs.db'
      ],
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: 50
    })

    const notifyCallbacks = (event: FileWatchEvent) => {
      const callbacks = this.callbacks.get(absolutePath)
      if (callbacks) {
        callbacks.forEach(cb => {
          try {
            cb(event)
          } catch (error) {
            console.error('Error in file watch callback:', error)
          }
        })
      }
    }

    watcher
      .on('change', (filePath, stats) => {
        notifyCallbacks({
          type: 'change',
          path: path.relative(absolutePath, filePath),
          stats
        })
      })
      .on('add', (filePath, stats) => {
        notifyCallbacks({
          type: 'add',
          path: path.relative(absolutePath, filePath),
          stats
        })
      })
      .on('unlink', (filePath) => {
        notifyCallbacks({
          type: 'unlink',
          path: path.relative(absolutePath, filePath)
        })
      })
      .on('addDir', (dirPath, stats) => {
        notifyCallbacks({
          type: 'addDir',
          path: path.relative(absolutePath, dirPath),
          stats
        })
      })
      .on('unlinkDir', (dirPath) => {
        notifyCallbacks({
          type: 'unlinkDir',
          path: path.relative(absolutePath, dirPath)
        })
      })
      .on('error', (error) => {
        console.error('File watcher error:', error)
      })

    this.watchers.set(absolutePath, watcher)
  }

  static unwatchWorkspace(workspacePath: string, callback?: FileWatchCallback): void {
    const absolutePath = path.resolve(workspacePath)
    
    if (callback) {
      // Remove specific callback
      const callbacks = this.callbacks.get(absolutePath)
      if (callbacks) {
        callbacks.delete(callback)
        
        // If no more callbacks, close the watcher
        if (callbacks.size === 0) {
          this.callbacks.delete(absolutePath)
          const watcher = this.watchers.get(absolutePath)
          if (watcher) {
            watcher.close()
            this.watchers.delete(absolutePath)
          }
        }
      }
    } else {
      // Remove all callbacks and close watcher
      this.callbacks.delete(absolutePath)
      const watcher = this.watchers.get(absolutePath)
      if (watcher) {
        watcher.close()
        this.watchers.delete(absolutePath)
      }
    }
  }

  static unwatchAll(): void {
    this.watchers.forEach(watcher => watcher.close())
    this.watchers.clear()
    this.callbacks.clear()
  }

  static isWatching(workspacePath: string): boolean {
    const absolutePath = path.resolve(workspacePath)
    return this.watchers.has(absolutePath)
  }
}