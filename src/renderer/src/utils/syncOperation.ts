import { adapters } from '../adapters'
import { Tab, useEditorStore } from '@renderer/stores/editorStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { SyncStatus } from 'src/shared/types/git'
import { formatDate } from '../../../shared/commonUtils'

export const getSyncStatus = async (workspacePath: string, filePath: string) => {
  try {
    // Get sync status for the file, including local changes and remote updates
    const syncInfo = await adapters.gitAdapter.getFileSync(workspacePath, filePath)
    
    if (syncInfo.isConflicted) {
      return 'conflict'
    }
    
    if (syncInfo.hasLocalChanges || syncInfo.hasRemoteUpdates) {
      return 'out-of-date'
    }
    
    return 'synced'
  } catch (error) {
    console.error('Failed to get sync status:', error)
    return 'error'
  }
}

export const syncWorkspace = async (workspacePath: string, tabs: Tab[], commitMessage: string): Promise<SyncStatus> => {
  try {
    // Skip sync if there are 'conflict' tabs
    const hasConflicts = tabs.some(tab => tab.syncStatus === 'conflict')
    if (hasConflicts) {
      console.warn('Cannot sync workspace: Please resolve conflicts first.')
      return 'conflict'
    }

    const { syncSettings } = useSettingsStore.getState()
    const tabsWithUnsavedChanges = tabs.filter(tab => tab.hasUnsavedChanges)
    
    // For unsaved tabs:
    // * If the auto-save is enabled, save the content first before syncing
    // * If auto-save is disabled, show a conflict warning to the user
    if (tabsWithUnsavedChanges.length > 0) {
      if (syncSettings.autoSaveEnabled) {
        // Auto-save enabled: force save all unsaved files before sync
        for (const tab of tabsWithUnsavedChanges) {
          await adapters.fileAdapter.writeFile(workspacePath, tab.filePath, tab.content)
          useEditorStore.getState().markTabDirty(tab.id, false)
        }
      } else {
        // Auto-save disabled: abort sync and return conflict
        tabsWithUnsavedChanges.forEach(tab => {
          useEditorStore.getState().updateTabSyncStatus(tab.id, 'conflict')
        })
        return 'conflict'
      }
    }
    
    // Set all tabs to syncing status
    tabs.forEach(tab => useEditorStore.getState().updateTabSyncStatus(tab.id, 'syncing'))
    
    try {
      await adapters.gitAdapter.syncWorkspace(workspacePath, commitMessage)
    } catch (gitError) {
      console.error('Git sync failed:', gitError)

      // Check if it's a merge/rebase conflict error
      const errorMessage = gitError instanceof Error ? gitError.message : String(gitError)
      if (errorMessage.includes('conflict') || errorMessage.includes('merge') || errorMessage.includes('CONFLICT')) {
        // Reload tabs to show conflict markers
        await Promise.all(tabs.map(tab => reloadTabContent(workspacePath, tab)))
        return 'conflict'
      } else {
        throw gitError // Re-throw non-conflict errors
      }
    }
    
    // Sync successful, reload all tab contents
    const results = await Promise.all(tabs.map(tab => reloadTabContent(workspacePath, tab)))
    return results.includes('error') ? 'error' : 'synced'
    
  } catch (error) {
    console.error('Sync failed:', error)
    tabs.forEach(tab => useEditorStore.getState().updateTabSyncStatus(tab.id, 'error'))
    return 'error'
  }
}

// Helper function to reload tab content and update status
const reloadTabContent = async (workspacePath: string, tab: Tab): Promise<SyncStatus> => {
  try {
    const [newContent, lastModified] = await Promise.all([
      adapters.fileAdapter.readFile(workspacePath, tab.filePath),
      adapters.fileAdapter.getLastModifiedTime(workspacePath, tab.filePath)
    ])
    
    // Check for conflict markers
    if (newContent.includes('<<<<<<< HEAD') || newContent.includes('=======') || newContent.includes('>>>>>>> ')) {
      useEditorStore.getState().updateTabSyncStatus(tab.id, 'conflict')
      useEditorStore.getState().saveTabState(tab.id, { content: newContent, lastModified })
      return 'conflict'
    } else {
      useEditorStore.getState().updateTabSyncStatus(tab.id, 'synced')
      useEditorStore.getState().saveTabState(tab.id, { content: newContent, lastModified })
      return 'synced'
    }
  } catch (fileError) {
    console.error(`Failed to reload content for tab ${tab.filePath}:`, fileError)
    useEditorStore.getState().updateTabSyncStatus(tab.id, 'error')
    return 'error'
  }
}

// Complete git merge after user resolves conflicts
export const completeGitMerge = async (workspacePath: string) => {
  try {
    const commitMessage = `Resolve merge conflicts at ${formatDate(new Date())}`
    await adapters.gitAdapter.completeMerge(workspacePath, commitMessage)
  } catch (error) {
    console.error('Failed to complete git merge:', error)
    throw error
  }
}