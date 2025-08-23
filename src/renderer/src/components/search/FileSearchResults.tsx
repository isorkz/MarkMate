import React, { useRef, useEffect } from 'react'
import { File } from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { handleOpenFile } from '@renderer/utils/fileOperations'
import { FileNode } from '@shared/types/file'

interface FileSearchResultsProps {
  searchTerm: string
  results: FileNode[]
  clearSearch: () => void
}

const FileSearchResults: React.FC<FileSearchResultsProps> = ({ searchTerm, results, clearSearch }) => {
  const resultsRef = useRef<HTMLDivElement>(null)
  const { currentWorkspace } = useWorkspaceStore()

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        clearSearch()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [clearSearch])

  const handleResultClick = async (file: FileNode) => {
    if (currentWorkspace) {
      handleOpenFile(currentWorkspace.path, file.path, false)  // false = preview mode (not pinned)
      clearSearch()
    }
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

  if (!searchTerm) return null

  return (
    <div
      ref={resultsRef}
      className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10"
    >
      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </div>

      <div className="max-h-60 overflow-y-auto">
        {results.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500">
            No files found for "{searchTerm}"
          </div>
        ) : (
          results.map((file) => (
            <div
              key={file.id}
              onClick={() => handleResultClick(file)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <File className="w-4 h-4 text-gray-500 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {highlightMatch(file.name, searchTerm)}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {highlightMatch(file.path, searchTerm)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default FileSearchResults