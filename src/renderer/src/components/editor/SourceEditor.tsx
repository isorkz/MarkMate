import React, { useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'

const SourceEditor: React.FC = () => {
  const { tabs, activeTabId, updateTabContent, markTabDirty } = useEditorStore()
  const { settings } = useSettingsStore()
  const { currentWorkspace } = useWorkspaceStore()

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const onChange = (value: string) => {
    if (activeTabId) {
      updateTabContent(activeTabId, value)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (!activeTab || !currentWorkspace) return

    const saveFile = async () => {
      if (activeTab.hasUnsavedChanges) {
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
  }, [activeTab?.content, activeTab?.hasUnsavedChanges, currentWorkspace, markTabDirty])

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

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <CodeMirror
        value={activeTab.content}
        height="100%"
        extensions={[markdown()]}
        theme={settings.theme === 'dark' ? oneDark : undefined}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
        }}
        style={{
          fontSize: `${settings.fontSize}px`,
          fontFamily: settings.fontFamily,
        }}
      />
    </div>
  )
}

export default SourceEditor