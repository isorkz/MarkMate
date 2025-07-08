import React, { useState } from 'react'
import { 
  FileText, 
  Folder, 
  Edit3, 
  Trash2, 
  Star,
  ExternalLink
} from 'lucide-react'

export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
}

interface FileContextMenuProps {
  node: FileNode
  position: { x: number; y: number }
  onClose: () => void
  onNewFile: (parentPath: string) => void
  onNewFolder: (parentPath: string) => void
  onOpenInNewTab: (filePath: string) => void
  onRename: () => void
  onDelete: (path: string) => void
  onToggleFavorite: (path: string) => void
  isFavorite: boolean
}

const FileContextMenu: React.FC<FileContextMenuProps> = ({
  node,
  position,
  onClose,
  onNewFile,
  onNewFolder,
  onOpenInNewTab,
  onRename,
  onDelete,
  onToggleFavorite,
  isFavorite
}) => {

  const menuItems = [
    {
      label: 'New File',
      icon: <FileText className="w-4 h-4" />,
      onClick: () => {
        const parentPath = node.type === 'folder' ? node.path : node.path.split('/').slice(0, -1).join('/')
        onNewFile(parentPath)
        onClose()
      }
    },
    {
      label: 'New Folder',
      icon: <Folder className="w-4 h-4" />,
      onClick: () => {
        const parentPath = node.type === 'folder' ? node.path : node.path.split('/').slice(0, -1).join('/')
        onNewFolder(parentPath)
        onClose()
      }
    },
    ...(node.type === 'file' ? [{
      label: 'Open in New Tab',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => {
        onOpenInNewTab(node.path)
        onClose()
      }
    }] : []),
    {
      label: 'Rename',
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => {
        onRename()
        onClose()
      }
    },
    {
      label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />,
      onClick: () => {
        onToggleFavorite(node.path)
        onClose()
      }
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: () => {
        const confirmed = window.confirm(
          `Are you sure you want to delete "${node.name}"?${node.type === 'folder' ? ' This will delete all contents.' : ''}`
        )
        if (confirmed) {
          onDelete(node.path)
          onClose()
        }
      },
      className: 'text-red-500 hover:bg-red-50'
    }
  ]

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 ${item.className || ''}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

export default FileContextMenu