import { adapters } from "@renderer/adapters"
import { getAllMarkdownFiles } from "../fileOperations"

export interface BrokenPageLink {
  filePath: string
  linkText: string
  resolvedPath: string
  lineNumber?: number
}

export interface PageLinkValidationResult {
  filePath: string
  brokenLinks: BrokenPageLink[]
}

/**
 * Utility for validating broken page links in markdown files
 */
export class BrokenPageLinksValidator {
  /**
   * Check all markdown files for broken pagelinks
   * @param workspacePath - Workspace root path
   * @returns Array of files with broken pagelinks
   */
  static async validateAllPageLinks(workspacePath: string): Promise<PageLinkValidationResult[]> {
    try {
      // Get all markdown files
      const fileTree = await adapters.workspaceAdapter.getFileTree(workspacePath)
      const allMarkdownFiles = getAllMarkdownFiles(fileTree)
      
      const results: PageLinkValidationResult[] = []
      
      // Process files in batches to avoid overwhelming the system
      const BATCH_SIZE = 5
      for (let i = 0; i < allMarkdownFiles.length; i += BATCH_SIZE) {
        const batch = allMarkdownFiles.slice(i, i + BATCH_SIZE)
        
        const batchPromises = batch.map(async (file) => {
          const brokenLinks = await this.validatePageLinksInFile(workspacePath, file.path)
          return brokenLinks.length > 0 ? { filePath: file.path, brokenLinks } : null
        })
        
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults.filter(result => result !== null))
      }
      
      return results
    } catch (error) {
      console.error('Failed to validate pagelinks:', error)
      throw error
    }
  }
  
  /**
   * Check pagelinks in a specific file
   * @param workspacePath - Workspace root path  
   * @param filePath - File path to check
   * @returns Array of broken pagelinks in the file
   */
  static async validatePageLinksInFile(workspacePath: string, filePath: string): Promise<BrokenPageLink[]> {
    try {
      // Read file content
      const fileData = await adapters.fileAdapter.readFile(workspacePath, filePath)
      const content = fileData.content
      
      const brokenLinks: BrokenPageLink[] = []
      
      // Find all pagelinks using regex
      const pageLinkRegex = /\[\[([^\]]+)\]\]/g
      
      let match: RegExpExecArray | null
      while ((match = pageLinkRegex.exec(content)) !== null) {
        const linkText = match[1].trim()
        const matchIndex = match.index
        
        try {
          // Resolve the pagelink to workspace-relative path
          const resolvedPath = await adapters.fileAdapter.resolveRelativePath(
            workspacePath,
            filePath,
            linkText
          )
          
          // Check if target file exists
          const targetExists = await adapters.fileAdapter.isFileExists(workspacePath, resolvedPath)
          
          if (!targetExists) {
            // Find line number for better user experience
            const lineNumber = this.getLineNumber(content, matchIndex)
            
            brokenLinks.push({
              filePath,
              linkText,
              resolvedPath,
              lineNumber
            })
          }
        } catch (error) {
          // Resolution failed - definitely a broken link
          const lineNumber = this.getLineNumber(content, matchIndex)
          
          brokenLinks.push({
            filePath,
            linkText,
            resolvedPath: 'Unable to resolve',
            lineNumber
          })
        }
      }
      
      return brokenLinks
    } catch (error) {
      console.error(`Failed to validate pagelinks in ${filePath}:`, error)
      return []
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