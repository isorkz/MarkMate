import React from 'react'
import { PanelLeft } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

const LeftSideTopBar: React.FC = () => {
  const { appearanceSettings, updateAppearanceSettings } = useSettingsStore()

  const toggleSidebar = () => {
    updateAppearanceSettings({ sidebarVisible: !appearanceSettings.sidebarVisible })
  }


  return (
    <div 
      className={`fixed top-0 left-0 h-10 z-50 flex items-center justify-end ${
        appearanceSettings.sidebarVisible ? 'w-sidebar' : 'w-32'
      }`} 
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Sidebar toggle button - positioned at the right */}
      <button
        onClick={toggleSidebar}
        className="mr-4 p-1 rounded-md hover:bg-gray-200 transition-colors"
        title="Show sidebar (Cmd+Shift+B)"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <PanelLeft className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  )
}

export default LeftSideTopBar