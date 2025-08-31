import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

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
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        title={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
      <pre>
        <code className={`language-${language}`}>
          {value}
        </code>
      </pre>
    </div>
  )
}

export default ChatCodeBlock