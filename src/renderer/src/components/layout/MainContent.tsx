import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAutoSave } from '../../hooks/useAutoSave'
import { useAutoSync } from '../../hooks/useAutoSync'
import TabBar from '../editor/TabBar'
import Editor from '../editor/Editor'

const MainContent: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore()
  const { settings } = useSettingsStore()

  // Auto-save all tabs
  useAutoSave({
    enabled: settings.autoSaveEnabled,
    delayInSeconds: settings.autoSaveDelayInSeconds
  })

  // Auto-sync all tabs
  useAutoSync({
    enabled: settings.autoSyncEnabled,
    delayInSeconds: settings.autoSyncDelayInSeconds
  })

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  return (
    <div className="flex-1 flex flex-col h-full overflow-x-hidden">
      <TabBar />

      {tabs.length > 0 && activeTab ? (
        <Editor tab={activeTab} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">No files open</p>
            <p className="text-sm">Open a file from the sidebar to start editing</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainContent