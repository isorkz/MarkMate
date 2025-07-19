import { ipcMain } from 'electron'
import path from 'path'
import simpleGit from 'simple-git'

export function setupGitHandlers() {
  // Initialize Git repository
  ipcMain.handle('git:init', async (_, workspacePath: string) => {
    try {
      const git = simpleGit(workspacePath)
      
      // Check if Git repo already exists
      const isRepo = await git.checkIsRepo()
      if (isRepo) {
        return // Repository already exists
      }
      
      // Initialize new repository
      await git.init()
      await git.addConfig('user.name', 'MarkMate User')
      await git.addConfig('user.email', 'user@markmate.local')
    } catch (error) {
      console.error('Failed to initialize Git repository:', error)
      throw error
    }
  })

  // Get file history
  ipcMain.handle('git:history', async (_, workspacePath: string, filePath: string, limit: number = 20) => {
    try {
      const git = simpleGit(workspacePath)
      const log = await git.log({
        file: filePath,
        maxCount: limit
      })

      const history = log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        date: commit.date,
        author: commit.author_name || 'Unknown',
        filePath: filePath
      }))
      return history
    } catch (error) {
      console.error('Failed to get file history:', error)
      throw error
    }
  })

  // Get file content at specific commit
  ipcMain.handle('git:get-file-commit', async (_, workspacePath: string, filePath: string, commitHash: string) => {
    try {
      const git = simpleGit(workspacePath)
      const content = await git.show([`${commitHash}:${filePath}`])
      return content
    } catch (error) {
      console.error('Failed to get file at commit:', error)
      throw error
    }
  })

  // Get diff between two commits for a file
  ipcMain.handle('git:get-file-commits-diff', async (_, workspacePath: string, filePath: string, fromCommit: string, toCommit: string) => {
    try {
      const git = simpleGit(workspacePath)
      const diff = await git.diff([`${fromCommit}..${toCommit}`, '--', filePath])
      return diff
    } catch (error) {
      console.error('Failed to get diff:', error)
      throw error
    }
  })

  // Get working directory diff for a file (current saved file vs last committed version)
  ipcMain.handle('git:get-uncommitted-diff', async (_, workspacePath: string, filePath: string) => {
    try {
      const git = simpleGit(workspacePath)
      
      // Get diff between working directory and HEAD for the specific file
      const diff = await git.diff(['HEAD', '--', filePath])
      return diff
    } catch (error) {
      console.error('Failed to get working directory diff:', error)
      throw error
    }
  })

  // Restore file to specific commit
  ipcMain.handle('git:restore', async (_, workspacePath: string, filePath: string, commitHash: string) => {
    try {
      const git = simpleGit(workspacePath)
      
      // Use Git's native restore command to restore file from specific commit
      await git.raw(['restore', '--source', commitHash, filePath])
      
      // Commit the restoration
      await git.add(filePath)
      const timestamp = new Date().toISOString()
      const commitMessage = `Restore: ${path.basename(filePath)} to ${commitHash.substring(0, 8)} at ${timestamp}`
      await git.commit(commitMessage)
    } catch (error) {
      console.error('Failed to restore file:', error)
      throw error
    }
  })

  // Discard uncommitted changes for a specific file
  ipcMain.handle('git:discard-changes', async (_, workspacePath: string, filePath: string) => {
    try {
      const git = simpleGit(workspacePath)
      // Reset the file to HEAD (discard working directory changes)
      await git.checkout(['HEAD', '--', filePath])
    } catch (error) {
      console.error('Failed to discard changes:', error)
      throw error
    }
  })

  // Sync workspace: pull + commit + push
  ipcMain.handle('git:sync', async (_, workspacePath: string, commitMessage: string, remote: string = 'origin', branch: string = 'main') => {
    try {
      const git = simpleGit(workspacePath)
      
      // Check if remote exists
      const remotes = await git.getRemotes(true)
      const remoteExists = remotes.some(r => r.name === remote)
      if (!remoteExists) {
        console.log('remote: ', remotes)
        throw `Remote '${remote}' does not exist`
      }
      
      // Commit changes if any
      const status = await git.status()
      if (status.files.length > 0) {
        await git.add('.')
        await git.commit(commitMessage)
      }

      // Configure credentials if available
      if (import.meta.env.VITE_GIT_USERNAME && import.meta.env.VITE_GIT_TOKEN) {
        const username = import.meta.env.VITE_GIT_USERNAME
        const useremail = import.meta.env.VITE_GIT_USEREMAIL
        const remote_url = import.meta.env.VITE_GIT_REMOTE_URL
        
        await git.addConfig('user.name', username)
        await git.addConfig('user.email', useremail)
        await git.remote(['set-url', remote, remote_url])
      }

      // Pull latest changes with rebase
      await git.pull(remote, 'main', { '--rebase': 'true' })

      // Push local commits to origin
      if (status.files.length > 0) {
        await git.push(remote, branch)
      }
    } catch (error) {
      console.error('Failed to sync:', error)
      throw error
    }
  })

  // Commit all changes
  // ipcMain.handle('git:commit', async (_, workspacePath: string, commitMessage: string) => {
  //   try {
  //     const git = simpleGit(workspacePath)
  //     await git.add('.')  // Add all changes
  //     await git.commit(commitMessage)
  //   } catch (error) {
  //     console.error('Failed to commit changes:', error)
  //     throw error
  //   }
  // })

  // Get Git status for a specific file
  ipcMain.handle('git:check-local-status', async (_, workspacePath: string, filePath: string) => {
    try {
      const git = simpleGit(workspacePath)
      const status = await git.status()
      
      // Check if specific file has changes
      const isModified = status.modified.includes(filePath) || 
                        status.created.includes(filePath) || 
                        status.not_added.includes(filePath)
      return { hasChanges: isModified }
    } catch (error) {
      console.error('Failed to get git file status:', error)
      throw error
    }
  })

  // Check if local branch is ahead of remote (has unpushed commits)
  ipcMain.handle('git:check-remote-status', async (_, workspacePath: string, remote: string = 'origin', branch: string = 'main') => {
    try {
      const git = simpleGit(workspacePath)
      
      // Check if remote exists
      const remotes = await git.getRemotes(true)
      const remoteExists = remotes.some(r => r.name === remote)
      if (!remoteExists) {
        console.log('remote: ', remotes)
        throw `Remote '${remote}' does not exist`
      }
      
      if (import.meta.env.VITE_GIT_USERNAME && import.meta.env.VITE_GIT_TOKEN) {
        const username = import.meta.env.VITE_GIT_USERNAME
        const useremail = import.meta.env.VITE_GIT_USEREMAIL
        const remote_url = import.meta.env.VITE_GIT_REMOTE_URL
        
        await git.addConfig('user.name', username)
        await git.addConfig('user.email', useremail)
        await git.remote(['set-url', remote, remote_url])
      }
      
      // Fetch latest remote info (without merging)
      await git.fetch(remote, branch)
      
      // Get commits ahead of remote
      const status = await git.status()
      const aheadCount = status.ahead || 0
      
      return { 
        hasUnpushedCommits: aheadCount > 0
      }
    } catch (error) {
      console.error('Failed to check push status:', error)
      throw error
    }
  })
}