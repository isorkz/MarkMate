import React from 'react'
import {
  FileText,
  Folder,
  Edit3,
  Trash2,
  Star,
  ExternalLink
} from 'lucide-react'
import { FileNode } from '@shared/types/file';

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

  const isRootNode = node.id === 'root'

  const menuItems = [
    ...(node.type === 'file' ? [{
      label: 'Open in New Tab',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => {
        onOpenInNewTab(node.path)
        onClose()
      }
    }] : []),
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
    ...(!isRootNode ? [{
      label: 'Rename',
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => {
        onRename()
        onClose()
      }
    }] : []),
    ...(!isRootNode ? [{
      label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />,
      onClick: () => {
        onToggleFavorite(node.path)
        onClose()
      }
    }] : []),
    ...(!isRootNode ? [{
      label: '',
      icon: null,
      onClick: () => { },
      className: ''
    }] : []),
    ...(!isRootNode ? [{
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        const confirmed = window.confirm(
          `Are you sure you want to delete "${node.name}"?${node.type === 'folder' ? ' This will delete all contents.' : ''}`
        )
        if (confirmed) {
          onDelete(node.path)
          onClose()
        }
      }
    }] : [])
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
          item.label === '' ? (
            <div
              key={index}
              className="mx-3 border-t border-gray-200 my-1"
            />
          ) : (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 ${item.className || ''}`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        ))}
      </div>
    </>
  )
}

export default FileContextMenu