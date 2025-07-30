import { adapters } from '../adapters'

export const checkSyncStatus = async (workspacePath: string, filePath: string) => {
  try {
    // First check if file has local changes
    const fileStatusResult = await adapters.gitAdapter.checkLocalStatus(workspacePath, filePath)
    
    // File has uncommitted changes
    if (fileStatusResult.hasChanges) {
      return 'out-of-date'
    }

    // File is committed locally, now check if it's pushed to remote
    const pushStatusResult = await adapters.gitAdapter.checkRemoteStatus(workspacePath)
    
    if (pushStatusResult.hasUnpushedCommits) {
      return 'out-of-date'
    } else {
      return 'synced'
    }
  } catch (error) {
    console.error('Failed to check sync status:', error)
    return 'error'
  }
}