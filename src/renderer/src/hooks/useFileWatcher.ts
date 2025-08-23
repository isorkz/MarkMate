import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '../stores/editorStore'
import { useFileSystemStore } from '../stores/fileSystemStore'
import { adapters } from '@renderer/adapters'
import { loadFileTree } from '../utils/fileOperations'

export interface ExternalFileChangeEvent {
  workspacePath: string
  type: 'change' | 'add' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  stats?: any
}

export function useFileWatcher() {
  const currentWorkspacePath = useWorkspaceStore(state => state.currentWorkspace?.path)
  const { setFileTree } = useFileSystemStore()
  const { tabs, updateTabContent, markTabDirty } = useEditorStore()
  const isWatchingRef = useRef(false)

  // Start watching workspace
  const startWatching = async (workspacePath: string) => {
    if (!workspacePath || isWatchingRef.current || !window.electron) return

    try {
      await window.electron.ipcRenderer.invoke('file:watch-workspace', workspacePath)
      isWatchingRef.current = true
      console.log('Started watching workspace:', workspacePath)
    } catch (error) {
      console.error('Failed to start watching workspace:', error)
    }
  }

  // Stop watching workspace
  const stopWatching = async (workspacePath: string) => {
    if (!workspacePath || !isWatchingRef.current || !window.electron) return

    try {
      await window.electron.ipcRenderer.invoke('file:unwatch-workspace', workspacePath)
      isWatchingRef.current = false
      console.log('Stopped watching workspace:', workspacePath)
    } catch (error) {
      console.error('Failed to stop watching workspace:', error)
    }
  }

  // Handle external file changes
  const handleExternalChange = async (event: ExternalFileChangeEvent) => {
    const { type, path: relativePath, workspacePath } = event

    // Only handle changes for current workspace
    if (workspacePath !== currentWorkspacePath) return

    switch (type) {
      case 'change': {
        // Check if the changed file is currently open in a tab
        const openTab = tabs.find(tab => tab.filePath === relativePath)
        
        if (openTab) {
          try {
            // Read the current file content
            const fileData = await adapters.fileAdapter.readFile(workspacePath, relativePath)
            
            // If content is the same as tab content, ignore the change
            if (fileData.content === openTab.content) {
              return
            }
            
            // Show confirmation dialog for reloading file content
            const shouldReload = window.confirm(
              `The file "${relativePath}" has been modified externally. Do you want to reload it? Warning: Any unsaved changes will be lost.`
            )
            
            if (shouldReload) {
              // Update the tab with new content
              updateTabContent(openTab.id, fileData.content)
              markTabDirty(openTab.id, false)
              
              toast.success(`File "${relativePath}" has been reloaded`)
            }
          } catch (error) {
            toast.error(`Failed to read file: ${relativePath}`)
            console.error('Failed to read file:', error)
          }
        }
        break
      }
      
      case 'add':
      case 'addDir': {
        // Refresh file tree to show new files/directories
        await loadFileTree(workspacePath, setFileTree)
        toast.success(`New ${type === 'addDir' ? 'folder' : 'file'}: ${relativePath}`)
        break
      }
      
      case 'unlink':
      case 'unlinkDir': {
        // Check if deleted file/dir was open in tabs
        const affectedTabs = tabs.filter(tab => 
          tab.filePath === relativePath || tab.filePath.startsWith(relativePath + '/')
        )
        
        if (affectedTabs.length > 0) {
          toast.error(`Open ${type === 'unlinkDir' ? 'folder' : 'file'} was deleted: ${relativePath}`)
          // TODO: Consider closing affected tabs or showing warning
        }
        
        // Refresh file tree to remove deleted items
        await loadFileTree(workspacePath, setFileTree)
        break
      }
    }
  }

  // Set up IPC listener for external file changes
  useEffect(() => {
    if (!window.electron) return

    const handleIpcChange = (_: any, event: ExternalFileChangeEvent) => {
      handleExternalChange(event)
    }

    const removeListener = window.electron.ipcRenderer.on('file:external-change', handleIpcChange)
    return removeListener
  }, [currentWorkspacePath, tabs])

  // Start/stop watching when workspace changes
  useEffect(() => {
    if (currentWorkspacePath) {
      startWatching(currentWorkspacePath)
    }

    return () => {
      if (currentWorkspacePath) {
        stopWatching(currentWorkspacePath)
      }
    }
  }, [currentWorkspacePath])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentWorkspacePath && isWatchingRef.current) {
        stopWatching(currentWorkspacePath)
      }
    }
  }, [])

  return {
    isWatching: isWatchingRef.current,
    startWatching,
    stopWatching
  }
}