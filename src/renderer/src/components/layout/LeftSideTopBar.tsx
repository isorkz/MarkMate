import React from 'react'
import { PanelLeft, Settings } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

const LeftSideTopBar: React.FC = () => {
  const { appearanceSettings, updateAppearanceSettings, openSettings } = useSettingsStore()

  const toggleSidebar = () => {
    updateAppearanceSettings({ sidebarVisible: !appearanceSettings.sidebarVisible })
  }

  const handleOpenSettings = () => {
    openSettings('general')
  }

  return (
    <div className="fixed w-sidebar top-0 left-0 right-0 h-10 z-50 flex items-center" style={{ WebkitAppRegion: 'drag' }}>
      {/* Sidebar toggle button - positioned after macOS traffic lights */}
      <button
        onClick={toggleSidebar}
        className="ml-20 p-1 rounded-md hover:bg-gray-200 transition-colors"
        title="Show sidebar (Cmd+Shift+B)"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <PanelLeft className="w-4 h-4 text-gray-600" />
      </button>
      
      {/* Settings button */}
      <button
        onClick={handleOpenSettings}
        className="ml-1 p-1 rounded-md hover:bg-gray-200 transition-colors"
        title="Open settings"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <Settings className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  )
}

export default LeftSideTopBar