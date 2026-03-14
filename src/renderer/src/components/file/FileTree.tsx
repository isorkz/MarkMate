import React, { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Star, Plus } from 'lucide-react'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { useFileOrderStore } from '../../stores/fileOrderStore'
import FileContextMenu from './FileContextMenu'
import InlineInput from './InlineInput'
import { handleNewFile, handleNewFolder, handleRename, handleDelete, loadFileTree, handleOpenFile, handleMoveFile } from '../../utils/fileOperations'
import { DndContext, DragEndEvent, DragStartEvent, DragMoveEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { DraggableFileNode, RootDropZone } from './DraggableFileNode'
import type { DropIndicator } from './DraggableFileNode'
import { FileNode } from '@shared/types/file'

const FileTree: React.FC = () => {
  const { fileTree, expandedFolders, toggleFolder, setFileTree } = useFileSystemStore()
  const { currentWorkspace, isFavorite, toggleFavorite } = useWorkspaceStore()
  const { tabs, activeTabId, closeTab, pinTab } = useEditorStore()
  const [contextMenu, setContextMenu] = useState<{
    node: FileNode
    position: { x: number; y: number }
  } | null>(null)
  const [editingMode, setEditingMode] = useState<{
    mode: 'create' | 'rename'
    type: 'file' | 'folder'
    path: string // For rename: the item path, for new: the parent path
    initialValue?: string // For rename: current display name, for new: undefined
  } | null>(null)

  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null)
  const [showCreateMenu, setShowCreateMenu] = useState<{ x: number; y: number } | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null)

  const { setOrder } = useFileOrderStore()

  // Update visual indicator without unnecessary re-renders
  const updateDropIndicator = useCallback((indicator: DropIndicator) => {
    setDropIndicator((prev) => {
      if (prev?.targetPath === indicator?.targetPath && prev?.position === indicator?.position) {
        return prev
      }
      return indicator
    })
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const node = event.active.data.current?.node as FileNode
    if (node) {
      setDraggedNode(node)
    }
  }

  // Helper: get parent path from a file/folder path
  const getParentPath = useCallback((filePath: string): string => {
    const lastSlash = filePath.lastIndexOf('/')
    return lastSlash === -1 ? '' : filePath.substring(0, lastSlash)
  }, [])

  // Helper: get sibling list for a given parent path
  const getSiblings = useCallback((parentPath: string): FileNode[] => {
    if (parentPath === '') return fileTree

    const findFolder = (nodes: FileNode[], target: string): FileNode | null => {
      for (const node of nodes) {
        if (node.path === target && node.type === 'folder') return node
        if (node.children) {
          const found = findFolder(node.children, target)
          if (found) return found
        }
      }
      return null
    }

    return findFolder(fileTree, parentPath)?.children || []
  }, [fileTree])

  // Reorder nodes within the same parent, inserting active before or after target
  const reorderAtPosition = useCallback(
    (parentPath: string, activePath: string, targetPath: string, position: 'before' | 'after') => {
      if (!currentWorkspace) return

      const siblings = getSiblings(parentPath)
      const paths = siblings.map((n) => n.path)

      // Remove active from current position
      const newPaths = paths.filter((p) => p !== activePath)

      // Find target index and insert
      let targetIndex = newPaths.indexOf(targetPath)
      if (targetIndex === -1) return
      if (position === 'after') targetIndex += 1
      newPaths.splice(targetIndex, 0, activePath)

      // Persist the new order
      setOrder(currentWorkspace.path, parentPath, newPaths)

      // Update file tree in state (reorder in-place without reload)
      const reorderInTree = (nodes: FileNode[], targetParent: string): FileNode[] => {
        if (targetParent === '') {
          const nodeMap = new Map(nodes.map((n) => [n.path, n]))
          return newPaths.map((p) => nodeMap.get(p)!).filter(Boolean)
        }
        return nodes.map((node) => {
          if (node.path === targetParent && node.children) {
            const childMap = new Map(node.children.map((n) => [n.path, n]))
            return { ...node, children: newPaths.map((p) => childMap.get(p)!).filter(Boolean) }
          }
          if (node.children) {
            return { ...node, children: reorderInTree(node.children, targetParent) }
          }
          return node
        })
      }

      setFileTree(reorderInTree(fileTree, parentPath))
    },
    [currentWorkspace, fileTree, getSiblings, setFileTree, setOrder]
  )

  // Helper to compute drop zone from pointer position
  const computeDropZone = useCallback(
    (
      pointerY: number,
      overRect: { top: number; height: number },
      overNode: FileNode
    ): 'before' | 'after' | 'inside' => {
      const relativeY = (pointerY - overRect.top) / overRect.height
      if (overNode.type === 'folder') {
        if (relativeY < 0.3) return 'before'
        if (relativeY > 0.7) return 'after'
        return 'inside'
      }
      return relativeY < 0.5 ? 'before' : 'after'
    },
    []
  )

  // Update visual indicators on every pointer move during drag
  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { over, activatorEvent, delta } = event
      if (!over || !draggedNode) {
        updateDropIndicator(null)
        return
      }

      const overId = String(over.id)
      if (overId === 'root') {
        updateDropIndicator(null)
        return
      }

      const overNode = over.data.current?.node as FileNode | undefined
      if (!overNode || overNode.path === draggedNode.path) {
        updateDropIndicator(null)
        return
      }

      const pointerY = (activatorEvent as PointerEvent).clientY + delta.y
      const rect = over.rect
      if (!rect || !rect.height) {
        updateDropIndicator(
          overNode.type === 'folder'
            ? { targetPath: overNode.path, position: 'inside' }
            : { targetPath: overNode.path, position: 'after' }
        )
        return
      }

      const position = computeDropZone(pointerY, rect, overNode)
      updateDropIndicator({ targetPath: overNode.path, position })
    },
    [draggedNode, updateDropIndicator, computeDropZone]
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, activatorEvent, delta } = event
    const sourceNode = draggedNode

    setDraggedNode(null)
    updateDropIndicator(null)

    if (!over || !currentWorkspace || !sourceNode) return

    const overId = String(over.id)

    // Case 1: Dropped on root → move to workspace root
    if (overId === 'root') {
      await handleMoveFile(currentWorkspace.path, sourceNode, '', setFileTree)
      return
    }

    const overNode = over.data.current?.node as FileNode | undefined
    if (!overNode) return

    // Compute the drop zone directly from the event — no stale state dependency
    const pointerY = (activatorEvent as PointerEvent).clientY + delta.y
    const rect = over.rect
    let action: 'before' | 'after' | 'inside' = overNode.type === 'folder' ? 'inside' : 'after'
    if (rect && rect.height) {
      action = computeDropZone(pointerY, rect, overNode)
    }

    // Case 2: Drop into folder (pointer in center zone)
    if (action === 'inside' && overNode.type === 'folder') {
      await handleMoveFile(currentWorkspace.path, sourceNode, overNode.path, setFileTree)
      return
    }

    // Case 3: Reorder (before/after)
    const activeParent = getParentPath(sourceNode.path)
    const overParent = getParentPath(overNode.path)

    if (activeParent === overParent) {
      reorderAtPosition(activeParent, sourceNode.path, overNode.path, action as 'before' | 'after')
    } else {
      // Different parent → move to the over node's parent folder
      await handleMoveFile(currentWorkspace.path, sourceNode, overParent, setFileTree)
    }
  }

  const handleNodeClick = async (node: FileNode, isFolder: boolean) => {
    if (isFolder) {
      toggleFolder(node.path)
    } else {
      if (currentWorkspace) {
        handleOpenFile(currentWorkspace.path, node.path, false) // false = preview mode (not pinned)
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

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    e.stopPropagation() // Prevent background context menu from triggering
    setContextMenu({
      node: {
        id: node.id || node.path,
        name: node.name,
        path: node.path,
        type: node.type,
        lastModified: node.lastModified
      },
      position: { x: e.clientX, y: e.clientY }
    })
  }

  const onNewFile = (parentPath: string) => {
    // Expand the folder if it's not already expanded
    if (parentPath && !expandedFolders.has(parentPath)) {
      toggleFolder(parentPath)
    }
    setEditingMode({ mode: 'create', type: 'file', path: parentPath })
    setContextMenu(null)
    setShowCreateMenu(null)
  }

  const onNewFolder = (parentPath: string) => {
    // Expand the folder if it's not already expanded
    if (parentPath && !expandedFolders.has(parentPath)) {
      toggleFolder(parentPath)
    }
    setEditingMode({ mode: 'create', type: 'folder', path: parentPath })
    setContextMenu(null)
    setShowCreateMenu(null)
  }

  const handleEditConfirm = async (value: string) => {
    if (!currentWorkspace || !editingMode || !value.trim()) return

    if (editingMode.mode === 'rename') {
      await handleRename(currentWorkspace.path, editingMode.path, editingMode.initialValue || '', value, editingMode.type === 'folder')
    } else if (editingMode.mode === 'create') {
      if (editingMode.type === 'file') {
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
    handleOpenFile(currentWorkspace.path, filePath, true) // true = pinned tab
  }

  const onRename = (path: string, currentName: string, isFolder: boolean) => {
    setEditingMode({ mode: 'rename', type: isFolder ? 'folder' : 'file', path, initialValue: currentName })
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

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isFolder = node.type === 'folder'
    const isNodeFavorite = isFavorite(node.path)
    // Check if this file is the currently active tab
    const isActiveTab = !isFolder && activeTabId && tabs.find(tab => tab.id === activeTabId)?.filePath === node.path
    // Check if this folder contains the currently active tab
    const hasActiveTab = isFolder && activeTabId && tabs.find(tab => tab.id === activeTabId)?.filePath.startsWith(node.path + '/')
    const tab = tabs.find(tab => tab.filePath === node.path)
    const isDraggedItem = draggedNode?.path === node.path
    const isEditing = editingMode != null || tab?.hasUnsavedChanges

    const nodeContent = (
      <div
        className={`
          flex items-center px-2 py-1.5 text-sm cursor-pointer rounded-md transition-colors hover:bg-gray-100
          ${isActiveTab || hasActiveTab ? 'text-blue-500' : 'text-gray-900'}
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
          <span className="text-gray-700">
            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )
            ) : (
              <FileText className="w-4 h-4 flex-shrink-0" />
            )}
          </span>

          {editingMode && editingMode.mode.startsWith('rename') && editingMode.path === node.path ? (
            <InlineInput
              type={isFolder ? 'folder' : 'file'}
              mode="rename"
              defaultValue={editingMode.initialValue}
              onConfirm={handleEditConfirm}
              onCancel={handleEditCancel}
              inlineOnly
            />
          ) : (
            <span className={'truncate text-sm min-w-0'}>
              {node.name}
            </span>
          )}

          {isNodeFavorite && (
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 ml-1 flex-shrink-0" />
          )}
        </div>
      </div>
    )

    return (
      <div key={node.path}>
        <DraggableFileNode node={node} isDraggedItem={isDraggedItem} isEditing={isEditing} dropIndicator={dropIndicator}>
          {nodeContent}
        </DraggableFileNode>

        {isFolder && isExpanded && (
          <div>
            {node.children && node.children.map((child: FileNode) => renderNode(child, depth + 1))}

            {/* Folder level create input */}
            {editingMode && editingMode.mode === 'create' && editingMode.path === node.path && (
              <InlineInput
                type={editingMode.type}
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
  const findFavoriteNodes = (nodes: FileNode[]): FileNode[] => {
    const favoriteNodes: FileNode[] = []

    const traverse = (nodeList: FileNode[]) => {
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
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Workspace
          </h3>
          <div className="relative">
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setShowCreateMenu({
                  x: rect.right, // Adjust position to show menu on the right side of button
                  y: rect.bottom
                })
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <Plus className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <RootDropZone>
            {/* Root level create input */}
            {editingMode && editingMode.mode === 'create' && editingMode.path === '' && (
              <InlineInput
                type={editingMode.type}
                mode="create"
                depth={0}
                onConfirm={handleEditConfirm}
                onCancel={handleEditCancel}
              />
            )}
            {fileTree.map(node => renderNode(node))}
          </RootDropZone>

          <DragOverlay dropAnimation={null}>
            {draggedNode && (
              <div className="bg-white shadow-lg rounded-md border border-blue-200 px-3 py-1.5 text-sm text-gray-700 opacity-90">
                {draggedNode.type === 'folder' ? (
                  <Folder className="w-4 h-4 inline mr-1.5" />
                ) : (
                  <FileText className="w-4 h-4 inline mr-1.5" />
                )}
                {draggedNode.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {contextMenu && (
        <FileContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onOpenInNewTab={onOpenInNewTab}
          onRename={() => onRename(contextMenu.node.path, contextMenu.node.name, contextMenu.node.type === 'folder')}
          onDelete={onDelete}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite(contextMenu.node.path)}
        />
      )}

      {showCreateMenu && (
        <FileContextMenu
          node={{ id: 'root', name: 'root', path: '', type: 'folder', lastModified: new Date() }}
          position={showCreateMenu}
          onClose={() => setShowCreateMenu(null)}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onOpenInNewTab={() => { }}
          onRename={() => { }}
          onDelete={() => { }}
          onToggleFavorite={() => { }}
          isFavorite={false}
        />
      )}
    </div>
  )
}

export default FileTree