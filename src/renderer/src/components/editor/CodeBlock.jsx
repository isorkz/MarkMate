import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import React, { useState, useRef } from 'react'

// https://next.tiptap.dev/docs/examples/advanced/syntax-highlighting

// Need to restart the app to make it effect
export default ({ node: { attrs: { language: defaultLanguage } }, updateAttributes, extension }) => {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef(null)

  const handleCopy = () => {
    // Get the text content from the code element
    const codeContent = codeRef.current?.textContent || ''

    // Copy to clipboard
    navigator.clipboard.writeText(codeContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  return (
    <NodeViewWrapper className="relative group">
      <div className="absolute right-1 top-1 flex gap-1">
        <button
          contentEditable={false}
          onClick={handleCopy}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <select
          contentEditable={false}
          defaultValue={defaultLanguage}
          onChange={event => updateAttributes({ language: event.target.value })}
          className="bg-white rounded p-0.5 text-xs"
        >
          <option value="null">
            auto
          </option>
          <option disabled>
            —
          </option>
          {extension.options.lowlight.listLanguages().map((lang, index) => (
            <option key={index} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <pre ref={codeRef}>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}