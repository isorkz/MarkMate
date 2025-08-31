import React from 'react'
import { User, Bot } from 'lucide-react'
import { ChatMessage } from '@shared/types/ai'
import MarkdownContent from './MarkdownContent'

interface ChatMessageProps {
  message: ChatMessage
  isStreaming?: boolean
}

const ChatMessageItem: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  // Don't render system messages in chat
  if (isSystem) return null

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-600'
          }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div
        className={`flex-1 max-w-[80%] rounded-lg select-text px-4 py-3 ${isUser
          ? 'bg-blue-500 text-white'
          : 'bg-white border border-gray-200'
          }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content as string}
          </div>
        ) : (
          <MarkdownContent
            content={message.content as string}
            isStreaming={isStreaming}
          />
        )}
      </div>
    </div>
  )
}

export default ChatMessageItem