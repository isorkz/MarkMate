import React, { useState, useEffect, useRef } from 'react'
import { FileText, Search } from 'lucide-react'
import { FileNode } from '@shared/types/file';

interface PageLinkSelectorProps {
  files: FileNode[]
  position: { x: number; y: number }
  onSelect: (file: FileNode) => void
  onClose: () => void
}

const PageLinkSelector: React.FC<PageLinkSelectorProps> = ({
  files,
  position,
  onSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredFiles, setFilteredFiles] = useState<FileNode[]>(files)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchTerm) {
      const filtered = files.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.path.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFiles(filtered)
      setSelectedIndex(0)
    } else {
      setFilteredFiles(files)
      setSelectedIndex(0)
    }
  }, [searchTerm, files])

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus()
    }

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredFiles.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredFiles[selectedIndex]) {
          onSelect(filteredFiles[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  const handleFileClick = (file: FileNode) => {
    onSelect(file)
  }

  if (filteredFiles.length === 0 && searchTerm) {
    return (
      <div
        ref={containerRef}
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-sm w-full"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translateY(8px)'
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          No pages found matching "{searchTerm}"
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-sm w-full max-h-80"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(8px)'
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {filteredFiles.map((file, index) => (
          <button
            key={file.id}
            onClick={() => handleFileClick(file)}
            className={`w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
          >
            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {file.path}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PageLinkSelector