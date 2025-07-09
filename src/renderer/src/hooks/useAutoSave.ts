import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore, Tab } from '../stores/editorStore'

interface UseAutoSaveOptions {
  delay?: number
  enabled?: boolean
}

export const useAutoSave = (tab: Tab | null, options: UseAutoSaveOptions = {}) => {
  const { delay = 10000, enabled = true } = options
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

    const autoSaveTimer = setTimeout(saveFile, delay)
    return () => clearTimeout(autoSaveTimer)
  }, [tab?.content, tab?.hasUnsavedChanges, tab?.id, tab?.filePath, currentWorkspace, markTabDirty, delay, enabled])
}