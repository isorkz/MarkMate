import React, { useState } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useFileSystemStore } from '../../stores/fileSystemStore'

const WorkspaceSelector: React.FC = () => {
  const { workspaces, currentWorkspace, setCurrentWorkspace, addWorkspace } = useWorkspaceStore()
  const { setFileTree } = useFileSystemStore()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleWorkspaceSelect = async (workspace: any) => {
    setCurrentWorkspace(workspace)
    setShowDropdown(false)

    // Load file tree for the selected workspace
    try {
      const fileTree = await window.electron.ipcRenderer.invoke('workspace:get-file-tree', workspace.path)
      setFileTree(fileTree)
    } catch (error) {
      console.error('Failed to load workspace file tree:', error)
    }
  }

  const handleNewWorkspace = async () => {
    try {
      const workspace = await window.electron.ipcRenderer.invoke('workspace:open-dialog')
      if (workspace) {
        addWorkspace(workspace)
        await handleWorkspaceSelect(workspace)
      }
    } catch (error) {
      console.error('Failed to open workspace:', error)
    }
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center justify-between p-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-600">📁</span>
          <span className="truncate">
            {currentWorkspace ? currentWorkspace.name : 'No Workspace'}
          </span>
        </div>
        <span className="text-gray-400">▼</span>
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10">
          <div className="py-1">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSelect(workspace)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-gray-600">📁</span>
                <span className="truncate">{workspace.name}</span>
                {workspace.id === currentWorkspace?.id && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            ))}

            {workspaces.length > 0 && <hr className="my-1" />}

            <button
              onClick={handleNewWorkspace}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-green-600"
            >
              <span>➕</span>
              <span>New Workspace...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspaceSelector