import React from 'react'
import { X, Plus, Clock, Copy, ChevronDown, Maximize, Minimize, MoreHorizontal } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

const Header: React.FC = () => {
  const { toggleAIAssistant, toggleAIMaximize, aiSettings } = useSettingsStore()

  return (
    <div
      className="flex items-center justify-between px-3 min-h-[40px]"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Left Actions */}
      <div className={`flex items-center gap-1 ${aiSettings.isMaximized ? 'ml-17' : ''}`}>
        {/* Maximize/Minimize Button */}
        <button
          onClick={toggleAIMaximize}
          className="p-1 hover:bg-gray-100 rounded"
          style={{ WebkitAppRegion: 'no-drag' }}
          title={aiSettings.isMaximized ? "Minimize" : "Maximize"}
        >
          {aiSettings.isMaximized ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>

        {/* Session Selector */}
        <button
          className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-1 ml-1"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <span>New Chat</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          className="p-1 hover:bg-gray-100 rounded"
          title="New Session"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          className="p-1 hover:bg-gray-100 rounded"
          title="Copy Chat"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          className="p-1 hover:bg-gray-100 rounded"
          title="Chat History"
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          className="p-1 hover:bg-gray-100 rounded"
          title="More Actions..."
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={toggleAIAssistant}
          className="p-1 hover:bg-gray-100 rounded"
          title="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Header