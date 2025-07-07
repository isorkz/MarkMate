import React, { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore, Tab } from '../../stores/editorStore'
import SourceEditor from './SourceEditor'
import RichEditor from './RichEditor'

interface EditorProps {
  tab: Tab
}

const Editor: React.FC<EditorProps> = ({ tab }) => {
  const { showSourceEditor, markTabDirty } = useEditorStore()
  const { currentWorkspace } = useWorkspaceStore()

  // Auto-save functionality
  useEffect(() => {
    if (!tab || !currentWorkspace) return

    const saveFile = async () => {
      if (tab.hasUnsavedChanges) {
        try {
          await window.electron.ipcRenderer.invoke('file:write', currentWorkspace.path, tab.filePath, tab.content)
          markTabDirty(tab.id, false)
        } catch (error) {
          console.error('Failed to auto-save file:', error)
          toast.error('Failed to auto-save file: ' + error)
        }
      }
    }

    const autoSaveTimer = setTimeout(saveFile, 10000) // Auto-save after 10 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [tab?.content, tab?.hasUnsavedChanges, currentWorkspace, markTabDirty])

  // Manual save with Ctrl+S
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (tab && currentWorkspace) {
          try {
            await window.electron.ipcRenderer.invoke('file:write', currentWorkspace.path, tab.filePath, tab.content)
            markTabDirty(tab.id, false)
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

  return (
    <div className="flex flex-1 overflow-hidden">
      {showSourceEditor && (
        <div className="flex-1 border-r border-gray-200 min-w-0">
          <SourceEditor tab={tab} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <RichEditor tab={tab} />
      </div>
    </div>
  )
}

export default Editor