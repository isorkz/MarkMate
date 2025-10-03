import simpleGit from 'simple-git'
import path from 'path'
import { GitCommit, GitStatus } from '../types/git'

export class GitService {
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
  
  // get file sync status (combines local and remote checks)
  static async getFileSync(
    workspacePath: string, 
    filePath: string,
    remote: string = 'origin', 
    branch: string = 'main'
  ): Promise<GitStatus> {
    // Check if remote exists
    // Fetch latest remote info (without merging)
    const git = simpleGit(workspacePath)
    await git.fetch(remote, branch)

    const status = await git.status()
    
    // Check if this specific file is in conflict state
    const isFileInConflict = status.conflicted && status.conflicted.includes(filePath)
    
    // Check if file has any local changes (working dir + staging area)
    const hasLocalChanges = status.modified.includes(filePath) || 
                           status.staged.includes(filePath) ||     // staged changes
                           status.created.includes(filePath) ||
                           status.deleted.includes(filePath) ||
                           status.not_added.includes(filePath) ||
                           status.ahead > 0
    const hasRemoteUpdates = (status.behind || 0) > 0
    
    return {
      hasLocalChanges,
      hasRemoteUpdates,
      isConflicted: isFileInConflict
    }
  }

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

    const branchSummary = await git.branch()
    const currentBranch = branchSummary.current
    const targetBranch = branch ?? currentBranch ?? 'main'

    if (!currentBranch) {
      throw new Error('Cannot determine the current branch to sync')
    }

    if (currentBranch !== targetBranch) {
      throw new Error(`Current branch '${currentBranch}' does not match target branch '${targetBranch}'`)
    }

    // Commit changes if any
    const statusBeforeCommit = await git.status()
    const hasLocalChanges = statusBeforeCommit.files.length > 0

    if (hasLocalChanges) {
      await git.add('.')
      await git.commit(commitMessage)
    }

    // Fetch the latest changes for the branch we're tracking
    await git.fetch(remote, targetBranch)

    const statusAfterFetch = await git.status()
    const remoteAhead = statusAfterFetch.behind ?? 0

    if (remoteAhead > 0) {
      const remoteBranchRef = `${remote}/${targetBranch}`
      await git.rebase([remoteBranchRef])
    }

    const statusAfterRebase = await git.status()

    // Push local commits to origin if we created or still have commits ahead of remote
    if (hasLocalChanges || (statusAfterRebase.ahead ?? 0) > 0) {
      await git.push(remote, targetBranch)
    }
  }

  // Complete merge by staging and committing resolved files
  static async completeMerge(
    workspacePath: string,
    commitMessage: string
  ): Promise<void> {
    const git = simpleGit(workspacePath)
    
    // Stage all resolved files
    await git.add('.')
    
    try {
      // Try to continue rebase first (if in rebase state)
      // Use : as editor to avoid interactive mode
      await git.env('GIT_EDITOR', ':').rebase(['--continue'])
    } catch (rebaseError) {
      // If rebase continue fails, try regular commit (for merge conflicts)
      await git.commit(commitMessage)
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

  // Get detailed git status for debugging
  static async gitStatus(workspacePath: string): Promise<{
    simpleGitStatus: string,
    gitStatus: string
  }> {
    const git = simpleGit(workspacePath)
    const simpleGitStatus = await git.status()
    const gitStatus = await git.raw(['status'])
    
    return {
      simpleGitStatus: JSON.stringify(simpleGitStatus, null, 2),
      gitStatus
    }
  }
}
