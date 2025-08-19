import React, { useState } from 'react'
import { ExternalLink, AlertTriangle, Cable } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { adapters } from '../../adapters'

const SyncSettings: React.FC = () => {
  const { syncSettings, updateSyncSettings } = useSettingsStore()
  const { currentWorkspace } = useWorkspaceStore()
  const [isTesting, setIsTesting] = useState(false)

  const handleConfigGit = async () => {
    if (!currentWorkspace) {
      toast.error('No workspace is open')
      return
    }

    if (!syncSettings.gitUsername || !syncSettings.gitEmail || !syncSettings.gitRemoteUrl) {
      toast.error('Please fill in all Git configuration fields')
      return
    }

    setIsTesting(true)
    try {
      await adapters.gitAdapter.configGit(currentWorkspace.path, syncSettings.gitUsername, syncSettings.gitEmail, syncSettings.gitRemoteUrl)
      toast.success('Git configuration successful!')
    } catch (error) {
      toast.error(`Git configuration failed: ${error}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Save & Sync Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure how your notes are saved and synced with your git repository.
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
            checked={syncSettings.autoSaveEnabled}
            onChange={(e) => updateSyncSettings({ autoSaveEnabled: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {syncSettings.autoSaveEnabled && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Auto Save Interval</label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={syncSettings.autoSaveDelayInSeconds}
                onChange={(e) => updateSyncSettings({ autoSaveDelayInSeconds: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16">{syncSettings.autoSaveDelayInSeconds}s</span>
            </div>
            <p className="text-xs text-gray-500">
              Files will be saved automatically every {syncSettings.autoSaveDelayInSeconds} seconds
            </p>
          </div>
        )}
      </div>

      {/* Auto Sync */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Auto Sync</h4>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Enable Auto Sync</label>
            <p className="text-xs text-gray-500">Automatically sync changes to git repository</p>
          </div>
          <input
            type="checkbox"
            checked={syncSettings.autoSyncEnabled}
            onChange={(e) => updateSyncSettings({ autoSyncEnabled: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {syncSettings.autoSyncEnabled && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Auto Sync Interval</label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="60"
                max="1800"
                step="60"
                value={syncSettings.autoSyncDelayInSeconds}
                onChange={(e) => updateSyncSettings({ autoSyncDelayInSeconds: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-20">
                {Math.floor(syncSettings.autoSyncDelayInSeconds / 60)}m
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Changes will be synced automatically every {Math.floor(syncSettings.autoSyncDelayInSeconds / 60)} minutes
            </p>
          </div>
        )}
      </div>

      {/* Git Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Git Configuration</h4>
          {/* Config Git Button */}
          <button
            onClick={handleConfigGit}
            disabled={isTesting || !syncSettings.gitUsername || !syncSettings.gitEmail || !syncSettings.gitRemoteUrl}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Cable className="w-3 h-3" />
            {isTesting ? 'Connecting...' : 'Config & Connect'}
          </button>
        </div>

        {/* Git Username */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Git Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={syncSettings.gitUsername}
            onChange={(e) => updateSyncSettings({ gitUsername: e.target.value })}
            placeholder="your-github-username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500">Your GitHub username</p>
        </div>

        {/* Git Email */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Git Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={syncSettings.gitEmail}
            onChange={(e) => updateSyncSettings({ gitEmail: e.target.value })}
            placeholder="your-email@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500">Email address associated with your Git commits</p>
        </div>

        {/* Remote URL */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Remote URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={syncSettings.gitRemoteUrl}
            onChange={(e) => updateSyncSettings({ gitRemoteUrl: e.target.value })}
            placeholder="https://username:token@github.com/username/repository.git"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Full repository URL with authentication token included
          </p>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-yellow-900 mb-2">How to set up Git authentication</h5>
        <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
          <li>Create a Personal Access Token on GitHub with repo permissions</li>
          <li>Format your remote URL as: https://username:token@github.com/username/repo.git</li>
          <li>Enable auto-sync to automatically commit and push changes</li>
        </ol>
        <div className="mt-3">
          <a
            href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-yellow-700 hover:text-yellow-900 underline"
          >
            <span>Learn how to create a Personal Access Token</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-red-900 mb-1">Security Warning</h5>
            <p className="text-xs text-red-800">
              Your git credentials are stored locally and encrypted. Never share your Personal Access Token
              with others or commit it to your repository.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyncSettings