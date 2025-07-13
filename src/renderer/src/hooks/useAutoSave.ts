import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '../stores/editorStore'
import { handleSave } from '../utils/fileOperations'

interface UseAutoSaveOptions {
  delayInSeconds?: number
  enabled?: boolean
}

export const useAutoSave = (options: UseAutoSaveOptions = {}) => {
  const { delayInSeconds = 10, enabled = true } = options
  const { currentWorkspace } = useWorkspaceStore()
  const { tabs, markTabDirty } = useEditorStore()

  useEffect(() => {
    if (!currentWorkspace || !enabled) return

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

    const timer = setInterval(saveAllDirtyTabs, delayInSeconds * 1000)
    return () => clearInterval(timer)
  }, [tabs, currentWorkspace, delayInSeconds, enabled, markTabDirty])
}