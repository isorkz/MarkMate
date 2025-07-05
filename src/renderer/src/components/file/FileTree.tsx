import React from 'react'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'

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
            flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-gray-100
            ${isFocused ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}
          `}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
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
          {isFolder && (
            <span className="w-3 text-gray-400">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!isFolder && <span className="w-3"></span>}

          <span className="text-gray-600">
            {isFolder ? '📁' : '📄'}
          </span>

          <span className="truncate flex-1">{node.name}</span>
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
    <div className="py-2">
      {fileTree.map(node => renderNode(node))}
    </div>
  )
}

export default FileTree