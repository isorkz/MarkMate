import React from 'react'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { Folder, FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react'

const FileTree: React.FC = () => {
  const { fileTree, expandedFolders, focusedFile, toggleFolder, setFocusedFile, setFileTree } = useFileSystemStore()
  const { currentWorkspace } = useWorkspaceStore()
  const { openFile } = useEditorStore()

  // Load file tree for current workspace on startup
  React.useEffect(() => {
    if (currentWorkspace && fileTree.length === 0) {
      window.electron.ipcRenderer
        .invoke('workspace:get-file-tree', currentWorkspace.path)
        .then(tree => setFileTree(tree))
        .catch(error => {
          console.error('Failed to load workspace file tree:', error)
        })
    }
  }, [currentWorkspace, fileTree.length, setFileTree])

  const renderNode = (node: any, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isFocused = focusedFile === node.path
    const isFolder = node.type === 'folder'

    return (
      <div key={node.path}>
        <div
          className={`
            flex items-center px-2 py-1 text-sm cursor-pointer rounded-md transition-colors select-none
            ${isFocused ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
          `}
          onClick={async () => {
            if (isFolder) {
              toggleFolder(node.path)
            } else {
              setFocusedFile(node.path)
              // Open file in editor
              if (currentWorkspace) {
                try {
                  const content = await window.electron.ipcRenderer.invoke('file:read', currentWorkspace.path, node.path)
                  openFile(node.path, content)
                } catch (error) {
                  console.error('Failed to open file:', error)
                }
              }
            }
          }}
        >
          <div 
            className="w-4 flex items-center justify-center mr-1 flex-shrink-0"
            style={{ marginLeft: `${depth * 16}px` }}
          >
            {isFolder && (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )
            )}
          </div>

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )
            ) : (
              <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            <span className="truncate text-sm min-w-0">{node.name}</span>
          </div>
        </div>

        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map((child: any) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (fileTree.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No files in workspace
      </div>
    )
  }

  return (
    <div className="px-2 py-2">
      {fileTree.map(node => renderNode(node))}
    </div>
  )
}

export default FileTree