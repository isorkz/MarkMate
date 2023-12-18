import React from 'react'
import ContentToc from '../content-toc/ContentToc'

const RightSidebar = () => {
  return (
    // flex-none: don't grow or shrink
    <div className="relative top-0 left-0 flex flex-none flex-col h-full w-[18rem] bg-neutral-800 text-gray-200 shadow-md">
      <span className="flex-none px-4 py-2 text-lg font-medium">Right Sidebar</span>

      <ContentToc />
    </div>
  )
}

export default RightSidebar