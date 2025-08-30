import React, { useEffect } from 'react'
import { Settings } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAIStore } from '../../stores/aiStore'

const ChatPanel: React.FC = () => {
  const { openSettings } = useSettingsStore()
  const { config, currentSession, createNewSession, isStreaming, streamingMessageId, error, clearError } = useAIStore()
  const hasModels = config.models.length > 0
  const messages = currentSession?.messages || []
  const hasChatMessages = messages.length > 0

  // Create initial session if none exists and models are available
  useEffect(() => {
    if (hasModels && !currentSession) {
      createNewSession()
    }
  }, [hasModels, currentSession, createNewSession])

  const handleSetModel = () => {
    openSettings('ai')
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Messages */}
      {hasChatMessages ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-2xl px-4 py-2 max-w-xs shadow-sm ${message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
              >
                {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                {isStreaming && streamingMessageId === message.id && (
                  <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1">|</span>
                )}
              </div>
            </div>
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
  )
}

export default ChatPanel