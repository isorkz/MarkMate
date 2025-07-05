import React from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import WorkspaceSelector from '../workspace/WorkspaceSelector'
import FileTree from '../file/FileTree'
import FileSearch from '../search/FileSearch'

const Sidebar: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore()

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* macOS traffic light buttons space */}
      <div className="h-8" style={{ WebkitAppRegion: 'drag' }}></div>

      <div className="p-1 border-b border-gray-200">
        <WorkspaceSelector />
      </div>

      {currentWorkspace && (
        <>
          <div className="p-4">
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