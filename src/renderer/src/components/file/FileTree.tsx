import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, Star } from 'lucide-react'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import FileContextMenu, { FileNode } from './FileContextMenu'
import InlineInput from './InlineInput'
import { handleNewFile, handleNewFolder, handleRename, handleDelete, loadFileTree, handleOpenFile } from '../../utils/fileOperations'

const FileTree: React.FC = () => {
  const { fileTree, expandedFolders, toggleFolder, setFileTree } = useFileSystemStore()
  const { currentWorkspace, isFavorite, toggleFavorite } = useWorkspaceStore()
  const { openFile, tabs, activeTabId, setActiveTab, closeTab, pinTab } = useEditorStore()
  const [contextMenu, setContextMenu] = useState<{
    node: FileNode
    position: { x: number; y: number }
  } | null>(null)
  const [editingMode, setEditingMode] = useState<{
    mode: 'rename' | 'new-file' | 'new-folder'
    path: string // For rename: the item path, for new: the parent path
    initialValue?: string // For rename: current name
  } | null>(null)

  // Helper function to check if a path contains any open files
  const hasOpenFiles = (nodePath: string, nodeType: string): boolean => {
    if (nodeType === 'file') {
      // For files, check if this exact file is open
      return tabs.some(tab => tab.filePath === nodePath)
    }
    // For folders, check if any open tab's file path starts with this folder path
    return tabs.some(tab => tab.filePath.startsWith(nodePath + '/'))
  }

  const handleNodeClick = async (node: FileNode, isFolder: boolean) => {
    if (isFolder) {
      toggleFolder(node.path)
    } else {
      // Check if file is already open first
      const existingTab = tabs.find(tab => tab.filePath === node.path)
      if (existingTab) {
        // File is already open, just switch to that tab
        setActiveTab(existingTab.id)
      } else {
        // File is not open, read content and open it in preview mode
        if (currentWorkspace) {
          handleOpenFile(currentWorkspace.path, node.path, false, openFile) // false = preview mode (not pinned)
        }
      }
    }
  }

  const handleNodeDoubleClick = async (node: FileNode, isFolder: boolean) => {
    // The handleNodeClick() will be called first.
    if (!isFolder && currentWorkspace) {
      const existingTab = tabs.find(tab => tab.filePath === node.path)
      if (existingTab && !existingTab.isPinned) {
        pinTab(existingTab.id)   // Pin the tab on double-click
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent, node: any) => {
    e.preventDefault()
    e.stopPropagation() // Prevent background context menu from triggering
    setContextMenu({
      node: {
        id: node.id || node.path,
        name: node.name,
        path: node.path,
        type: node.type
      },
      position: { x: e.clientX, y: e.clientY }
    })
  }

  const onNewFile = (parentPath: string) => {
    // Expand the folder if it's not already expanded
    if (parentPath && !expandedFolders.has(parentPath)) {
      toggleFolder(parentPath)
    }
    setEditingMode({ mode: 'new-file', path: parentPath })
    setContextMenu(null)
  }

  const onNewFolder = (parentPath: string) => {
    // Expand the folder if it's not already expanded
    if (parentPath && !expandedFolders.has(parentPath)) {
      toggleFolder(parentPath)
    }
    setEditingMode({ mode: 'new-folder', path: parentPath })
    setContextMenu(null)
  }

  const handleEditConfirm = async (value: string) => {
    if (!currentWorkspace || !editingMode || !value.trim()) return

    if (editingMode.mode === 'rename') {
      await handleRename(currentWorkspace.path, editingMode.path, editingMode.initialValue || '', value)
    } else {
      if (editingMode.mode === 'new-file') {
        await handleNewFile(currentWorkspace.path, editingMode.path, value, setFileTree)
      } else {
        await handleNewFolder(currentWorkspace.path, editingMode.path, value, setFileTree)
      }
    }

    setEditingMode(null)
  }

  const handleEditCancel = () => {
    setEditingMode(null)
  }

  const onOpenInNewTab = async (filePath: string) => {
    if (!currentWorkspace) return
    handleOpenFile(currentWorkspace.path, filePath, true, openFile) // true = pinned tab
  }

  const onRename = (path: string, currentName: string) => {
    setEditingMode({ mode: 'rename', path, initialValue: currentName })
    setContextMenu(null)
  }

  const onDelete = async (filePath: string) => {
    if (!currentWorkspace) return

    // Close any open tabs for the deleted file/folder
    const tabsToClose = tabs.filter(tab =>
      tab.filePath === filePath || tab.filePath.startsWith(filePath + '/')
    )

    tabsToClose.forEach(tab => {
      closeTab(tab.id)
    })

    await handleDelete(currentWorkspace.path, filePath, setFileTree)
  }

  // Load file tree for current workspace on startup
  React.useEffect(() => {
    if (currentWorkspace) {
      loadFileTree(currentWorkspace.path, setFileTree)
        .catch(error => {
          toast.error('Failed to load workspace file tree:', error)
        })
    }
  }, [currentWorkspace, setFileTree])

  const renderNode = (node: any, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isFolder = node.type === 'folder'
    const hasOpenFile = hasOpenFiles(node.path, node.type)
    const isNodeFavorite = isFavorite(node.path)
    // Check if this file is the currently active tab
    const isActiveTab = !isFolder && activeTabId && tabs.find(tab => tab.id === activeTabId)?.filePath === node.path
    // Check if this folder contains the currently active tab
    const hasActiveTab = isFolder && activeTabId && tabs.find(tab => tab.id === activeTabId)?.filePath.startsWith(node.path + '/')

    return (
      <div key={node.path}>
        <div
          className={`
            flex items-center px-2 py-1.5 text-sm cursor-pointer rounded-md transition-colors hover:bg-gray-100
            ${isActiveTab || hasActiveTab ? 'text-blue-500' : 'text-gray-700'}
          `}
          onClick={() => handleNodeClick(node, isFolder)}
          onDoubleClick={() => handleNodeDoubleClick(node, isFolder)}
          onContextMenu={(e) => handleContextMenu(e, node)}
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

            {editingMode && editingMode.mode === 'rename' && editingMode.path === node.path ? (
              <InlineInput
                type={isFolder ? 'folder' : 'file'}
                mode="rename"
                defaultValue={editingMode.initialValue}
                onConfirm={handleEditConfirm}
                onCancel={handleEditCancel}
                inlineOnly
              />
            ) : (
              <span className={`truncate text-sm min-w-0 ${isActiveTab || hasActiveTab || hasOpenFile ? 'font-medium' : ''}`}>
                {node.name}
              </span>
            )}

            {isNodeFavorite && (
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 ml-1 flex-shrink-0" />
            )}
          </div>
        </div>

        {isFolder && isExpanded && (
          <div>
            {node.children && node.children.map((child: any) => renderNode(child, depth + 1))}
            {editingMode && (editingMode.mode === 'new-file' || editingMode.mode === 'new-folder') && editingMode.path === node.path && (
              <InlineInput
                type={editingMode.mode === 'new-folder' ? 'folder' : 'file'}
                mode="create"
                depth={depth + 1}
                onConfirm={handleEditConfirm}
                onCancel={handleEditCancel}
              />
            )}
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

  // Helper function to find all favorite nodes from the file tree
  const findFavoriteNodes = (nodes: any[]): any[] => {
    const favoriteNodes: any[] = []

    const traverse = (nodeList: any[]) => {
      nodeList.forEach(node => {
        if (isFavorite(node.path)) {
          favoriteNodes.push(node)
        }
        if (node.children) {
          traverse(node.children)
        }
      })
    }

    traverse(nodes)
    return favoriteNodes
  }

  const favoriteNodes = findFavoriteNodes(fileTree)

  return (
    <div className="px-2 py-2">
      {/* Favorites Section */}
      {favoriteNodes.length > 0 && (
        <div className="mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
            Favorites
          </h3>
          {favoriteNodes.map((node) =>
            renderNode(node, 0)
          )}
        </div>
      )}

      {/* Regular File Tree */}
      {fileTree.map(node => renderNode(node))}

      {contextMenu && (
        <FileContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onOpenInNewTab={onOpenInNewTab}
          onRename={() => onRename(contextMenu.node.path, contextMenu.node.name)}
          onDelete={onDelete}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite(contextMenu.node.path)}
        />
      )}
    </div>
  )
}

export default FileTree