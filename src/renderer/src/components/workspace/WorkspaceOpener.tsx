import React from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import { loadFileTree } from '@renderer/utils/fileOperations'
import { adapters } from '../../adapters'

const WorkspaceOpener: React.FC = () => {
  const { addWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const { setFileTree } = useFileSystemStore()

  const handleOpenWorkspace = async () => {
    try {
      const workspace = await adapters.workspaceAdapter.openDialog()
      if (workspace) {
        addWorkspace(workspace)
        setCurrentWorkspace(workspace)
        await loadFileTree(workspace.path, setFileTree)
      }
    } catch (error) {
      console.error('Failed to open workspace:', error)
    }
  }

  return (
    <div className="text-center">
      <p className="text-gray-600 mb-4">Select a workspace to get started</p>
      <button
        onClick={handleOpenWorkspace}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Open Workspace
      </button>
    </div>
  )
}

export default WorkspaceOpener