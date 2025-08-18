import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '../stores/editorStore'
import { handleSave } from '../utils/fileOperations'
import { useSettingsStore } from '@renderer/stores/settingsStore'

export const useAutoSave = () => {
  const { currentWorkspace } = useWorkspaceStore()
  const { tabs, markTabDirty } = useEditorStore()
  const { generalSettings } = useSettingsStore()

  useEffect(() => {
    if (!currentWorkspace || !generalSettings.autoSaveEnabled) return

    const saveAllDirtyTabs = async () => {
      const dirtyTabs = tabs.filter(tab => tab.hasUnsavedChanges)
      let failedToSave = false
      for (const tab of dirtyTabs) {
        try {
          handleSave(currentWorkspace.path, tab.filePath, tab.id, tab.content, markTabDirty)
        } catch (error) {
          console.error('Failed to auto-save file:', error)
          failedToSave = true
        }
      }

      if (failedToSave) {
        toast.error('Failed to auto-save. Please check the console for details.')
      }
    }

    const timer = setInterval(saveAllDirtyTabs, generalSettings.autoSaveDelayInSeconds * 1000)
    return () => clearInterval(timer)
  }, [tabs, currentWorkspace, generalSettings.autoSaveDelayInSeconds, generalSettings.autoSaveEnabled, markTabDirty])
}