import React from 'react'
import { Search } from 'lucide-react'

const FileSearch: React.FC = () => {
  return (
    <div className="relative bg-white">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search files..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>
    </div>
  )
}

export default FileSearch