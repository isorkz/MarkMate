import React, { useState, useCallback, useEffect } from 'react'

interface ResizeHandleProps {
  direction: 'vertical' | 'horizontal'
  onResize: (delta: number) => void
  className?: string
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction,
  onResize,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setStartPos(direction === 'vertical' ? e.clientX : e.clientY)
  }, [direction])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const currentPos = direction === 'vertical' ? e.clientX : e.clientY
    const delta = currentPos - startPos

    onResize(delta)
    setStartPos(currentPos)
  }, [isDragging, startPos, direction, onResize])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    return () => {
      // Cleanup function for when isDragging is false
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction])

  return (
    <div
      className={`
        ${direction === 'vertical'
          ? 'w-0.5 h-full cursor-col-resize'
          : 'h-0.5 w-full cursor-row-resize'
        }
        transition-colors duration-150 flex-shrink-0
        ${className}
      `}
      onMouseDown={handleMouseDown}
      style={{ WebkitAppRegion: 'no-drag' }}
    />
  )
}

export default ResizeHandle