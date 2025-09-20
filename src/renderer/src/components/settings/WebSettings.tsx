import React from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

const WebSettings: React.FC = () => {
  const { webSettings, updateWebSettings } = useSettingsStore()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Web Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure settings for the web version of MarkMate.
        </p>
      </div>

      {/* Access Token */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Web Access</h4>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Access Key
          </label>
          <input
            type="password"
            value={webSettings.accessKey}
            onChange={(e) => updateWebSettings({ accessKey: e.target.value })}
            placeholder="Enter access key for web version"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500">
            Required for accessing the web version of MarkMate. This access key will be used to authenticate API requests.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WebSettings