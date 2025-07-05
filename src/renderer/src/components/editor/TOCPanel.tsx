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
      const headings = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6')

      const items: TOCItem[] = Array.from(headings).map((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1))
        const text = heading.textContent || ''
        const id = `heading-${index}`

        // Add id to heading if it doesn't have one
        if (!heading.id) {
          heading.id = id
        }

        return {
          id: heading.id,
          level,
          text,
          element: heading as HTMLElement
        }
      })

      setTocItems(items)
    }

    // Update TOC when content changes
    updateTOC()

    // Create observer to watch for content changes
    const observer = new MutationObserver(updateTOC)
    const proseMirror = document.querySelector('.ProseMirror')

    if (proseMirror) {
      observer.observe(proseMirror, {
        childList: true,
        subtree: true,
        characterData: true
      })
    }

    return () => observer.disconnect()
  }, [activeTab?.content])

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
    <div className="h-full flex flex-col bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Table of Contents
      </h3>

      <div className="flex-1 overflow-y-auto p-3">
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
                  className={`
                    w-full text-left text-sm hover:bg-blue-100 hover:text-blue-700 rounded px-2 py-1 transition-colors
                    ${item.level === 1 ? 'font-semibold text-gray-900' : ''}
                    ${item.level === 2 ? 'font-medium text-gray-800 ml-2' : ''}
                    ${item.level === 3 ? 'text-gray-700 ml-4' : ''}
                    ${item.level >= 4 ? 'text-gray-600 ml-6' : ''}
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