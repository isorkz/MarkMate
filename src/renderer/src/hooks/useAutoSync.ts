import { useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '../stores/editorStore'
import { formatDate } from '../../../shared/commonUtils'

interface UseAutoSyncOptions {
  delayInSeconds: number
  enabled: boolean
}

export const useAutoSync = (options: UseAutoSyncOptions) => {
  const { delayInSeconds, enabled } = options
  const { currentWorkspace } = useWorkspaceStore()
  const { tabs, updateTabSyncStatus } = useEditorStore()

  useEffect(() => {
    if (!currentWorkspace || !enabled) {
      return
    }

    const syncAllSavedTabs = async () => {
      // Only sync tabs that have been saved
      const savedTabs = tabs.filter(tab => !tab.hasUnsavedChanges)
      
      // Check each tab's git status and update sync status
      for (const tab of savedTabs) {
        try {
          const statusResult = await window.electron.ipcRenderer.invoke('git:file-status', currentWorkspace.path, tab.filePath)
          
          if (statusResult.hasChanges) {
            updateTabSyncStatus(tab.id, 'out-of-date')
          } else {
            updateTabSyncStatus(tab.id, 'synced')
          }
        } catch (error) {
          console.warn('Failed to check git status for', tab.title, error)
          updateTabSyncStatus(tab.id, 'error')
        }
      }

      // Commit all saved files
      if (savedTabs.length > 0) {
        try {
          // Set all files to syncing status
          savedTabs.forEach(tab => updateTabSyncStatus(tab.id, 'syncing'))
          
          const commitMessage = `Auto-sync at ${formatDate(new Date())}`
          await window.electron.ipcRenderer.invoke('git:commit', currentWorkspace.path, commitMessage)
          
          // Set all files to synced status
          savedTabs.forEach(tab => updateTabSyncStatus(tab.id, 'synced'))
        } catch (error) {
          console.warn('Auto-sync failed:', error)
          // Set all files to error status
          savedTabs.forEach(tab => updateTabSyncStatus(tab.id, 'error'))
        }
      }
    }

    const timer = setInterval(syncAllSavedTabs, delayInSeconds * 1000)
    return () => clearInterval(timer)
  }, [tabs, currentWorkspace, delayInSeconds, enabled, updateTabSyncStatus])
}