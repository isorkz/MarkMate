import React from 'react'
import FileTree from '../file-tree/FileTree'
import Settings from '../settings/Settings'

const LeftSidebar = () => {
  return (
    // flex-none: don't grow or shrink
    <div className="relative top-0 left-0 flex flex-none flex-col h-full w-[18rem] shadow-md bg-neutral-800 text-gray-200">
      <span className="flex-none px-4 py-2 text-lg font-medium">Left Sidebar</span>

      {/* flex-grow: allow a flex item to grow and shrink as needed, then it will push the settings to the bottom */}
      <div className="flex flex-col flex-grow">
        <FileTree />
      </div>

      <Settings />
    </div>
  )
}

export default LeftSidebar