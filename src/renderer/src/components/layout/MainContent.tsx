import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import TitleBar from './TitleBar'
import TabBar from '../editor/TabBar'
import Editor from '../editor/Editor'

const MainContent: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore()

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  return (
    <div className="flex-1 flex flex-col h-full overflow-x-hidden">
      {/* <TitleBar /> */}
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