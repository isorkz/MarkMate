import React from 'react'
import ContentEditor from '../content-edit/ContentEditor'

const MainPanel = () => {
  return (
    <main className="relative top-0 left-0 flex flex-none flex-col h-full">
      <span className="flex-none px-4 py-2 text-lg font-medium">Main Panel</span>

      <ContentEditor />
    </main>
  )
}

export default MainPanel