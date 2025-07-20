import toast from 'react-hot-toast'
import { useFilePathEventStore } from '../stores/events/filePathEventStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '@renderer/stores/editorStore'
import { checkSyncStatus } from './checkSyncStatus'

export const loadFileTree = async (workspacePath: string, setFileTree: (tree: any) => void) => {
  try{
    const newFileTree = await window.electron.ipcRenderer.invoke('workspace:get-file-tree', workspacePath)
    setFileTree(newFileTree)
  } catch (error) {
    console.error('Failed to load workspace file tree:', error)
    throw error
  }
}

export const handleOpenFile = async (workspacePath: string, filePath: string, pinned: boolean) => {
  try {
    // Check if file is already open
    const { tabs, setActiveTab, pinTab, openFile, updateTabSyncStatus } = useEditorStore.getState()
    const existingTab = tabs.find(tab => tab.filePath === filePath)
    let tabId = existingTab?.id
    if (existingTab) {
      // File is already open, just switch to that tab
      setActiveTab(existingTab.id)
      if (pinned && !existingTab.isPinned) {
        pinTab(existingTab.id)
      }
    } else{
      // File is not open, read content and open it
      const [content, lastModified] = await Promise.all([
        window.electron.ipcRenderer.invoke('file:read', workspacePath, filePath),
        window.electron.ipcRenderer.invoke('file:get-last-modified-time', workspacePath, filePath)
      ])
      
      // Open the file in the editor
      tabId = openFile(filePath, content, pinned, new Date(lastModified))
      // Add to recent files
      useWorkspaceStore.getState().addRecentFile(filePath)
    }
    
    // Async check sync status, to avoid blocking opening the file
    // checkSyncStatus will always return a result without throwing an error
    checkSyncStatus(workspacePath, filePath).then((syncStatus) => {
      if (tabId){
        updateTabSyncStatus(tabId, syncStatus)
      }
    })
  } catch (error) {
    console.error('Failed to open file:', error)
    toast.error('Failed to open file: ' + error)
  }
}

export const handleNewFile = async (workspacePath: string, parentPath: string, fileName: string, setFileTree: (tree: any) => void) => {
  let mdFileName = fileName.trim()
  // Auto-add .md extension for new files if not present
  if (!mdFileName.includes('.')) {
    mdFileName = `${mdFileName}.md`
  }
  const filePath = `${parentPath}/${mdFileName}`
  
  try {
    await window.electron.ipcRenderer.invoke('file:create', workspacePath, filePath, '')
    await loadFileTree(workspacePath, setFileTree)
    toast.success(`File "${mdFileName}" created successfully`)
  } catch (error) {
    console.error('Failed to create file: ', error)
    toast.error('Failed to create file: ' + error)
  }
}

export const handleNewFolder = async (workspacePath: string, parentPath: string, folderName: string, setFileTree: (tree: any) => void) => {
  let newFolderName = folderName.trim()
  const filePath = parentPath ? `${parentPath}/${newFolderName}` : newFolderName
  
  try {
    await window.electron.ipcRenderer.invoke('file:create-directory', workspacePath, filePath)
    await loadFileTree(workspacePath, setFileTree)
    toast.success(`Folder "${newFolderName}" created successfully`)
  } catch (error) {
    console.error('Failed to create folder:', error)
    toast.error('Failed to create folder:' + error)
  }
}

export const handleRename = async (workspacePath: string, oldPath: string, oldName: string, newName: string, isFolder: boolean) => {
  const pathParts = oldPath.split('/')
  let newMdName = newName.trim()
  if (oldName === newMdName) {
    return
  }

  // Auto-add .md extension for new files if not present
  if (!isFolder && !newMdName.endsWith('.md')) {
    newMdName = `${newMdName}.md`
  }

  const newPath = [...pathParts.slice(0, -1), newMdName].join('/')
  
  try {
    await window.electron.ipcRenderer.invoke('file:rename', workspacePath, oldPath, newPath)
    
    // Notify all stores about the path change
    useFilePathEventStore.getState().notifyPathChange(oldPath, newPath)
    toast.success('File renamed successfully')
  } catch (error) {
    console.error('Failed to rename:', error)
    toast.error('Failed to rename:' + error)
  }
}

export const handleSave = async (workspacePath: string, filePath: string, tabId: string, content: string, markTabDirty: (tabId: string, isDirty: boolean) => void) => {
  try {
    await window.electron.ipcRenderer.invoke('file:write', workspacePath, filePath, content)
    markTabDirty(tabId, false)
  } catch (error) {
    console.error('Failed to save file:', error)
    throw error
  }
}

export const handleDelete = async (workspacePath: string, filePath: string, setFileTree: (tree: any) => void) => {
  try {
    await window.electron.ipcRenderer.invoke('file:delete', workspacePath, filePath)
    
    // Notify all stores about the path deletion
    useFilePathEventStore.getState().notifyPathDelete(filePath)
    await loadFileTree(workspacePath, setFileTree)
    toast.success('File deleted successfully')
  } catch (error) {
    console.error('Failed to delete:', error)
    toast.error('Failed to delete:' + error)
  }
}