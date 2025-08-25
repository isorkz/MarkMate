import React from 'react'
import { Send, Paperclip, Dice6, Plus, ChevronDown } from 'lucide-react'

const InputPanel: React.FC = () => {
  return (
    <div className="p-3">
      <div className="border border-gray-300 rounded-2xl">
        {/* Text Input */}
        <textarea
          className="w-full resize-none px-4 py-3 text-sm focus:outline-none bg-transparent"
          placeholder="Ask the AI assistant, use @ to reference documents"
          rows={2}
        />

        {/* Input Actions */}
        <div className="flex items-center justify-between px-2 pb-2">
          {/* Left: Model Selector */}
          <button className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 rounded px-2 py-1">
            <span>GPT-4o</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Add Content"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Random Suggestion"
            >
              <Dice6 className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded text-blue-500"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputPanel