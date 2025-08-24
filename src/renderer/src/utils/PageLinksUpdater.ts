import toast from 'react-hot-toast'
import { adapters } from '../adapters'
import { getAllMarkdownFiles } from './fileOperations'
import { useEditorStore } from '@renderer/stores/editorStore'
import { useFileSystemStore } from '@renderer/stores/fileSystemStore'
import { FileNode } from '@shared/types/file'
import { markFileAsUnwatched } from '../hooks/useFileWatcher'

/**
 * Utility for updating pagelink paths when files are moved
 */
export class PageLinksUpdater {
  /**
   * Update pagelinks after a folder is moved
   * @param workspacePath - Workspace root path
   * @param oldPath - Old folder path (workspace relative)
   * @param newPath - New folder path (workspace relative)
   */
  static async updatePageLinksAfterFolderMove(
    workspacePath: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    try {
      // Get all markdown files in workspace (after the move)
      const fileTree = await adapters.workspaceAdapter.getFileTree(workspacePath)
      const allMarkdownFiles = getAllMarkdownFiles(fileTree)
      
      // Find files that were moved (now under the new folder path)
      const movedFiles = allMarkdownFiles.filter(file => 
        file.path.startsWith(newPath + '/') || file.path === newPath
      )
      
      // For each moved file, update its pagelinks
      await this.processMarkdownFiles(movedFiles, async (newFilePath) => {
        // Calculate the old path by replacing newPath with oldPath
        let oldFilePath: string
        if (newFilePath === newPath) {
          oldFilePath = oldPath
        } else {
          // Replace the folder prefix to get old file path
          oldFilePath = newFilePath.replace(newPath + '/', oldPath + '/')
        }
        
        // Update pagelinks for this moved file
        await this.updatePageLinksAfterFileMove(workspacePath, oldFilePath, newFilePath)
      })
      
      console.log(`Updated pagelinks for ${movedFiles.length} files in moved folder: ${oldPath} -> ${newPath}`)
    } catch (error) {
      console.error('Failed to update pagelinks after folder move:', error)
      toast.error('Failed to update pagelinks after folder move. Some links may be broken.')
    }
  }

  /**
   * Update pagelinks after a single file is moved
   * @param workspacePath - Workspace root path
   * @param oldPath - Old file path (workspace relative)
   * @param newPath - New file path (workspace relative)
   */
  static async updatePageLinksAfterFileMove(
    workspacePath: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    try {
      // Update links inside the moved file
      // When file location changes, relative paths to other files need recalculation
      await this.updateLinksInsideMovedFile(workspacePath, oldPath, newPath)
      
      // Update links pointing to the moved file
      // Other files need to update their links to point to the new location
      await this.updateLinksPointingToMovedFile(workspacePath, oldPath, newPath)
    } catch (error) {
      console.error('Failed to update pagelinks after file move:', error)
      toast.error('Failed to update pagelinks after file move. Some links may be broken.')
    }
  }

  /**
   * Update links inside the moved file
   * 
   * When a file is moved, all pagelinks inside that file need to be recalculated
   */
  private static async updateLinksInsideMovedFile(
    workspacePath: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    try {
      // Read the content of the moved file
      const fileData = await adapters.fileAdapter.readFile(workspacePath, newPath)
      const content = fileData.content
      
      // Update pagelinks in the content
      const { updatedContent, updatedCount } = await this.recalculatePageLinksInContent(
        workspacePath,
        oldPath,
        content,
        (pagelinkRelativeToWorkspace) => {
          return { fromPath: newPath, targetPath: pagelinkRelativeToWorkspace }
        }
      )
      
      // Write back if content changed
      if (updatedContent !== content) {
        await this.updateContent(workspacePath, newPath, updatedContent)
        console.log(`Updated ${updatedCount} pagelinks inside moved file: ${oldPath} -> ${newPath}`)
      }
    } catch (error) {
      console.error(`Failed to update pagelinks inside moved file: ${oldPath} -> ${newPath}:`, error)
      throw error
    }
  }

  /**
   * Recalculate pagelinks in content with a custom handler
   * 
   * @param content - File content containing pagelinks
   * @param workspacePath - Workspace root path  
   * @param currentFilePath - Current file path for resolving relative paths
   * @param handler - Function that receives resolved path and returns update info or null
   * @returns Updated content with recalculated pagelinks
   * 
   * (1) For updating pagelinks inside the moved file scenario:
   * For example, when moving file `docs/A.md` to `docs/guides/A.md`,
   * all links like `[[../README.md]]` inside `A.md` should be updated to `[[../../README.md]]`.
   * 
   * - `filePath` is the old path of the moved file (`docs/A.md` in this case)
   * - `content` is the moved file's content
   * - `handler` receives the resolved path of each pagelink and returns:
   *   - `fromPath`: The new path of the moved file (`docs/guides/A.md` in this case)
   *   - `targetPath`: The pagelink's resolved path, relative to workspace (`README.md` in this case)
   * Based on `docs/guides/A.md` and `README.md`, the relative pagelink will be recalculated to `[[../../README.md]]`.
   * 
   * (2) For updating pagelinks pointing to the moved file scenario:
   * For example, when moving file `docs/A.md` to `docs/guides/A.md`,
   * all links that point to `docs/A.md` in other files should be updated to point to `docs/guides/A.md`.
   * If a file `docs/B.md` contains a link `[[A.md]]`, it should be updated to `[[guides/A.md]]`.
   * 
   * - `filePath` is the path of other files being processed (`docs/B.md` in this case)
   * - `content` is the content of other files that may contain links to `A.md`
   * - `handler` receives the resolved path of each pagelink and returns:
   *   - `fromPath`: The path of the file being processed (`docs/B.md` in this case)
   *   - `targetPath`: The new path of the moved file (`docs/guides/A.md` in this case)
   * Based on `docs/B.md` and `docs/guides/A.md`, the relative pagelink will be recalculated to `[[guides/A.md]]`.
   */
  private static async recalculatePageLinksInContent(
    workspacePath: string,
    filePath: string,
    content: string,
    handler: (resolvedPath: string) => { fromPath: string; targetPath: string; } | null
  ): Promise<{ updatedContent: string; updatedCount: number }> {
    // Regex to match [[...]] patterns
    const pageLinkRegex = /\[\[([^\]]+)\]\]/g
    
    let updatedContent = content
    let updatedCount = 0
    let match: RegExpExecArray | null
    
    // Reset regex lastIndex to start fresh
    pageLinkRegex.lastIndex = 0
    
    while ((match = pageLinkRegex.exec(content)) !== null) {
      const linkPath = match[1].trim()
      const fullMatch = match[0]
      
      try {
        // Get the resolved path for the pagelink, relative to the workspace root
        const pagelinkRelativeToWorkspace = await adapters.fileAdapter.resolveRelativePath(
          workspacePath,
          filePath,
          linkPath
        )
        
        // Check if handler wants to update this link
        const updateInfo = handler(pagelinkRelativeToWorkspace)
        if (updateInfo) {
          // Calculate new relative path from specified location to target
          const newRelativePath = await adapters.fileAdapter.getRelativePath(
            workspacePath,
            updateInfo.fromPath,
            updateInfo.targetPath
          )
          
          // Replace if the relative path has changed
          if (newRelativePath !== linkPath) {
            const newPageLink = `[[${newRelativePath}]]`
            updatedContent = updatedContent.replace(fullMatch, newPageLink)
            updatedCount++
          }
        }
      } catch (error) {
        console.error(`Failed to recalculate pagelink ${linkPath}:`, error)
        throw error
      }
    }
    
    return { updatedContent, updatedCount }
  }

  /**
   * Update links pointing to the moved file
   * 
   * When a file is moved, all other files that contain pagelinks pointing to this file
   * need to be updated to point to the new location.
   */
  private static async updateLinksPointingToMovedFile(
    workspacePath: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    try {
      // Get all markdown files in workspace
      const allMarkdownFiles = getAllMarkdownFiles(useFileSystemStore.getState().fileTree)
      
      // Process markdown files in batches and collect results
      const updateCounts: number[] = []
      
      await this.processMarkdownFiles(allMarkdownFiles, async (filePath) => {
        // Skip the moved file itself
        if (filePath === newPath) return
        
        try {
          const fileData = await adapters.fileAdapter.readFile(workspacePath, filePath)
          const content = fileData.content
          
          // Check and update pagelinks pointing to the moved file
          const { updatedContent, updatedCount } = await this.recalculatePageLinksInContent(
            workspacePath,
            filePath,
            content,
            (pagelinkRelativeToWorkspace) => {
              // Check if this pagelink points to the old target path
              if (pagelinkRelativeToWorkspace === oldPath) {
                return { fromPath: filePath, targetPath: newPath }
              }
              return null // No update needed
            }
          )
          
          // Write back if content changed
          if (updatedContent !== content) {
            await this.updateContent(workspacePath, filePath, updatedContent)
            updateCounts.push(updatedCount) // Thread-safe: only pushing to array
          }
        } catch (error) {
          console.error(`Failed to update pagelinks in ${filePath}:`, error)
          throw error
        }
      })
      
      // Calculate totals after all processing is complete
      const totalUpdatedFiles = updateCounts.length
      const totalUpdatedLinks = updateCounts.reduce((sum, count) => sum + count, 0)
      
      if (totalUpdatedLinks > 0) {
        console.log(`Updated ${totalUpdatedLinks} pagelinks in ${totalUpdatedFiles} files pointing to moved file: ${oldPath} -> ${newPath}`)
      }
    } catch (error) {
      console.error('Failed to update pagelinks pointing to moved file:', error)
      throw error
    }
  }

  /**
   * Process all markdown files in batches to control concurrency
   */
  private static async processMarkdownFiles(
    files: FileNode[],
    processor: (filePath: string) => Promise<void>
  ): Promise<void> {
    const BATCH_SIZE = 10
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE)
      
      const promises = batch.map(async (file) => {
        await processor(file.path)
      })
      
      await Promise.all(promises)
    }
  }

  private static async updateContent(
    workspacePath: string,
    filePath: string,
    updatedContent: string,
  ): Promise<void> {
    // Temporarily mark the file as unwatched to prevent triggering file watchers
    markFileAsUnwatched(filePath)
    await adapters.fileAdapter.writeFile(workspacePath, filePath, updatedContent)

    // reload the content in the editor
    const tab = useEditorStore.getState().tabs.find(t => t.filePath === filePath)
    if (tab) {
      useEditorStore.getState().reloadTabContent(tab.id, updatedContent, new Date())
    }
  }
}