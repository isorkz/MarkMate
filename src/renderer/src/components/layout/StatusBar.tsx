import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'

const StatusBar: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore()
  const { currentWorkspace } = useWorkspaceStore()
  
  const activeTab = tabs.find(tab => tab.id === activeTabId)
  
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  return (
    <div className="h-6 bg-blue-600 text-white text-xs flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {currentWorkspace && (
          <span>📁 {currentWorkspace.name}</span>
        )}
        {activeTab && (
          <>
            <span>📄 {activeTab.title}</span>
            <span>Words: {getWordCount(activeTab.content)}</span>
            {activeTab.isDirty && <span className="text-yellow-300">● Modified</span>}
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <span>{tabs.length} files open</span>
        <span>MarkMate v1.0.0</span>
      </div>
    </div>
  )
}

export default StatusBar