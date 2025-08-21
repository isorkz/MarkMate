import React from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { FileNode } from '@renderer/types'

interface DraggableFileNodeProps {
  node: FileNode
  children: React.ReactNode
  isDraggedItem?: boolean
  isEditing?: boolean
}

export const DraggableFileNode: React.FC<DraggableFileNodeProps> = ({ 
  node, 
  children, 
  isDraggedItem = false,
  isEditing = false
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.path,
    data: { node },
    disabled: isEditing
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditing ? {} : listeners)}
      {...(isEditing ? {} : attributes)}
      className={`${!isEditing && isDragging ? 'cursor-grabbing' : !isEditing ? 'cursor-grab' : ''} ${isDraggedItem ? 'opacity-50' : ''}`}
    >
      {children}
    </div>
  )
}

interface DroppableFolderProps {
  node: FileNode
  children: React.ReactNode
  isOver?: boolean
}

export const DroppableFolder: React.FC<DroppableFolderProps> = ({ 
  node, 
  children 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: node.path,
    data: { node }
  })

  return (
    <div
      ref={setNodeRef}
      className={isOver && node.type === 'folder' ? 'bg-blue-100 rounded-md' : ''}
    >
      {children}
    </div>
  )
}

interface RootDropZoneProps {
  children: React.ReactNode
}

export const RootDropZone: React.FC<RootDropZoneProps> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root',
    data: { node: { type: 'folder', path: '' } }
  })

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'bg-blue-50 rounded-md' : ''}
    >
      {children}
    </div>
  )
}