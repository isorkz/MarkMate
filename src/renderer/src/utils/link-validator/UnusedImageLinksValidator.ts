import { adapters } from "@renderer/adapters"
import { getAllMarkdownFiles } from "../fileOperations"

export interface UnusedImage {
  fileName: string
  filePath: string
  lastModified?: Date
  imageUrl?: string
}

/**
 * Utility for finding unused images in the .images directory
 * This validator specifically looks for image files that exist in .images/, but are not referenced by any markdown files
 */
export class UnusedImageLinksValidator {
  /**
   * Find all unused images in the .images directory
   * @param workspacePath - Workspace root path
   * @returns Array of unused image files
   */
  static async findUnusedImages(workspacePath: string): Promise<UnusedImage[]> {
    try {
      const imagesDir = '.images'
      
      // Get all image files from .images directory
      const allImages = await this.getImagesFromDirectory(workspacePath, imagesDir)
      if (allImages.length === 0) {
        return []
      }
      
      // Get all markdown files
      const fileTree = await adapters.workspaceAdapter.getFileTree(workspacePath)
      const allMarkdownFiles = getAllMarkdownFiles(fileTree)
      
      // Get all image references from markdown files
      const usedImages = new Set<string>()
      
      // Process files in batches to avoid overwhelming the system
      const BATCH_SIZE = 5
      for (let i = 0; i < allMarkdownFiles.length; i += BATCH_SIZE) {
        const batch = allMarkdownFiles.slice(i, i + BATCH_SIZE)
        
        const batchPromises = batch.map(async (file) => {
          return this.getImageReferencesFromFile(workspacePath, file.path)
        })
        
        const batchResults = await Promise.all(batchPromises)
        batchResults.flat().forEach(imagePath => {
          // Normalize the path and add to used images set
          const normalizedPath = this.normalizeToImageFileName(imagePath, imagesDir)
          if (normalizedPath) {
            usedImages.add(normalizedPath)
          }
        })
      }
      
      // Find unused images
      const unusedImages = allImages.filter(image => !usedImages.has(image.fileName))
      
      // Get image URLs for preview
      for (const image of unusedImages) {
        try {
          image.imageUrl = await adapters.fileAdapter.getImageUrl(
            image.filePath, 
            workspacePath, 
            'placeholder.md' // Use a placeholder file for correct path resolution
          )
        } catch (error) {
          console.error(`Failed to get image URL for ${image.filePath}:`, error)
          throw error
        }
      }
      
      return unusedImages
    } catch (error) {
      console.error('Failed to find unused images:', error)
      throw error
    }
  }
  
  /**
   * Get all image files from .images directory
   */
  private static async getImagesFromDirectory(workspacePath: string, imagesDir: string): Promise<UnusedImage[]> {
    try {
      // Use the new workspace adapter method to get images
      const imageFiles = await adapters.workspaceAdapter.getImages(workspacePath, imagesDir)
      
      return imageFiles.map(file => {
        const { name, path, lastModified } = file
        return {
          fileName: name,
          filePath: path,
          lastModified: lastModified ? new Date(lastModified) : undefined
        }
      })
    } catch (error) {
      console.error(`Failed to get images from directory ${imagesDir}:`, error)
      throw error
    }
  }
  
  /**
   * Get all image references from a markdown file
   * Returns the original image paths as they appear in the markdown
   */
  private static async getImageReferencesFromFile(workspacePath: string, filePath: string): Promise<string[]> {
    try {
      // Read file content
      const fileData = await adapters.fileAdapter.readFile(workspacePath, filePath)
      const content = fileData.content
      
      const imageReferences: string[] = []
      
      // Find markdown image links: ![alt](src)
      const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
      let match: RegExpExecArray | null
      
      while ((match = markdownImageRegex.exec(content)) !== null) {
        const imageSrc = match[2].trim()
        
        // Skip external URLs and data URLs, but keep local paths
        if (this.shouldSkipImageSrc(imageSrc)) {
          continue
        }
        
        imageReferences.push(imageSrc)
      }
      
      // Find HTML image links: <img src="...">
      const htmlImageRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi
      
      while ((match = htmlImageRegex.exec(content)) !== null) {
        const imageSrc = match[1].trim()
        
        // Skip external URLs and data URLs, but keep local paths
        if (this.shouldSkipImageSrc(imageSrc)) {
          continue
        }
        
        imageReferences.push(imageSrc)
      }
      
      return imageReferences
    } catch (error) {
      console.error(`Failed to get image references from ${filePath}:`, error)
      throw error
    }
  }
  
  /**
   * Check if image source should be skipped (external URLs, data URLs)
   */
  private static shouldSkipImageSrc(imageSrc: string): boolean {
    return imageSrc.startsWith('http://') || 
           imageSrc.startsWith('https://') || 
           imageSrc.startsWith('data:')
  }
  
  /**
   * Normalize image path to extract filename if it points to .images directory
   * Convert paths like ".images/image.png" or "../../.images/image.png" to just "image.png"
   */
  private static normalizeToImageFileName(imagePath: string, imagesDir: string): string | null {
    // Find the last occurrence of .images/ in the path
    const imagesIndex = imagePath.lastIndexOf(`${imagesDir}/`)
    if (imagesIndex !== -1) {
      const fileName = imagePath.substring(imagesIndex + imagesDir.length + 1)
      // Make sure it's just a filename, not a path with subdirectories
      if (!fileName.includes('/') && fileName.length > 0) {
        return fileName
      }
    }
    
    return null
  }
  
  /**
   * Delete multiple unused images
   * @param workspacePath - Workspace root path
   * @param imageFileNames - Array of image file names to delete
   * @returns Number of successfully deleted files
   */
  static async deleteUnusedImages(workspacePath: string, imageFileNames: string[]): Promise<number> {
    let deletedCount = 0
    
    for (const fileName of imageFileNames) {
      try {
        const filePath = `.images/${fileName}`
        await adapters.fileAdapter.deleteFile(workspacePath, filePath)
        deletedCount++
      } catch (error) {
        console.error(`Failed to delete image ${fileName}:`, error)
      }
    }
    
    return deletedCount
  }
}