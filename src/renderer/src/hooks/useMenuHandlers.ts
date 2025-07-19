import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useEditorStore } from '../stores/editorStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { handleSave, handleOpenFile } from '../utils/fileOperations'

export const useMenuHandlers = () => {
  const { 
    activeTabId, 
    tabs,
    closeTab,
    toggleSourceEditor,
    toggleTOC,
    markTabDirty 
  } = useEditorStore()
  
  const { 
    updateSettings 
  } = useSettingsStore()
  
  const { 
    currentWorkspace, 
    recentFiles,
    clearRecentFiles
  } = useWorkspaceStore()

  useEffect(() => {
    // File menu handlers
    const handleCloseTab = () => {
      if (activeTabId) {
        const tab = tabs.find(t => t.id === activeTabId)
        if (tab?.hasUnsavedChanges) {
          const confirmed = window.confirm(
            `"${tab.title}" has unsaved changes. Are you sure you want to close it?`
          )
          if (!confirmed) {
            return
          }
        }
        closeTab(activeTabId)
      }
    }

    const handleSaveTab = async () => {
      if (!activeTabId || !currentWorkspace) return
      
      const activeTab = tabs.find(tab => tab.id === activeTabId)
      if (!activeTab) return
      
      try {
        await handleSave(currentWorkspace.path, activeTab.filePath, activeTab.id, activeTab.content, markTabDirty)
      } catch (error) {
        console.error('Failed to save tab:', error)
        toast.error('Failed to save file: ' + error)
      }
    }

    // Edit menu handlers
    const handleFindInDocument = () => {
      // Trigger the existing Cmd+F keyboard shortcut
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'f',
        metaKey: true,
        ctrlKey: true,
        bubbles: true
      }))
    }

    const handleFullSearch = () => {
      // Trigger the existing Cmd+P keyboard shortcut
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        ctrlKey: true,
        bubbles: true
      }))
    }

    // View menu handlers
    const handleToggleReadOnly = (_, isReadOnly: boolean) => {
      updateSettings('readOnlyMode', isReadOnly)
    }

    const handleToggleSourceEditor = () => {
      toggleSourceEditor()
    }

    const handleToggleTOC = () => {
      toggleTOC()
    }

    // Recent files handlers
    const handleOpenRecentFile = async (_, filePath: string) => {
      if (!currentWorkspace) return
      
      try {
        handleOpenFile(currentWorkspace.path, filePath, false) // false = unpinned
      } catch (error) {
        console.error('Failed to open recent file:', error)
        toast.error(`Failed to open ${filePath.split('/').pop()}`)
      }
    }

    const handleClearRecentFiles = () => {
      clearRecentFiles()
    }

    // Register IPC listeners
    window.electron.ipcRenderer.on('menu:close-tab', handleCloseTab)
    window.electron.ipcRenderer.on('menu:save-tab', handleSaveTab)
    window.electron.ipcRenderer.on('menu:find-in-document', handleFindInDocument)
    window.electron.ipcRenderer.on('menu:full-search', handleFullSearch)
    window.electron.ipcRenderer.on('menu:toggle-read-only', handleToggleReadOnly)
    window.electron.ipcRenderer.on('menu:toggle-source-editor', handleToggleSourceEditor)
    window.electron.ipcRenderer.on('menu:toggle-toc', handleToggleTOC)
    window.electron.ipcRenderer.on('menu:open-recent-file', handleOpenRecentFile)
    window.electron.ipcRenderer.on('menu:clear-recent-files', handleClearRecentFiles)

    // Cleanup
    return () => {
      window.electron.ipcRenderer.removeAllListeners('menu:close-tab')
      window.electron.ipcRenderer.removeAllListeners('menu:save-tab')
      window.electron.ipcRenderer.removeAllListeners('menu:find-in-document')
      window.electron.ipcRenderer.removeAllListeners('menu:full-search')
      window.electron.ipcRenderer.removeAllListeners('menu:toggle-read-only')
      window.electron.ipcRenderer.removeAllListeners('menu:toggle-source-editor')
      window.electron.ipcRenderer.removeAllListeners('menu:toggle-toc')
      window.electron.ipcRenderer.removeAllListeners('menu:open-recent-file')
      window.electron.ipcRenderer.removeAllListeners('menu:clear-recent-files')
    }
  }, [activeTabId, tabs, currentWorkspace, closeTab, toggleSourceEditor, updateSettings, markTabDirty])

  // Update menu when recent files change
  useEffect(() => {
    const updateMenu = async () => {
      try {
        await window.electron.ipcRenderer.invoke('menu:update-recent-files', recentFiles)
      } catch (error) {
        console.error('Failed to update menu:', error)
      }
    }
    
    updateMenu()
  }, [recentFiles])
}