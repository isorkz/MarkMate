import React, { useEffect, useRef, useState } from 'react'
import { Search, X, File } from 'lucide-react'
import { useFullSearch } from '../../hooks/useFullSearch'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { handleOpenFile } from '../../utils/fileOperations'

interface FullSearchProps {
  isOpen: boolean
  onClose: () => void
}

const FullSearch: React.FC<FullSearchProps> = ({ isOpen, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { searchTerm, setSearchTerm, clearSearch, searchResults } = useFullSearch()
  const { currentWorkspace } = useWorkspaceStore()

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (searchResults[selectedIndex]) {
            handleSelectFile(searchResults[selectedIndex])
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, searchResults, selectedIndex, onClose])

  const handleSelectFile = async (file: any) => {
    if (currentWorkspace) {
      await handleOpenFile(currentWorkspace.path, file.path, false)
      onClose()
      clearSearch()
    }
  }

  const getMatchPreview = (file: any, searchTerm: string) => {
    if (!file.content || !searchTerm) return null

    const content = file.content.toLowerCase()
    const term = searchTerm.toLowerCase()
    const index = content.indexOf(term)

    if (index === -1) return null

    const start = Math.max(0, index - 30)
    const end = Math.min(content.length, index + term.length + 30)
    const preview = file.content.substring(start, end)

    return `...${preview}...`
  }

  const handleClose = () => {
    onClose()
    clearSearch()
  }

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm) return text

    const regex = new RegExp(`(${searchTerm})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : part
    )
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-start justify-center pt-20 z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-96 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="flex-1 text-lg outline-none"
          />
          <button
            onClick={handleClose}
            className="ml-3 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {searchTerm && searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No files found for "{searchTerm}"
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((file, index) => (
                <div
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                    ? 'bg-blue-50 border-r-2 border-blue-500'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {highlightMatch(file.name, searchTerm)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {highlightMatch(file.path, searchTerm)}
                      {file.contentMatchCount > 0 && (
                        <span className="text-blue-500 ml-2">
                          • {file.contentMatchCount} match{file.contentMatchCount > 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>
                    {getMatchPreview(file, searchTerm) && (
                      <div className="text-xs text-gray-400 truncate mt-1 italic">
                        {highlightMatch(getMatchPreview(file, searchTerm) || '', searchTerm)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
          <span className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>Esc Close</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default FullSearch