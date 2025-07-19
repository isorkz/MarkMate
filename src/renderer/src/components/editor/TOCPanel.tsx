import React, { useState, useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'

interface TOCItem {
  id: string
  level: number
  text: string
  element?: HTMLElement
}

const TOCPanel: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore()
  const [tocItems, setTocItems] = useState<TOCItem[]>([])

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  useEffect(() => {
    const updateTOC = () => {
      const headings = document.querySelectorAll(`#tab-${activeTabId} .ProseMirror h1, #tab-${activeTabId} .ProseMirror h2, #tab-${activeTabId} .ProseMirror h3, #tab-${activeTabId} .ProseMirror h4, #tab-${activeTabId} .ProseMirror h5, #tab-${activeTabId} .ProseMirror h6`)

      const items: TOCItem[] = Array.from(headings).map((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1))
        const text = heading.textContent || ''
        const id = `heading-${index}`

        return {
          id: id,
          level,
          text,
          element: heading as HTMLElement
        }
      })

      setTocItems(items)
    }

    // Update TOC when content changes
    updateTOC()
  }, [activeTab?.content, activeTabId])

  const scrollToHeading = (item: TOCItem) => {
    if (item.element) {
      item.element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        No file selected
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 px-4 pb-4" >
      <h3 className="text-sm font-semibold text-gray-700 py-4" style={{ WebkitAppRegion: 'drag' }}>
        Table of Contents
      </h3>

      <div className="flex-1 overflow-y-auto">
        {tocItems.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">
            No headings found
          </div>
        ) : (
          <ul className="space-y-1">
            {tocItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToHeading(item)}
                  className={`w-full text-left text-sm hover:bg-gray-100 rounded px-2 py-1 transition-colors
                    ${item.level === 1 ? 'font-semibold text-gray-900' : ''}
                    ${item.level === 2 ? 'font-medium text-gray-800 ml-4' : ''}
                    ${item.level === 3 ? 'text-gray-700 ml-8' : ''}
                    ${item.level >= 4 ? 'text-gray-600 ml-12' : ''}
                  `}
                  title={item.text}
                >
                  <span className="truncate block">
                    {item.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TOCPanel