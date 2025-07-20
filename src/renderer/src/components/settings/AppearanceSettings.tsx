import React from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

const AppearanceSettings: React.FC = () => {
  const { appearanceSettings, updateAppearanceSettings } = useSettingsStore()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize the appearance and layout of your editor.
        </p>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Theme</label>
        <select
          value={appearanceSettings.theme}
          onChange={(e) => updateAppearanceSettings({ theme: e.target.value as 'light' | 'dark' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Font Size</label>
        <div className="flex items-center space-x-3">
          <input
            type="range"
            min="10"
            max="24"
            value={appearanceSettings.fontSize}
            onChange={(e) => updateAppearanceSettings({ fontSize: parseInt(e.target.value) })}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-12">{appearanceSettings.fontSize}px</span>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Font Family</label>
        <select
          value={appearanceSettings.fontFamily}
          onChange={(e) => updateAppearanceSettings({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="Monaco, monospace">Monaco</option>
          <option value="'SF Mono', monospace">SF Mono</option>
          <option value="'Fira Code', monospace">Fira Code</option>
          <option value="'Source Code Pro', monospace">Source Code Pro</option>
          <option value="Consolas, monospace">Consolas</option>
        </select>
      </div>
    </div>
  )
}

export default AppearanceSettings