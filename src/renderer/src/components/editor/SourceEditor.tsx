import React, { useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'

const SourceEditor: React.FC = () => {
  const { tabs, activeTabId, updateTabContent, markTabDirty } = useEditorStore()
  const { settings } = useSettingsStore()
  const { currentWorkspace } = useWorkspaceStore()
  
  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const handleEditorChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (!activeTab || !currentWorkspace) return

    const saveFile = async () => {
      if (activeTab.isDirty) {
        try {
          await window.electron.ipcRenderer.invoke('file:write', currentWorkspace.path, activeTab.filePath, activeTab.content)
          markTabDirty(activeTab.id, false)
        } catch (error) {
          console.error('Failed to save file:', error)
        }
      }
    }

    const autoSaveTimer = setTimeout(saveFile, 2000) // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(autoSaveTimer)
  }, [activeTab?.content, activeTab?.isDirty, currentWorkspace, markTabDirty])

  // Manual save with Ctrl+S
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (activeTab && currentWorkspace) {
          try {
            await window.electron.ipcRenderer.invoke('file:write', currentWorkspace.path, activeTab.filePath, activeTab.content)
            markTabDirty(activeTab.id, false)
          } catch (error) {
            console.error('Failed to save file:', error)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, currentWorkspace, markTabDirty])

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No file selected
      </div>
    )
  }

  const theme = settings.theme === 'dark' ? 'vs-dark' : 'light'

  return (
    <div className="h-full flex flex-col">
      <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3 text-sm text-gray-600">
        Source Editor
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          language="markdown"
          theme={theme}
          value={activeTab.content}
          onChange={handleEditorChange}
          options={{
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            wordWrap: 'on',
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}

export default SourceEditor