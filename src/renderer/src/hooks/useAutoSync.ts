import { useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '../stores/editorStore'
import { formatDate } from '../../../shared/commonUtils.ts'
import { adapters } from '../adapters'

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

    const syncWorkspace = async () => {
      // TODO: based on last modified time in workspace, decide if we need to commit and push
      try {
        // Set all tabs to syncing status
        tabs.forEach(tab => updateTabSyncStatus(tab.id, 'syncing'))
        
        const commitMessage = `Auto-sync at ${formatDate(new Date())}`
        await adapters.gitAdapter.syncWorkspace(currentWorkspace.path, commitMessage)
        
        // Set all tabs to synced status
        tabs.forEach(tab => updateTabSyncStatus(tab.id, 'synced'))
      } catch (error) {
        console.error('Auto-sync failed:', error)
        // Set all tabs to error status
        tabs.forEach(tab => updateTabSyncStatus(tab.id, 'error'))
      }
    }

    const timer = setInterval(syncWorkspace, delayInSeconds * 1000)
    return () => clearInterval(timer)
  }, [tabs, currentWorkspace, delayInSeconds, enabled, updateTabSyncStatus])
}