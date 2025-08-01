import { ipcMain } from 'electron'
import { GitService } from '../../shared/services'

export function setupGitHandlers() {
  // Configure Git
  ipcMain.handle('git:config', async (_, workspacePath: string, gitUsername: string, gitEmail: string, gitRemoteUrl: string) => {
    try {
      await GitService.configGit(workspacePath, gitUsername, gitEmail, gitRemoteUrl)
    } catch (error) {
      console.error('Git config failed:', error)
      throw error
    }
  })

  // Get file history
  ipcMain.handle('git:history', async (_, workspacePath: string, filePath: string, limit: number = 20) => {
    try {
      return await GitService.getFileHistory(workspacePath, filePath, limit)
    } catch (error) {
      console.error('Failed to get file history:', error)
      throw error
    }
  })

  // Get file content at specific commit
  ipcMain.handle('git:get-file-commit', async (_, workspacePath: string, filePath: string, commitHash: string) => {
    try {
      return await GitService.getFileAtCommit(workspacePath, filePath, commitHash)
    } catch (error) {
      console.error('Failed to get file at commit:', error)
      throw error
    }
  })

  // Get diff between two commits for a file
  ipcMain.handle('git:get-file-commits-diff', async (_, workspacePath: string, filePath: string, fromCommit: string, toCommit: string) => {
    try {
      return await GitService.getFileCommitsDiff(workspacePath, filePath, fromCommit, toCommit)
    } catch (error) {
      console.error('Failed to get diff:', error)
      throw error
    }
  })

  // Get working directory diff for a file (current saved file vs last committed version)
  ipcMain.handle('git:get-uncommitted-diff', async (_, workspacePath: string, filePath: string) => {
    try {
      return await GitService.getUncommittedDiff(workspacePath, filePath)
    } catch (error) {
      console.error('Failed to get working directory diff:', error)
      throw error
    }
  })

  // Restore file to specific commit
  ipcMain.handle('git:restore', async (_, workspacePath: string, filePath: string, commitHash: string) => {
    try {
      await GitService.restoreFile(workspacePath, filePath, commitHash)
    } catch (error) {
      console.error('Failed to restore file:', error)
      throw error
    }
  })

  // Discard uncommitted changes for a specific file
  ipcMain.handle('git:discard-changes', async (_, workspacePath: string, filePath: string) => {
    try {
      await GitService.discardChanges(workspacePath, filePath)
    } catch (error) {
      console.error('Failed to discard changes:', error)
      throw error
    }
  })

  // Sync workspace: pull + commit + push
  ipcMain.handle('git:sync', async (_, workspacePath: string, commitMessage: string, remote: string = 'origin', branch: string = 'main') => {
    try {
      await GitService.syncWorkspace(workspacePath, commitMessage, remote, branch)
    } catch (error) {
      console.error('Failed to sync:', error)
      throw error
    }
  })

  // Get Git status for a specific file
  ipcMain.handle('git:check-local-status', async (_, workspacePath: string, filePath: string) => {
    try {
      return await GitService.checkLocalStatus(workspacePath, filePath)
    } catch (error) {
      console.error('Failed to get git file status:', error)
      throw error
    }
  })

  // Check if local branch is ahead of remote (has unpushed commits)
  ipcMain.handle('git:check-remote-status', async (_, workspacePath: string, remote: string = 'origin', branch: string = 'main') => {
    try {
      return await GitService.checkRemoteStatus(workspacePath, remote, branch)
    } catch (error) {
      console.error('Failed to check push status:', error)
      throw error
    }
  })
}