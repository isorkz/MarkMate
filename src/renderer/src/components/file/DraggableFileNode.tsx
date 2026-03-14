import React, { useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { FileNode } from '@shared/types/file'

export type DropIndicator = {
  targetPath: string
  position: 'before' | 'after' | 'inside'
} | null

interface DraggableFileNodeProps {
  node: FileNode
  children: React.ReactNode
  isDraggedItem?: boolean
  isEditing?: boolean
  dropIndicator?: DropIndicator
}

export const DraggableFileNode: React.FC<DraggableFileNodeProps> = ({
  node,
  children,
  isDraggedItem = false,
  isEditing = false,
  dropIndicator
}) => {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: node.path,
    data: { node },
    disabled: isEditing
  })

  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop:${node.path}`,
    data: { node },
    disabled: isDragging
  })

  const combinedRef = useCallback(
    (el: HTMLElement | null) => {
      setDragRef(el)
      setDropRef(el)
    },
    [setDragRef, setDropRef]
  )

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : ('auto' as const)
      }
    : undefined

  const isTarget = dropIndicator?.targetPath === node.path
  const showBefore = isTarget && dropIndicator?.position === 'before'
  const showAfter = isTarget && dropIndicator?.position === 'after'
  const showInside = isTarget && dropIndicator?.position === 'inside'

  return (
    <div
      ref={combinedRef}
      style={style}
      {...(isEditing ? {} : listeners)}
      {...(isEditing ? {} : attributes)}
      className={`relative ${showInside ? 'bg-blue-100 rounded-md' : ''} ${!isEditing && isDragging ? 'cursor-grabbing' : !isEditing ? 'cursor-grab' : ''} ${isDraggedItem ? 'opacity-50' : ''}`}
    >
      {showBefore && (
        <div className="absolute top-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full -translate-y-px z-10" />
      )}
      {children}
      {showAfter && (
        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full translate-y-px z-10" />
      )}
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