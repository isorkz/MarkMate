import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore, Tab } from '../stores/editorStore'

interface UseAutoSaveOptions {
  delayInSeconds?: number
  enabled?: boolean
}

export const useAutoSave = (tab: Tab | null, options: UseAutoSaveOptions = {}) => {
  const { delayInSeconds = 10, enabled = true } = options
  const { currentWorkspace } = useWorkspaceStore()
  const { markTabDirty } = useEditorStore()

  useEffect(() => {
    if (!tab || !currentWorkspace || !enabled) return
    if (!tab.hasUnsavedChanges) return

    const saveFile = async () => {
      try {
        await window.electron.ipcRenderer.invoke('file:write', currentWorkspace.path, tab.filePath, tab.content)
        markTabDirty(tab.id, false)
      } catch (error) {
        console.error('Failed to auto-save file:', error)
        toast.error('Failed to auto-save file: ' + error)
      }
    }

    const autoSaveTimer = setTimeout(saveFile, delayInSeconds * 1000)
    return () => clearTimeout(autoSaveTimer)
  }, [tab?.content, tab?.hasUnsavedChanges, tab?.id, tab?.filePath, currentWorkspace, markTabDirty, delayInSeconds, enabled])
}