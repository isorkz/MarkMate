import React from 'react'
import { FileText, Folder } from 'lucide-react'

interface InlineInputProps {
  type: 'file' | 'folder'
  mode: 'create' | 'rename'
  onConfirm: (name: string) => void
  onCancel: () => void
  defaultValue?: string
  depth?: number
  inlineOnly?: boolean // For rename mode - just the input without wrapper
}

const InlineInput: React.FC<InlineInputProps> = ({
  type,
  mode,
  onConfirm,
  onCancel,
  defaultValue = '',
  depth = 0,
  inlineOnly = false
}) => {
  const placeholder = mode === 'create' ? `New ${type} name` : undefined

  const inputElement = (
    <input
      type="text"
      defaultValue={defaultValue}
      className="bg-blue-50 border border-blue-300 rounded px-1 py-0.5 text-sm min-w-0 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder={placeholder}
      autoFocus
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onConfirm(e.currentTarget.value)
        } else if (e.key === 'Escape') {
          onCancel()
        }
      }}
      onBlur={(e) => {
        if (e.target.value.trim()) {
          onConfirm(e.target.value)
        } else {
          onCancel()
        }
      }}
    />
  )

  if (inlineOnly) {
    return inputElement
  }

  return (
    <div className="flex items-center px-2 py-1.5 text-sm">
      <div
        className="w-4 flex items-center justify-center mr-1 flex-shrink-0"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {/* No chevron for input */}
      </div>
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {type === 'folder' ? (
          <Folder className="w-4 h-4 flex-shrink-0" />
        ) : (
          <FileText className="w-4 h-4 flex-shrink-0" />
        )}
        {inputElement}
      </div>
    </div>
  )
}

export default InlineInput