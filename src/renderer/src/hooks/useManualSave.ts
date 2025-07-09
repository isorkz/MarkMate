import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore, Tab } from '../stores/editorStore'

export const useManualSave = (tab: Tab | null) => {
  const { currentWorkspace } = useWorkspaceStore()
  const { markTabDirty } = useEditorStore()

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (tab && currentWorkspace) {
          try {
            await window.electron.ipcRenderer.invoke('file:write', currentWorkspace.path, tab.filePath, tab.content)
            markTabDirty(tab.id, false)
            toast.success('File saved')
          } catch (error) {
            console.error('Failed to save file:', error)
            toast.error('Failed to save file: ' + error)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tab, currentWorkspace, markTabDirty])
}