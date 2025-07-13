import toast from 'react-hot-toast'
import { useFilePathEventStore } from '../stores/events/filePathEventStore'

export const loadFileTree = async (workspacePath: string, setFileTree: (tree: any) => void) => {
  try{
    const newFileTree = await window.electron.ipcRenderer.invoke('workspace:get-file-tree', workspacePath)
    setFileTree(newFileTree)
  } catch (error) {
    console.error('Failed to load workspace file tree:', error)
    throw error
  }
}

export const handleOpenFile = async (workspacePath: string, filePath: string, pinned: boolean, openFile: (path: string, content: string, pinned: boolean, lastModified?: Date) => void) => {
  try {
      const [content, lastModified] = await Promise.all([
        window.electron.ipcRenderer.invoke('file:read', workspacePath, filePath),
        window.electron.ipcRenderer.invoke('file:get-last-modified-time', workspacePath, filePath)
      ])
      openFile(filePath, content, pinned, new Date(lastModified))
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

export const handleRename = async (workspacePath: string, oldPath: string, oldName: string, newName: string) => {
  const pathParts = oldPath.split('/')
  let isMdFile = oldName.endsWith('.md')
  let newFinalName = newName.trim()
  // Auto-add .md extension for new files if not present
  if (isMdFile && !newFinalName.includes('.')) {
    newFinalName = `${newFinalName}.md`
  }
  if (oldName === newFinalName) {
    return
  }

  const newPath = [...pathParts.slice(0, -1), newFinalName].join('/')
  
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