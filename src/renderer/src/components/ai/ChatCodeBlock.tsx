import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { common, createLowlight } from 'lowlight'

// Create lowlight instance
const lowlight = createLowlight(common)

interface ChatCodeBlockProps {
  language: string
  value: string
}

const ChatCodeBlock: React.FC<ChatCodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 500)
    } catch (error) {
      console.error('Failed to copy code:', error)
      toast.error('Failed to copy code')
    }
  }

  // Convert lowlight AST to React elements
  const renderHighlighted = (nodes: any[]): React.ReactNode[] => {
    return nodes.map((node, index) => {
      if (node.type === 'text') {
        return node.value
      } else if (node.type === 'element') {
        const Tag = node.tagName
        const props: any = { key: index }
        if (node.properties) {
          Object.assign(props, node.properties)
        }
        return React.createElement(Tag, props, node.children ? renderHighlighted(node.children) : null)
      }
      return null
    })
  }

  const getHighlightedCode = () => {
    if (language && lowlight.registered(language)) {
      try {
        const result = lowlight.highlight(language, value)
        return renderHighlighted(result.children)
      } catch (error) {
        console.warn('Failed to highlight code:', error)
        toast.error('Failed to highlight code')
      }
    }
    return value
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        title={copied ? 'Copied!' : 'Copy'}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
      <pre>
        <code className={`language-${language}`}>
          {getHighlightedCode()}
        </code>
      </pre>
    </div>
  )
}

export default ChatCodeBlock