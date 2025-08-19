import { useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '../stores/editorStore'
import { syncWorkspace } from '@renderer/utils/syncOperation'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { formatDate } from '../../../shared/commonUtils'

export const useAutoSync = () => {
  const { currentWorkspace } = useWorkspaceStore()
  const { tabs, updateTabSyncStatus } = useEditorStore()
  const { syncSettings } = useSettingsStore()

  useEffect(() => {
    if (!currentWorkspace || !syncSettings.autoSyncEnabled) {
      return
    }

    const timer = setInterval(() => {
      const commitMessage = `Auto sync at ${formatDate(new Date())}`
      syncWorkspace(currentWorkspace.path, tabs, commitMessage)
    }, syncSettings.autoSyncDelayInSeconds * 1000)
    return () => clearInterval(timer)
  }, [tabs, currentWorkspace, syncSettings.autoSyncDelayInSeconds, syncSettings.autoSyncEnabled, updateTabSyncStatus])
}