import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Settings, GalleryVerticalEnd, RefreshCw } from 'lucide-react'
import VersionHistory from '../version/VersionHistory'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkspaceStore } from '@renderer/stores/workspaceStore'
import { useEditorStore } from '@renderer/stores/editorStore'
import { syncWorkspace } from '@renderer/utils/syncOperation'
import { formatDate } from '../../../../shared/commonUtils'

const OptionsMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'conflict' | 'out-of-date'>('idle')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { tabs, activeTabId } = useEditorStore()
  const { openSettings } = useSettingsStore()
  const { currentWorkspace } = useWorkspaceStore()

  const activeTab = tabs.find(tab => tab.id === activeTabId) || null

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOpenSettings = () => {
    openSettings('general')
    setIsOpen(false)
  }

  const handleShowVersionHistory = () => {
    if (activeTab) {
      setShowVersionHistory(true)
      setIsOpen(false)
    }
  }

  const handleManualSync = async () => {
    if (!currentWorkspace || syncStatus === 'syncing') {
      return
    }

    setSyncStatus('syncing')

    const commitMessage = `Manual sync at ${formatDate(new Date())}`
    const result = await syncWorkspace(currentWorkspace.path, tabs, commitMessage)
    setSyncStatus(result === 'synced' ? 'success' : result)

    switch (result) {
      case 'synced':
        toast.success('Workspace synced successfully')
        break
      case 'conflict':
        toast.error('Sync conflict: Please save all files first or resolve conflicts')
        break
      case 'error':
        toast.error('Sync failed: Network or git error occurred')
        break
      default:
        toast.error('Unknown sync status')
    }

    // Reset status to idle after 5 seconds
    setTimeout(() => {
      setSyncStatus('idle')
    }, 5000)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        style={{ WebkitAppRegion: 'no-drag' }}
        title="Options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 text-sm text-gray-900 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {activeTab && (
            <>
              <button
                onClick={handleShowVersionHistory}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <GalleryVerticalEnd className="w-4 h-4" />
                Version History
              </button>

              <div className="mx-3 border-t border-gray-100 my-0.5" />
            </>
          )}

          <button
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''
                } ${syncStatus === 'success' ? 'text-green-500' :
                  syncStatus === 'error' ? 'text-red-500' :
                    syncStatus === 'conflict' ? 'text-yellow-500' : ''
                }`}
            />
            Sync Workspace
          </button>

          <div className="mx-3 border-t border-gray-100 my-0.5" />

          <button
            onClick={handleOpenSettings}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      )}

      {/* Version History Modal */}
      {activeTab && (
        <VersionHistory
          isOpen={showVersionHistory}
          setShowVersionHistory={setShowVersionHistory}
          tab={activeTab}
        />
      )}
    </div>
  )
}

export default OptionsMenu