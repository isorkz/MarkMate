import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import TabManager from '../editor/TabManager'
import SourceEditor from '../editor/SourceEditor'
import RichEditor from '../editor/RichEditor'
import TOCPanel from '../editor/TOCPanel'

const MainContent: React.FC = () => {
  const { showTOC, showSourceEditor, tabs } = useEditorStore()

  return (
    <div className="editor-container">
      <TabManager />
      
      {tabs.length > 0 ? (
        <div className="flex flex-1 overflow-hidden">
          {showSourceEditor && (
            <div className="w-1/2 border-r border-gray-200">
              <SourceEditor />
            </div>
          )}
          
          <div className={`flex-1 ${showSourceEditor ? 'w-1/2' : 'w-full'}`}>
            <RichEditor />
          </div>
          
          {showTOC && (
            <div className="w-64 border-l border-gray-200">
              <TOCPanel />
            </div>
          )}
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