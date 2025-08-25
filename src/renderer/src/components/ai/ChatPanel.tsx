import React from 'react'
import { Settings } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

const ChatPanel: React.FC = () => {
  const { openSettings } = useSettingsStore()

  const handleSetModel = () => {
    openSettings('ai')
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Welcome Message */}
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

      {/* Mock Messages */}
      <div className="space-y-4">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-xs shadow-sm">
            Hello, can you help me?
          </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs shadow-sm">
            Of course! I'd be happy to help you. What do you need assistance with?
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPanel