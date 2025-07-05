import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import TitleBar from './TitleBar'
import TabBar from '../editor/TabBar'
import SourceEditor from '../editor/SourceEditor'
import RichEditor from '../editor/RichEditor'

const MainContent: React.FC = () => {
  const { showSourceEditor, tabs } = useEditorStore()

  return (
    <div className="flex-1 flex flex-col h-full overflow-x-hidden">
      {/* <TitleBar /> */}
      <TabBar />

      {tabs.length > 0 ? (
        <div className="flex flex-1 overflow-hidden">
          {showSourceEditor && (
            <div className="flex-1 border-r border-gray-200 min-w-0">
              <SourceEditor />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <RichEditor />
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