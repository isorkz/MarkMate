import { useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '../stores/editorStore'
import { syncWorkspace } from '@renderer/utils/syncOperation'
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

    const timer = setInterval(() => {
      const commitMessage = `Auto sync at ${formatDate(new Date())}`
      syncWorkspace(currentWorkspace.path, tabs, commitMessage, updateTabSyncStatus)
    }, delayInSeconds * 1000)
    return () => clearInterval(timer)
  }, [tabs, currentWorkspace, delayInSeconds, enabled, updateTabSyncStatus])
}