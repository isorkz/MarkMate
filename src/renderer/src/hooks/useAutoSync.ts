import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { Tab } from '../stores/editorStore'
import type { SyncStatus } from '../components/version/SyncStatusIcon'
import { formatDate } from '../../../shared/commonUtils'

interface UseAutoSyncOptions {
  delayInSeconds: number
  enabled: boolean
}

export const useAutoSync = (tab: Tab | null, options: UseAutoSyncOptions) => {
  const { delayInSeconds, enabled } = options
  const { currentWorkspace } = useWorkspaceStore()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('out-of-date')
  const [lastSyncedContent, setLastSyncedContent] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize sync status by checking Git status
  useEffect(() => {
    if (!tab || !currentWorkspace || isInitialized) return

    const initializeSyncStatus = async () => {
      try {
        // Check if file has uncommitted changes using git status
        const statusResult = await window.electron.ipcRenderer.invoke('git:file-status', currentWorkspace.path, tab.filePath)
        
        if (statusResult.hasChanges) {
          // File has uncommitted changes
          setSyncStatus('out-of-date')
        } else {
          // File is in sync with Git
          setLastSyncedContent(tab.content)
          setSyncStatus('synced')
        }
      } catch (error) {
        console.warn('Failed to initialize sync status:', error)
        setSyncStatus('error')
      } finally {
        setIsInitialized(true)
      }
    }

    initializeSyncStatus()
  }, [tab?.filePath, currentWorkspace, isInitialized])

  // Check if content has changed since last sync
  useEffect(() => {
    if (!tab || !isInitialized) return
    
    if (tab.content.trim() !== '' && tab.content !== lastSyncedContent) {
      setSyncStatus('out-of-date')
    }
  }, [tab?.content, lastSyncedContent, isInitialized])

  useEffect(() => {
    if (!tab || !currentWorkspace || !enabled) return
    if (tab.hasUnsavedChanges) return // Wait for auto-save first
    if (tab.content === lastSyncedContent) return // Already synced

    const syncFile = async () => {
      try {
        setSyncStatus('syncing')
        
        // Commit the changes to version control
        const commitMessage = `Auto-sync at ${formatDate(tab.lastModified)}`
        await window.electron.ipcRenderer.invoke('git:commit', currentWorkspace.path, tab.filePath, commitMessage)
        
        setLastSyncedContent(tab.content)
        setSyncStatus('synced')
      } catch (error) {
        console.warn('Auto-sync failed:', error)
        setSyncStatus('error')
      }
    }

    const autoSyncTimer = setTimeout(syncFile, delayInSeconds * 1000)
    return () => clearTimeout(autoSyncTimer)
  }, [tab?.content, tab?.hasUnsavedChanges, tab?.id, tab?.filePath, currentWorkspace, delayInSeconds, enabled, lastSyncedContent])

  return { syncStatus }
}