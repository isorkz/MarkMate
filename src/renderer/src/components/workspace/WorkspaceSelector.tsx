import React, { useState } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import { Folder, ChevronDown, Check, Plus } from 'lucide-react'
import { loadFileTree } from '../../utils/fileOperations'
import WorkspaceContextMenu from './WorkspaceContextMenu'
import { adapters } from '../../adapters'

interface WorkspaceSelectorProps {
  onCreateFile: () => void
  onCreateFolder: () => void
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ onCreateFile, onCreateFolder }) => {
  const { workspaces, currentWorkspace, setCurrentWorkspace, addWorkspace } = useWorkspaceStore()
  const { setFileTree } = useFileSystemStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number }
  } | null>(null)

  const handleWorkspaceSelect = async (workspace: any) => {
    setCurrentWorkspace(workspace)
    setShowDropdown(false)

    // Load file tree for the selected workspace
    await loadFileTree(workspace.path, setFileTree)
  }

  const handleNewWorkspace = async () => {
    try {
      const workspace = await adapters.workspaceAdapter.openDialog()
      if (workspace) {
        addWorkspace(workspace)
        await handleWorkspaceSelect(workspace)
      }
    } catch (error) {
      console.error('Failed to open workspace:', error)
    }
    setShowDropdown(false)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!currentWorkspace) return
    e.preventDefault()
    setContextMenu({
      position: { x: e.clientX, y: e.clientY }
    })
  }

  const handleNewFileWrapper = () => {
    onCreateFile()
    setContextMenu(null)
  }

  const handleNewFolderWrapper = () => {
    onCreateFolder()
    setContextMenu(null)
  }

  return (
    // tabIndex={-1} - Makes the div focusable so it can receive blur events
    <div className="relative" onBlur={(e) => {
      // Only close if focus is moving outside the entire component
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setShowDropdown(false)
      }
    }} tabIndex={-1}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        onContextMenu={handleContextMenu}
        className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Folder className="w-4 h-4 text-gray-500" />
          <span className="font-medium truncate">
            {currentWorkspace ? currentWorkspace.name : 'Select workspace'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-20 py-1">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleWorkspaceSelect(workspace)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Folder className="w-4 h-4 text-gray-500" />
              <span className="truncate text-gray-700">{workspace.name}</span>
              {workspace.id === currentWorkspace?.id && (
                <Check className="ml-auto w-3 h-3 text-blue-600" />
              )}
            </button>
          ))}

          {workspaces.length > 0 && <div className="border-t border-gray-100 my-1" />}

          <button
            onClick={handleNewWorkspace}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600"
          >
            <Plus className="w-4 h-4 text-gray-400" />
            <span>Add workspace</span>
          </button>
        </div>
      )}

      {contextMenu && (
        <WorkspaceContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onNewFile={handleNewFileWrapper}
          onNewFolder={handleNewFolderWrapper}
        />
      )}
    </div>
  )
}

export default WorkspaceSelector