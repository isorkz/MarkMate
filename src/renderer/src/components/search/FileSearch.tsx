import React from 'react'
import { Search, X } from 'lucide-react'
import { useFileSearch } from '../../hooks/useFileSearch'
import FileSearchResults from './FileSearchResults'

const FileSearch: React.FC = () => {
  const { searchTerm, setSearchTerm, clearSearch, searchResults, isSearching } = useFileSearch()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch()
    }
  }

  return (
    <div className="relative">
      <div className="relative bg-white">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search files..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />

        {/* Close button */}
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isSearching && (
        <FileSearchResults
          searchTerm={searchTerm}
          results={searchResults}
          clearSearch={clearSearch}
        />
      )}
    </div>
  )
}

export default FileSearch