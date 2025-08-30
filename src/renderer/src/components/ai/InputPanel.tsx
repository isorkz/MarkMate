import React, { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, Dice6, Plus } from 'lucide-react'
import { useAIStore } from '../../stores/aiStore'

const InputPanel: React.FC = () => {
  const { config, sendMessage, isStreaming, setDefaultModel } = useAIStore()
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentModel = config.models.find(model => model.id === config.currentModelId)
  const hasModels = config.models.length > 0

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    if (!currentModel) {
      return
    }

    try {
      await sendMessage(input.trim(), currentModel)
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      // Errors handled in chat
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  return (
    <div className="p-3">
      <div className="border border-gray-300 rounded-2xl">
        {/* Text Input */}
        <textarea
          ref={textareaRef}
          className="w-full resize-none px-4 py-3 text-sm focus:outline-none bg-transparent"
          placeholder={hasModels ? "Ask the AI assistant..." : "Please configure a model first"}
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={!hasModels || isStreaming}
          rows={2}
        />

        {/* Input Actions */}
        <div className="flex items-center justify-between px-2 pb-2">
          {/* Left: Model Selector */}
          <div className="text-xs text-gray-600">
            {hasModels ? (
              <select
                value={config.currentModelId || ''}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="text-xs text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {!config.currentModelId && (
                  <option value="">Select model...</option>
                )}
                {config.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-red-500">No model configured</span>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-50 disabled:hover:bg-transparent"
              title="Add Content"
              disabled={!hasModels || isStreaming}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-50 disabled:hover:bg-transparent"
              title="Random Suggestion"
              disabled={!hasModels || isStreaming}
            >
              <Dice6 className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-50 disabled:hover:bg-transparent"
              title="Attach File"
              disabled={!hasModels || isStreaming}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              className={`p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:hover:bg-transparent ${input.trim() && !isStreaming ? 'text-blue-500' : 'text-gray-400'
                }`}
              title={isStreaming ? "Generating response..." : "Send Message"}
              disabled={!hasModels || !input.trim() || isStreaming}
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputPanel