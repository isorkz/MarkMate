import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ChatCodeBlock from './ChatCodeBlock'

interface MarkdownContentProps {
  content: string
  isStreaming?: boolean
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, isStreaming }) => {
  return (
    <div className="chat-message">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')

            // Check if it's inline code by checking if className starts with 'language-'
            // Block code has 'language-xxx' or no className, inline code typically has no className
            const isBlockCode = className?.startsWith('language-') || String(children).includes('\n')

            if (isBlockCode) {
              return (
                <ChatCodeBlock
                  language={match ? match[1] : ''}
                  value={String(children).replace(/\n$/, '')}
                />
              )
            } else {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse ml-1" />
      )}
    </div>
  )
}

export default MarkdownContent