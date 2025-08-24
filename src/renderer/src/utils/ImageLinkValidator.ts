import { adapters } from '../adapters'
import { getAllMarkdownFiles } from './fileOperations'

export interface BrokenImageLink {
  filePath: string
  imageSrc: string
  resolvedPath: string
  lineNumber?: number
  linkType: 'markdown' | 'html'
}

export interface ImageLinkValidationResult {
  filePath: string
  brokenImages: BrokenImageLink[]
}

/**
 * Utility for validating image links in markdown files
 */
export class ImageLinkValidator {
  /**
   * Check all markdown files for broken image links
   * @param workspacePath - Workspace root path
   * @returns Array of files with broken image links
   */
  static async validateAllImageLinks(workspacePath: string): Promise<ImageLinkValidationResult[]> {
    try {
      // Get all markdown files
      const fileTree = await adapters.workspaceAdapter.getFileTree(workspacePath)
      const allMarkdownFiles = getAllMarkdownFiles(fileTree)
      
      const results: ImageLinkValidationResult[] = []
      
      // Process files in batches to avoid overwhelming the system
      const BATCH_SIZE = 5
      for (let i = 0; i < allMarkdownFiles.length; i += BATCH_SIZE) {
        const batch = allMarkdownFiles.slice(i, i + BATCH_SIZE)
        
        const batchPromises = batch.map(async (file) => {
          const brokenImages = await this.validateImageLinksInFile(workspacePath, file.path)
          return brokenImages.length > 0 ? { filePath: file.path, brokenImages } : null
        })
        
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults.filter(result => result !== null))
      }
      
      return results
    } catch (error) {
      console.error('Failed to validate image links:', error)
      throw error
    }
  }
  
  /**
   * Check image links in a specific file
   * @param workspacePath - Workspace root path  
   * @param filePath - File path to check
   * @returns Array of broken image links in the file
   */
  static async validateImageLinksInFile(workspacePath: string, filePath: string): Promise<BrokenImageLink[]> {
    try {
      // Read file content
      const fileData = await adapters.fileAdapter.readFile(workspacePath, filePath)
      const content = fileData.content
      
      const brokenImages: BrokenImageLink[] = []
      
      // Define image patterns to check
      const imagePatterns = [
        {
          regex: /!\[([^\]]*)\]\(([^)]+)\)/g,
          srcIndex: 2,
          linkType: 'markdown' as const
        },
        {
          regex: /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi,
          srcIndex: 1,
          linkType: 'html' as const
        }
      ]
      
      // Process each pattern
      for (const pattern of imagePatterns) {
        let match: RegExpExecArray | null
        
        while ((match = pattern.regex.exec(content)) !== null) {
          const imageSrc = match[pattern.srcIndex].trim()
          const matchIndex = match.index
          
          // Skip external URLs and data URLs
          if (this.shouldSkipImageSrc(imageSrc)) {
            continue
          }
          
          const brokenImage = await this.checkImageLink(
            workspacePath,
            filePath,
            imageSrc,
            matchIndex,
            content,
            pattern.linkType
          )
          
          if (brokenImage) {
            brokenImages.push(brokenImage)
          }
        }
      }
      
      return brokenImages
    } catch (error) {
      console.error(`Failed to validate image links in ${filePath}:`, error)
      return []
    }
  }
  
  /**
   * Check if image source should be skipped
   */
  private static shouldSkipImageSrc(imageSrc: string): boolean {
    return imageSrc.startsWith('http://') || 
           imageSrc.startsWith('https://') || 
           imageSrc.startsWith('data:')
  }
  
  /**
   * Check a single image link and return broken image info if invalid
   */
  private static async checkImageLink(
    workspacePath: string,
    filePath: string,
    imageSrc: string,
    matchIndex: number,
    content: string,
    linkType: 'markdown' | 'html'
  ): Promise<BrokenImageLink | null> {
    try {
      // Resolve the image path to workspace-relative path
      const resolvedPath = await adapters.fileAdapter.resolveRelativePath(
        workspacePath,
        filePath,
        imageSrc
      )
      
      // Check if image file exists
      const imageExists = await adapters.fileAdapter.isFileExists(workspacePath, resolvedPath)
      
      if (!imageExists) {
        // Find line number for better user experience
        const lineNumber = this.getLineNumber(content, matchIndex)
        
        return {
          filePath,
          imageSrc,
          resolvedPath,
          lineNumber,
          linkType
        }
      }
      
      return null
    } catch (error) {
      // Resolution failed - definitely a broken link
      const lineNumber = this.getLineNumber(content, matchIndex)
      
      return {
        filePath,
        imageSrc,
        resolvedPath: 'Unable to resolve',
        lineNumber,
        linkType
      }
    }
  }
  
  
  /**
   * Get line number for a character position in content
   */
  private static getLineNumber(content: string, charIndex: number): number {
    const beforeMatch = content.substring(0, charIndex)
    return beforeMatch.split('\n').length
  }
}