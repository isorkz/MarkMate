import { adapters } from '../adapters'
import { Tab, useEditorStore } from '@renderer/stores/editorStore'
import { SyncStatus } from '../../../shared/types/git'
import { useSettingsStore } from '@renderer/stores/settingsStore'

export const getSyncStatus = async (workspacePath: string, filePath: string) => {
  try {
    // Get sync status for the file, including local changes and remote updates
    const syncInfo = await adapters.gitAdapter.getFileSync(workspacePath, filePath)
    
    if (syncInfo.hasLocalChanges || syncInfo.hasRemoteUpdates) {
      return 'out-of-date'
    }
    
    return 'synced'
  } catch (error) {
    console.error('Failed to get sync status:', error)
    return 'error'
  }
}

export const syncWorkspace = async (workspacePath: string, tabs: Tab[], commitMessage: string) => {
  try {
    // Set all tabs to syncing status
    tabs.forEach(tab => useEditorStore.getState().updateTabSyncStatus(tab.id, 'syncing'))
    
    await adapters.gitAdapter.syncWorkspace(workspacePath, commitMessage)
    
    for (const tab of tabs) {
      // After sync with remote, reload content for tabs that don't have unsaved changes
      if (!tab.hasUnsavedChanges) {
        try {
          const [newContent, lastModified] = await Promise.all([
            adapters.fileAdapter.readFile(workspacePath, tab.filePath),
            adapters.fileAdapter.getLastModifiedTime(workspacePath, tab.filePath)
          ])
          
          // Update tab content through the store
          useEditorStore.getState().saveTabState(tab.id, {
            content: newContent,
            lastModified: lastModified
          })

          // Update sync status to synced
          useEditorStore.getState().updateTabSyncStatus(tab.id, 'synced')
        } catch (fileError) {
          console.error(`Failed to reload content for tab ${tab.filePath}:`, fileError)
        }
      }
    }
  } catch (error) {
    console.error('Auto-sync failed:', error)
    // Set all tabs to error status
    tabs.forEach(tab => useEditorStore.getState().updateTabSyncStatus(tab.id, 'error'))
  }
}