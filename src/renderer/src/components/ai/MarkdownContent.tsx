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
            return match ? (
              <ChatCodeBlock
                language={match[1]}
                value={String(children).replace(/\n$/, '')}
                {...props}
              />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
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