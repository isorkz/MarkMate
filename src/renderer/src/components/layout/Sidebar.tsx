import React from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import WorkspaceSelector from '../workspace/WorkspaceSelector'
import FileTree from '../workspace/FileTree'
import FileSearch from '../workspace/FileSearch'

const Sidebar: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore()

  return (
    <div className="sidebar">
      <div className="p-4 border-b border-gray-200">
        <WorkspaceSelector />
      </div>
      
      {currentWorkspace && (
        <>
          <div className="p-4 border-b border-gray-200">
            <FileSearch />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <FileTree />
          </div>
        </>
      )}
    </div>
  )
}

export default Sidebar