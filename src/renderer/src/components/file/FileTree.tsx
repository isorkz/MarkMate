import React from 'react'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { Folder, FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react'

const FileTree: React.FC = () => {
  const { fileTree, expandedFolders, toggleFolder, setFileTree } = useFileSystemStore()
  const { currentWorkspace } = useWorkspaceStore()
  const { openFile, tabs, setActiveTab } = useEditorStore()

  // Helper function to check if a path contains any open files
  const hasOpenFiles = (nodePath: string, nodeType: string): boolean => {
    if (nodeType === 'file') {
      // For files, check if this exact file is open
      return tabs.some(tab => tab.filePath === nodePath)
    }
    // For folders, check if any open tab's file path starts with this folder path
    return tabs.some(tab => tab.filePath.startsWith(nodePath + '/'))
  }

  const handleNodeClick = async (node: any, isFolder: boolean) => {
    if (isFolder) {
      toggleFolder(node.path)
    } else {
      // Check if file is already open first
      const existingTab = tabs.find(tab => tab.filePath === node.path)
      if (existingTab) {
        // File is already open, just switch to that tab
        setActiveTab(existingTab.id)
      } else {
        // File is not open, read content and open it
        if (currentWorkspace) {
          try {
            const content = await window.electron.ipcRenderer.invoke('file:read', currentWorkspace.path, node.path)
            openFile(node.path, content)
          } catch (error) {
            console.error('Failed to open file:', error)
          }
        }
      }
    }
  }

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
    const isFolder = node.type === 'folder'
    const hasOpenFile = hasOpenFiles(node.path, node.type)
    // Check if this file is the currently active tab
    const isActiveTab = !isFolder && tabs.find(tab => tab.isActive)?.filePath === node.path
    // Check if this folder contains the currently active tab
    const hasActiveTab = isFolder && tabs.some(tab => tab.isActive && tab.filePath.startsWith(node.path + '/'))

    return (
      <div key={node.path}>
        <div
          className={`
            flex items-center px-2 py-1.5 text-sm cursor-pointer rounded-md transition-colors hover:bg-gray-100
            ${isActiveTab || hasActiveTab ? 'text-orange-600' :
              hasOpenFile ? 'text-blue-600' : 'text-gray-700'}
          `}
          onClick={() => handleNodeClick(node, isFolder)}
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
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )
            ) : (
              <File className="w-4 h-4 flex-shrink-0" />
            )}
            <span className={`truncate text-sm min-w-0 ${isActiveTab || hasActiveTab || hasOpenFile ? 'font-medium' : ''}`}>
              {node.name}
            </span>
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