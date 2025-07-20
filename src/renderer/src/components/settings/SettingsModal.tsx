import React from 'react'
import { X, Settings, Monitor, RefreshCw, Settings2 } from 'lucide-react'
import { useSettingsStore, SettingsType } from '../../stores/settingsStore'
import GeneralSettings from './GeneralSettings'
import AppearanceSettings from './AppearanceSettings'
import SyncSettings from './SyncSettings'

const SettingsModal: React.FC = () => {
  const { isOpen, activeSettings, closeSettings, setActiveSettings } = useSettingsStore()

  if (!isOpen) return null

  const tabs: { id: SettingsType; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings2 className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Monitor className="w-4 h-4" /> },
    { id: 'sync', label: 'Sync', icon: <RefreshCw className="w-4 h-4" /> }
  ]

  const renderContent = () => {
    switch (activeSettings) {
      case 'general':
        return <GeneralSettings />
      case 'appearance':
        return <AppearanceSettings />
      case 'sync':
        return <SyncSettings />
      default:
        return <AppearanceSettings />
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 h-[600px] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            </div>
          </div>

          <button
            onClick={closeSettings}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-100 bg-gray-50 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettings(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSettings === tab.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal