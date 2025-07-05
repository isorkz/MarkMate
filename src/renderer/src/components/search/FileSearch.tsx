import React from 'react'

const FileSearch: React.FC = () => {
  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search files..."
          className="w-full px-3 py-2 pl-8 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
        />
        <span className="absolute left-2 top-2.5 text-gray-400 text-sm">🔍</span>
      </div>
    </div>
  )
}

export default FileSearch