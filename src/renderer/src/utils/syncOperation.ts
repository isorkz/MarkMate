import { adapters } from '../adapters'
import { Tab } from '@renderer/stores/editorStore'
import { SyncStatus } from '../../../shared/types/git'

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

export const syncWorkspace = async (workspacePath: string, tabs: Tab[], commitMessage: string, updateTabSyncStatus: (tabId: string, status: SyncStatus) => void) => {
  // TODO: based on last modified time in workspace, decide if we need to commit and push
  try {
    // Set all tabs to syncing status
    tabs.forEach(tab => updateTabSyncStatus(tab.id, 'syncing'))
    
    await adapters.gitAdapter.syncWorkspace(workspacePath, commitMessage)
    
    // Set all tabs to synced status
    tabs.forEach(tab => updateTabSyncStatus(tab.id, 'synced'))
  } catch (error) {
    console.error('Auto-sync failed:', error)
    // Set all tabs to error status
    tabs.forEach(tab => updateTabSyncStatus(tab.id, 'error'))
  }
}