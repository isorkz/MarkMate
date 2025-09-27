import React, { useState, useRef, useEffect } from 'react'
import { User, Bot, Copy, Edit3, Check, Trash2, MoreHorizontal, Eraser, RotateCcw } from 'lucide-react'
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
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const { updateMessage, deleteMessage, eraseFromMessage, regenerateChat, config } = useAIStore()
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [editContent, isEditing])

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
    }

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }

    return undefined
  }, [showMoreMenu])


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

  const handleSaveEdit = async () => {
    try {
      await updateMessage(message.id, editContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update message:', error)
      toast.error('Failed to update message')
    }
  }

  const handleCancelEdit = () => {
    setEditContent(message.content as string)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    try {
      await deleteMessage(message.id)
      setShowMoreMenu(false)
    } catch (error) {
      console.error('Failed to delete message:', error)
      toast.error('Failed to delete message')
    }
  }

  const handleErase = async () => {
    try {
      await eraseFromMessage(message.id)
      setShowMoreMenu(false)
    } catch (error) {
      console.error('Failed to erase messages:', error)
      toast.error('Failed to erase messages')
    }
  }

  const handleRegenerate = async () => {
    try {
      const currentModel = config.models.find(m => m.id === config.currentModelId)
      if (!currentModel) {
        toast.error('Config AI model first')
        return
      }
      await regenerateChat(message.id, currentModel)
    } catch (error) {
      console.error('Failed to regenerate message:', error)
      toast.error('Failed to regenerate message')
    }
  }

  return (
    <div
      className={`group flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false)
        setShowMoreMenu(false)
      }}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
          // ? 'bg-gray-100 text-gray-600'
          ? 'bg-neutral-800 text-white'
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
              // ? 'bg-gray-100'
              ? 'bg-neutral-800 text-white'
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
              title="Edit"
            >
              <Edit3 className="w-3 h-3" />
            </button>

            {/* Regenerate message */}
            <button
              onClick={handleRegenerate}
              className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-90"
              title="Regenerate"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            {/* More menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-90 flex"
                title="More"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>

              {/* More dropdown menu */}
              {showMoreMenu && (
                <div className="absolute right-0 top-6 rounded-md shadow-lg z-10 flex flex-col gap-1">
                  <button
                    onClick={handleDelete}
                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-90"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={handleErase}
                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-90"
                    title="Erase from here"
                  >
                    <Eraser className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessageItem