import React, { useEffect, useState } from 'react'
import { BubbleMenu, Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code,
  Link as LinkIcon
} from 'lucide-react'

interface SelectionBubbleMenuProps {
  editor: Editor
}

const SelectionBubbleMenu: React.FC<SelectionBubbleMenuProps> = ({ editor }) => {
  // When user clicks the link button to add a link, show an input field to paste the link
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  // Reset the link input whenever the selection changes or editor loses focus
  useEffect(() => {
    if (!editor) {
      return
    }

    const resetLinkInput = () => {
      setIsLinkInputOpen(false)
      setLinkUrl('')
    }

    editor.on('selectionUpdate', resetLinkInput)
    editor.on('blur', resetLinkInput)

    return () => {
      editor.off('selectionUpdate', resetLinkInput)
      editor.off('blur', resetLinkInput)
    }
  }, [editor])

  const shouldShow = ({ editor: bubbleEditor }: { editor: Editor }) => {
    if (!bubbleEditor || !bubbleEditor.isEditable) {
      return false
    }

    const selection = bubbleEditor.state.selection

    if (!selection || selection.empty) {
      return false
    }

    // Do not show if the selection is already a link
    if (bubbleEditor.isActive('link')) {
      return false
    }

    const text = bubbleEditor.state.doc.textBetween(selection.from, selection.to).trim()

    return text.length > 0
  }

  const applyLink = () => {
    const url = linkUrl.trim()

    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }

    setIsLinkInputOpen(false)
    setLinkUrl('')
  }

  const toggleLinkInput = () => {
    if (!isLinkInputOpen) {
      setLinkUrl('')
    }
    setIsLinkInputOpen((value) => !value)
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      className="bg-white border border-gray-200 rounded-xl shadow-lg"
      tippyOptions={{
        placement: 'top',
        moveTransition: 'transform 0.15s ease-out',
        offset: [0, 12]
      }}
    >
      {isLinkInputOpen ? (
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyLink()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setIsLinkInputOpen(false)
                setLinkUrl('')
              }
            }}
            className="w-56 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Paste a link"
            autoFocus
          />
          <button
            type="button"
            onClick={applyLink}
            className="px-2 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>
      ) : (
        <div className="flex items-center divide-x divide-gray-200">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 transition-colors ${editor.isActive('bold') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 transition-colors ${editor.isActive('italic') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 transition-colors ${editor.isActive('underline') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 transition-colors ${editor.isActive('strike') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-2 transition-colors ${editor.isActive('highlight') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-2 transition-colors ${editor.isActive('code') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Code"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleLinkInput}
              className="p-2 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Add link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </BubbleMenu>
  )
}

export default SelectionBubbleMenu
