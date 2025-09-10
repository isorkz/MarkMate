import React, { useState, useEffect, useRef } from 'react'
import { X, Plus, Clock, Copy, ChevronDown, Maximize, Minimize, MoreHorizontal, Trash2 } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAIStore } from '../../stores/aiStore'

const Header: React.FC = () => {
  const { toggleAIAssistant, toggleAIMaximize, aiSettings } = useSettingsStore()
  const { clearCurrentSession, createNewSession, loadSession, deleteSession, copyCurrentSession, currentSession, sessions, activeSessionId } = useAIStore()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showSessionSelector, setShowSessionSelector] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const sessionSelectorRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
      if (sessionSelectorRef.current && !sessionSelectorRef.current.contains(event.target as Node)) {
        setShowSessionSelector(false)
      }
    }

    if (showMoreMenu || showSessionSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu, showSessionSelector])

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
        <div className="relative ml-1" ref={sessionSelectorRef}>
          <button
            onClick={() => setShowSessionSelector(!showSessionSelector)}
            className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-1"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <span className="max-w-32 truncate">{currentSession.title}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Session Select Dropdown Menu */}
          {showSessionSelector && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-48 max-w-64 z-10">
              <div className="py-1">
                {/* Divider */}
                {sessions.length > 0 && <div className="border-t border-gray-100 my-1" />}

                {/* Historical Sessions */}
                {sessions.length > 0 ? (
                  sessions.map(session => (
                    <div
                      key={session.id}
                      className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 group ${activeSessionId === session.id ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div
                        onClick={() => {
                          loadSession(session.id)
                          setShowSessionSelector(false)
                        }}
                        className="flex-1 truncate cursor-pointer"
                      >
                        <div className="truncate">{session.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(session.id)
                        }}
                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No chat history
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={createNewSession}
          className="p-1 hover:bg-gray-100 rounded"
          title="New Session"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-1 hover:bg-gray-100 rounded"
            title="More Actions..."
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-40 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    copyCurrentSession()
                    setShowMoreMenu(false)
                  }}
                  disabled={!currentSession || currentSession.messages.length === 0}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy className="w-4 h-4" />
                  Copy Chat
                </button>
                <button
                  onClick={() => {
                    clearCurrentSession()
                    setShowMoreMenu(false)
                  }}
                  disabled={!currentSession || currentSession.messages.length === 0}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
                {/* <button
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Chat History"
                >
                  <Clock className="w-4 h-4" />
                </button> */}
              </div>
            </div>
          )}
        </div>
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