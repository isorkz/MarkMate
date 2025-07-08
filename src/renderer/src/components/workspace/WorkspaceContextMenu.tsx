import React from 'react'
import { FileText, Folder } from 'lucide-react'

interface WorkspaceContextMenuProps {
  position: { x: number; y: number }
  onClose: () => void
  onNewFile: () => void
  onNewFolder: () => void
}

const WorkspaceContextMenu: React.FC<WorkspaceContextMenuProps> = ({
  position,
  onClose,
  onNewFile,
  onNewFolder
}) => {
  const menuItems = [
    {
      label: 'New File',
      icon: <FileText className="w-4 h-4" />,
      onClick: () => {
        onNewFile()
        onClose()
      }
    },
    {
      label: 'New Folder',
      icon: <Folder className="w-4 h-4" />,
      onClick: () => {
        onNewFolder()
        onClose()
      }
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
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

export default WorkspaceContextMenu