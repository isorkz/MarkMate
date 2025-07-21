import React, { useState } from 'react'
import { BubbleMenu, Editor } from '@tiptap/react'
import { ExternalLink, Edit3, Unlink, Check, X } from 'lucide-react'

interface LinkBubbleMenuProps {
  editor: Editor
}

const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const updateLinkData = () => {
    if (editor && editor.isActive('link')) {
      const href = editor.getAttributes('link').href
      setLinkUrl(href || '')

      // Temporarily extend selection to get full link text
      const originalSelection = editor.state.selection
      editor.chain().extendMarkRange('link').run()
      const { from, to } = editor.state.selection
      const fullText = editor.state.doc.textBetween(from, to)

      // Restore original selection
      editor.commands.setTextSelection({ from: originalSelection.from, to: originalSelection.to })

      setLinkText(fullText || '')
    }
  }

  const handleSave = () => {
    // If linkUrl is empty, remove the link
    if (!linkUrl.trim()) {
      handleRemoveLink()
      return
    }

    // First extend to full link range and get the range
    editor.chain().focus().extendMarkRange('link').run()
    const { from, to } = editor.state.selection

    // Replace content and apply link in one transaction
    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(linkText)
      .setTextSelection({ from, to: from + linkText.length })
      .setLink({ href: linkUrl })
      .run()

    setIsEditing(false)
  }

  const handleCancel = () => {
    setLinkText('')
    setLinkUrl('')
    setIsEditing(false)
  }

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setIsEditing(false)
  }

  const handleOpenLink = () => {
    const href = editor.getAttributes('link').href
    if (href) {
      window.open(href, '_blank')
    }
  }

  const shouldShow = ({ editor }: { editor: Editor }) => {
    return editor.isActive('link')
  }

  if (isEditing) {
    return (
      <BubbleMenu
        editor={editor}
        shouldShow={shouldShow}
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-2 min-w-80"
      >
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Link Text</label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Link text"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">URL</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleSave}
            className="p-1 hover:bg-green-100 rounded transition-colors"
            title="Save changes"
          >
            <Check className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </BubbleMenu>
    )
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      className="bg-white border border-gray-200 rounded-xl shadow-lg flex items-center"
    >
      <div className="flex items-center divide-x divide-gray-200">
        <button
          onClick={() => {
            updateLinkData()
            setIsEditing(true)
          }}
          className="p-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          title="Edit link"
        >
          <Edit3 className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">Edit</span>
        </button>

        <button
          onClick={handleOpenLink}
          className="p-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          title="Open link"
        >
          <ExternalLink className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">Open</span>
        </button>

        <button
          onClick={handleRemoveLink}
          className="p-2 hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
          title="Remove link"
        >
          <Unlink className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">Remove</span>
        </button>
      </div>
    </BubbleMenu>
  )
}

export default LinkBubbleMenu