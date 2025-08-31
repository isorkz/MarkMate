import React, { useState, useRef, useEffect } from 'react'
import { User, Bot, Copy, Edit3, Check } from 'lucide-react'
import { ChatMessage } from '@shared/types/ai'
import MarkdownContent from './MarkdownContent'
import toast from 'react-hot-toast'
import { useAIStore } from '../../stores/aiStore'

interface ChatMessageProps {
  message: ChatMessage
  isStreaming?: boolean
}

const ChatMessageItem: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const [showActions, setShowActions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content as string)
  const { updateMessage } = useAIStore()
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [editContent, isEditing])


  // Don't render system messages in chat
  if (isSystem) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content as string)
      setCopied(true)
      setTimeout(() => setCopied(false), 500)
    } catch (error) {
      console.error('Failed to copy message:', error)
      toast.error('Failed to copy message')
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowActions(false)
  }

  const handleSaveEdit = () => {
    updateMessage(message.id, editContent)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content as string)
    setIsEditing(false)
  }

  return (
    <div
      className={`group flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-600'
          }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content with Actions */}
      <div className="flex-1 max-w-[80%] relative">
        <div
          className={`rounded-lg select-text px-4 py-3 ${isEditing
            ? 'bg-white border border-gray-200'
            : isUser
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200'
            }`}
        >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleCancelEdit()
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded resize-none text-sm overflow-hidden"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          ) : isUser ? (
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

        {/* Action Menu */}
        {showActions && !isStreaming && !isEditing && (
          <div className={`absolute top-1 right-1 flex gap-1`}>
            {/* Copy message */}
            <button
              onClick={handleCopy}
              className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-90"
              title={copied ? 'Copied!' : 'Copy'}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>

            {/* Edit message */}
            <button
              onClick={handleEdit}
              className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-90"
              title="Edit message"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessageItem