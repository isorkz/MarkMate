import React, { useState } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import WorkspaceSelector from '../workspace/WorkspaceSelector'
import FileTree from '../file/FileTree'
import FileSearch from '../search/FileSearch'
import InlineInput from '../file/InlineInput'
import { handleNewFile, handleNewFolder } from '../../utils/fileOperations'

const Sidebar: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore()
  const { setFileTree } = useFileSystemStore()
  // State to track if we are creating a file or folder
  const [creatingWorkspaceItem, setCreatingWorkspaceItem] = useState<'file' | 'folder' | null>(null)

  const handleCreateWorkspaceItem = async (name: string) => {
    if (!currentWorkspace || !creatingWorkspaceItem || !name.trim()) return

    if (creatingWorkspaceItem === 'file') {
      await handleNewFile(currentWorkspace.path, '', name, setFileTree)
    } else {
      await handleNewFolder(currentWorkspace.path, '', name, setFileTree)
    }

    setCreatingWorkspaceItem(null)
  }

  const handleCancelCreateWorkspaceItem = () => {
    setCreatingWorkspaceItem(null)
  }

  return (
    <div className="w-sidebar bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* macOS traffic light buttons space */}
      <div className="h-8"></div>

      <div className="p-1 border-b border-gray-200">
        <WorkspaceSelector
          onCreateFile={() => setCreatingWorkspaceItem('file')}
          onCreateFolder={() => setCreatingWorkspaceItem('folder')}
        />
      </div>

      {currentWorkspace && (
        <>
          <div className="p-4 relative">
            <FileSearch />
          </div>

          <div className="flex-1 overflow-y-auto">
            {creatingWorkspaceItem && (
              <InlineInput
                type={creatingWorkspaceItem}
                mode="create"
                onConfirm={handleCreateWorkspaceItem}
                onCancel={handleCancelCreateWorkspaceItem}
              />
            )}

            <FileTree />
          </div>
        </>
      )}
    </div>
  )
}

export default Sidebar