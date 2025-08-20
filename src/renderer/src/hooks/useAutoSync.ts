import { useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '../stores/editorStore'
import { syncWorkspace } from '@renderer/utils/syncOperation'
import { useSettingsStore } from '@renderer/stores/settingsStore'

export const useAutoSync = () => {
  const { currentWorkspace } = useWorkspaceStore()
  const { tabs, updateTabSyncStatus } = useEditorStore()
  const { syncSettings } = useSettingsStore()

  useEffect(() => {
    if (!currentWorkspace || !syncSettings.autoSyncEnabled) {
      return
    }

    const timer = setInterval(() => {
      syncWorkspace(currentWorkspace.path, "Auto sync")
    }, syncSettings.autoSyncDelayInSeconds * 1000)
    return () => clearInterval(timer)
  }, [tabs, currentWorkspace, syncSettings.autoSyncDelayInSeconds, syncSettings.autoSyncEnabled, updateTabSyncStatus])
}