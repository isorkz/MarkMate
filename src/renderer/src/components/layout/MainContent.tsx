import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAutoSave } from '../../hooks/useAutoSave'
import { useAutoSync } from '../../hooks/useAutoSync'
import TabBar from '../editor/TabBar'
import Editor from '../editor/Editor'
import StatusBar from '../editor/StatusBar'

const MainContent: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore()
  const { generalSettings, syncSettings } = useSettingsStore()

  // Auto-save all tabs
  useAutoSave({
    enabled: generalSettings.autoSaveEnabled,
    delayInSeconds: generalSettings.autoSaveDelayInSeconds
  })

  // Auto-sync all tabs
  useAutoSync({
    enabled: syncSettings.autoSyncEnabled,
    delayInSeconds: syncSettings.autoSyncDelayInSeconds
  })

  return (
    <div className="flex-1 flex flex-col h-full overflow-x-hidden relative">
      <TabBar />

      {tabs.length > 0 ? (
        <div className="flex-1 relative">
          {tabs.map(tab => (
            // inset-0: Make the tab fill the entire parent container
            <div key={tab.id} id={`tab-${tab.id}`} className={`absolute inset-0 ${tab.id === activeTabId ? 'flex' : 'hidden'}`} >
              <Editor tab={tab} />
            </div>
          ))}
          
          <div className="absolute bottom-0 right-0 z-10">
            <StatusBar />
          </div>
        </div>
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