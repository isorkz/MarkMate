import React, { useState } from 'react'
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import MermaidDiagram from '../../MermaidDiagram'

const CodeBlock: React.FC<NodeViewProps> = ({ node, updateAttributes, extension }) => {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const language = typeof node.attrs.language === 'string' ? node.attrs.language : ''
  const isMermaid = language.toLowerCase() === 'mermaid'

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(node.textContent)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const languages = extension.options.lowlight.listLanguages() as string[]

  return (
    <NodeViewWrapper
      className={`code-block-wrapper relative group ${isMermaid ? 'mermaid-code-block' : ''}`}
    >
      <div className="code-block-toolbar" contentEditable={false}>
        {isMermaid && (
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className="code-block-action"
            title={showPreview ? 'Edit Mermaid source' : 'Preview Mermaid diagram'}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        )}
        <button type="button" onClick={handleCopy} className="code-block-action" title="Copy code">
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <select
          value={language || 'null'}
          onChange={(event) => updateAttributes({ language: event.target.value })}
          className="code-block-language"
          aria-label="Code block language"
        >
          <option value="null">auto</option>
          <option disabled>—</option>
          <option value="mermaid">mermaid</option>
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {isMermaid && showPreview && <MermaidDiagram definition={node.textContent} />}

      <pre className={isMermaid && showPreview ? 'mermaid-source-hidden' : undefined}>
        <NodeViewContent<'code'> as="code" />
      </pre>
    </NodeViewWrapper>
  )
}

export default CodeBlock
