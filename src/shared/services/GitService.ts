import simpleGit from 'simple-git'
import path from 'path'
import { GitCommit, GitStatus, GitRemoteStatus } from '../types/git'

export class GitService {
  // Sync workspace: pull + commit + push
  static async syncWorkspace(
    workspacePath: string, 
    commitMessage: string, 
    remote: string = 'origin', 
    branch: string = 'main'
  ): Promise<void> {
    const git = simpleGit(workspacePath)
    
    // Check if remote exists
    const remotes = await git.getRemotes(true)
    const remoteExists = remotes.some(r => r.name === remote)
    if (!remoteExists) {
      throw new Error(`Remote '${remote}' does not exist`)
    }
    
    // Commit changes if any
    const status = await git.status()
    if (status.files.length > 0) {
      await git.add('.')
      await git.commit(commitMessage)
    }

    // Pull latest changes with rebase
    await git.pull(remote, 'main', { '--rebase': 'true' })

    // Push local commits to origin
    if (status.files.length > 0) {
      await git.push(remote, branch)
    }
  }

  // Get file history
  static async getFileHistory(
    workspacePath: string, 
    filePath: string, 
    limit: number = 20
  ): Promise<GitCommit[]> {
    const git = simpleGit(workspacePath)
    const log = await git.log({
      file: filePath,
      maxCount: limit
    })

    return log.all.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      date: commit.date,
      author: commit.author_name || 'Unknown',
      filePath: filePath
    }))
  }

  // Get file content at specific commit
  static async getFileAtCommit(
    workspacePath: string, 
    filePath: string, 
    commitHash: string
  ): Promise<string> {
    const git = simpleGit(workspacePath)
    return await git.show([`${commitHash}:${filePath}`])
  }

  // Get diff between two commits for a file
  static async getFileCommitsDiff(
    workspacePath: string, 
    filePath: string, 
    fromCommit: string, 
    toCommit: string
  ): Promise<string> {
    const git = simpleGit(workspacePath)
    return await git.diff([`${fromCommit}..${toCommit}`, '--', filePath])
  }

  // Get working directory diff for a file (current saved file vs last committed version)
  static async getUncommittedDiff(
    workspacePath: string, 
    filePath: string
  ): Promise<string> {
    const git = simpleGit(workspacePath)
    // Get diff between working directory and HEAD for the specific file
    return await git.diff(['HEAD', '--', filePath])
  }

  // Restore file to specific commit
  static async restoreFile(
    workspacePath: string, 
    filePath: string, 
    commitHash: string
  ): Promise<void> {
    const git = simpleGit(workspacePath)
    
    // Use Git's native restore command to restore file from specific commit
    await git.raw(['restore', '--source', commitHash, filePath])
    
    // Commit the restoration
    await git.add(filePath)
    const timestamp = new Date().toISOString()
    const commitMessage = `Restore: ${path.basename(filePath)} to ${commitHash.substring(0, 8)} at ${timestamp}`
    await git.commit(commitMessage)
  }

  // Discard uncommitted changes for a specific file
  static async discardChanges(
    workspacePath: string, 
    filePath: string
  ): Promise<void> {
    const git = simpleGit(workspacePath)
    // Reset the file to HEAD (discard working directory changes)
    await git.checkout(['HEAD', '--', filePath])
  }

  // Get Git status for a specific file
  static async checkLocalStatus(
    workspacePath: string, 
    filePath: string
  ): Promise<GitStatus> {
    const git = simpleGit(workspacePath)
    const status = await git.status()
    
    // Check if specific file has changes
    const isModified = status.modified.includes(filePath) || 
                      status.created.includes(filePath) || 
                      status.not_added.includes(filePath)
    return { hasChanges: isModified }
  }

  // Check if local branch is ahead of remote (has unpushed commits)
  static async checkRemoteStatus(
    workspacePath: string, 
    remote: string = 'origin', 
    branch: string = 'main'
  ): Promise<GitRemoteStatus> {
    const git = simpleGit(workspacePath)
    
    // Check if remote exists
    const remotes = await git.getRemotes(true)
    const remoteExists = remotes.some(r => r.name === remote)
    if (!remoteExists) {
      throw new Error(`Remote '${remote}' does not exist`)
    }

    // Fetch latest remote info (without merging)
    await git.fetch(remote, branch)
    
    // Get commits ahead of remote
    const status = await git.status()
    const aheadCount = status.ahead || 0
    
    return { hasUnpushedCommits: aheadCount > 0 }
  }

  // Configure Git
  static async configGit(
    workspacePath: string, 
    gitUsername: string, 
    gitEmail: string, 
    gitRemoteUrl: string
  ): Promise<void> {
    const git = simpleGit(workspacePath)
    
    // Set user config
    await git.addConfig('user.name', gitUsername)
    await git.addConfig('user.email', gitEmail)
    
    await git.remote(['set-url', 'origin', gitRemoteUrl])

    // Test remote URL by setting it and fetching
    await git.fetch('origin')
  }
}