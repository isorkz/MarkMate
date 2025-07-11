import React from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'

interface RichEditorSearchProps {
  searchTerm: string
  currentMatchIndex: number
  totalMatches: number
  onSearchChange: (term: string) => void
  onNextMatch: () => void
  onPrevMatch: () => void
  onClose: () => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
}

const RichEditorSearch: React.FC<RichEditorSearchProps> = ({
  searchTerm,
  currentMatchIndex,
  totalMatches,
  onSearchChange,
  onNextMatch,
  onPrevMatch,
  onClose,
  searchInputRef
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3 flex items-center gap-2">
      <Search className="w-4 h-4 text-gray-400" />
      <input
        ref={searchInputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search..."
        className="outline-none text-sm w-48"
      />
      {totalMatches > 0 && (
        <div className="text-xs text-gray-500 px-2">
          {currentMatchIndex + 1} of {totalMatches}
        </div>
      )}
      <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
        <button
          onClick={onPrevMatch}
          className="p-1 hover:bg-gray-100 rounded"
          disabled={!searchTerm}
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onNextMatch}
          className="p-1 hover:bg-gray-100 rounded"
          disabled={!searchTerm}
          title="Next match (Enter)"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
          title="Close search (Escape)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default RichEditorSearch