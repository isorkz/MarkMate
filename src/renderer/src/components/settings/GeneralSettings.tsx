import React from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

const GeneralSettings: React.FC = () => {
  const { generalSettings, updateGeneralSettings } = useSettingsStore()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure general application behavior and preferences.
        </p>
      </div>

      {/* Auto Save */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Auto Save</h4>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Enable Auto Save</label>
            <p className="text-xs text-gray-500">Automatically save changes as you type</p>
          </div>
          <input
            type="checkbox"
            checked={generalSettings.autoSaveEnabled}
            onChange={(e) => updateGeneralSettings({ autoSaveEnabled: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {generalSettings.autoSaveEnabled && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Auto Save Interval</label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={generalSettings.autoSaveDelayInSeconds}
                onChange={(e) => updateGeneralSettings({ autoSaveDelayInSeconds: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16">{generalSettings.autoSaveDelayInSeconds}s</span>
            </div>
            <p className="text-xs text-gray-500">
              Files will be saved automatically every {generalSettings.autoSaveDelayInSeconds} seconds
            </p>
          </div>
        )}
      </div>

      {/* Access Token */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Web Access</h4>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Access Token
          </label>
          <input
            type="password"
            value={generalSettings.accessToken}
            onChange={(e) => updateGeneralSettings({ accessToken: e.target.value })}
            placeholder="Enter access token for web version"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500">
            Required for accessing the web version of MarkMate. This token will be used to authenticate API requests.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GeneralSettings