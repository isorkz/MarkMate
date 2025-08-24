import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Settings, GalleryVerticalEnd, RefreshCw, Unlink, Image } from 'lucide-react'
import VersionHistory from '../version/VersionHistory'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkspaceStore } from '@renderer/stores/workspaceStore'
import { useEditorStore } from '@renderer/stores/editorStore'
import { syncWorkspace } from '@renderer/utils/syncOperation'
import { BrokenPageLinksValidator, PageLinkValidationResult } from '@renderer/utils/link-validator/BrokenPageLinksValidator'
import { BrokenImageLinksValidator, ImageLinkValidationResult } from '@renderer/utils/link-validator/BrokenImageLinksValidator'
import BrokenPageLinksDialog from './BrokenPageLinksDialog'
import BrokenImagesDialog from './BrokenImagesDialog'

const OptionsMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'conflict' | 'needs-sync'>('idle')
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  const [showBrokenPageLinks, setShowBrokenPageLinks] = useState(false)
  const [brokenPageLinksResults, setBrokenPageLinksResults] = useState<PageLinkValidationResult[]>([])
  const [isValidatingPageLinks, setIsValidatingPagePageLinks] = useState(false)

  const [showBrokenImages, setShowBrokenImages] = useState(false)
  const [brokenImagesResults, setBrokenImagesResults] = useState<ImageLinkValidationResult[]>([])
  const [isValidatingImages, setIsValidatingImages] = useState(false)

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

    const result = await syncWorkspace(currentWorkspace.path, "Manual sync")
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

  const handleCheckBrokenPageLinks = async () => {
    if (!currentWorkspace || isValidatingPageLinks) {
      return
    }

    setIsValidatingPagePageLinks(true)
    setIsOpen(false)

    try {
      const results = await BrokenPageLinksValidator.validateAllPageLinks(currentWorkspace.path)
      setBrokenPageLinksResults(results)
      setShowBrokenPageLinks(true)

      if (results.length === 0) {
        toast.success('All pagelinks are valid!')
      }
    } catch (error) {
      console.error('Failed to validate pagelinks:', error)
      toast.error('Failed to check pagelinks')
    } finally {
      setIsValidatingPagePageLinks(false)
    }
  }

  const handleCheckBrokenImages = async () => {
    if (!currentWorkspace || isValidatingImages) {
      return
    }

    setIsValidatingImages(true)
    setIsOpen(false)

    try {
      const results = await BrokenImageLinksValidator.validateAllImageLinks(currentWorkspace.path)
      setBrokenImagesResults(results)
      setShowBrokenImages(true)

      if (results.length === 0) {
        toast.success('All image links are valid!')
      }
    } catch (error) {
      console.error('Failed to validate image links:', error)
      toast.error('Failed to check image links')
    } finally {
      setIsValidatingImages(false)
    }
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
        <div className="absolute right-0 top-full mt-1 w-56 text-sm text-gray-900 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
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
            onClick={handleCheckBrokenPageLinks}
            disabled={isValidatingPageLinks}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Unlink
              className={`w-4 h-4 ${isValidatingPageLinks ? 'animate-pulse text-yellow-500' : 'text-gray-600'}`}
            />
            Check Broken PageLinks
          </button>

          <button
            onClick={handleCheckBrokenImages}
            disabled={isValidatingImages}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Image
              className={`w-4 h-4 ${isValidatingImages ? 'animate-pulse text-yellow-500' : 'text-gray-600'}`}
            />
            Check Broken Images
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

      {/* Broken Links Dialog */}
      <BrokenPageLinksDialog
        isOpen={showBrokenPageLinks}
        onClose={() => setShowBrokenPageLinks(false)}
        results={brokenPageLinksResults}
      />

      {/* Broken Images Dialog */}
      <BrokenImagesDialog
        isOpen={showBrokenImages}
        onClose={() => setShowBrokenImages(false)}
        results={brokenImagesResults}
      />
    </div>
  )
}

export default OptionsMenu