import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore, Tab } from '../stores/editorStore'
import { handleSave } from '../utils/fileOperations'

export const useManualSave = (tab: Tab | null) => {
  const { currentWorkspace } = useWorkspaceStore()
  const { markTabDirty } = useEditorStore()

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (tab && currentWorkspace) {
          try {
            handleSave(currentWorkspace.path, tab.filePath, tab.id, tab.content, markTabDirty)
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