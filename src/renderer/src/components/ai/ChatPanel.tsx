import React, { useEffect, useRef } from 'react'
import { Settings, ChevronUp, ChevronDown } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAIStore } from '../../stores/aiStore'
import ChatMessageItem from './ChatMessageItem'

const ChatPanel: React.FC = () => {
  const { openSettings } = useSettingsStore()
  const { config, currentSession, createNewSession, isStreaming, streamingMessageId, isRegenerating, error, clearError } = useAIStore()
  const hasModels = config.models.length > 0
  const messages = currentSession?.messages || []
  const hasChatMessages = messages.length > 0

  // Scroll functionality
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Create initial session if none exists and models are available
  useEffect(() => {
    if (hasModels && !currentSession) {
      createNewSession()
    }
  }, [hasModels, currentSession, createNewSession])

  // Auto-scroll to bottom when AI starts responding (but not during regeneration)
  useEffect(() => {
    if (isStreaming && !isRegenerating) {
      scrollToBottom()
    }
  }, [isStreaming, isRegenerating])

  const handleSetModel = () => {
    openSettings('ai')
  }

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={scrollContainerRef} className="h-full overflow-y-auto p-4">
        {/* Messages */}
        {hasChatMessages ? (
          <div className="space-y-1">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isStreaming={isStreaming && streamingMessageId === message.id}
              />
            ))}

            {/* Error Message */}
            {error && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2 max-w-xs shadow-sm bg-red-50 border border-red-200 text-red-700 rounded-bl-sm relative">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm">{error}</span>
                    <button
                      onClick={clearError}
                      className="text-red-500 hover:text-red-700 text-xs mt-0.5 flex-shrink-0"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          hasModels ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to the AI Assistant
                </h3>
                <p className="text-sm text-gray-600">
                  Start typing a message below to begin your conversation.
                </p>
              </div>
            </div>
          ) : (
            // Welcome / Status Message
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to the AI Assistant
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-64 mx-auto">
                Please configure your AI model to get started.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleSetModel}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-800"
                >
                  <Settings className="w-4 h-4" />
                  Set model
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Scroll buttons */}
      {hasChatMessages && (
        <div className="absolute bottom-4 right-5 flex flex-col gap-1 z-10">
          <button
            onClick={scrollToTop}
            className="p-1.5 bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Scroll to top"
          >
            <ChevronUp className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onClick={scrollToBottom}
            className="p-1.5 bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Scroll to bottom"
          >
            <ChevronDown className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  )
}

export default ChatPanel