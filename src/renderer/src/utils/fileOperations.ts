import toast from 'react-hot-toast'
import { useFilePathEventStore } from '../stores/events/filePathEventStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useEditorStore } from '@renderer/stores/editorStore'
import { adapters } from '../adapters'
import { getSyncStatus, completeGitMerge, syncWorkspace } from './syncOperation'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { FileNode } from '@shared/types/file'

// Helper function to get all markdown files from the file tree
export const getAllMarkdownFiles = (nodes: FileNode[]): FileNode[] => {
  const markdownFiles: FileNode[] = []

  const traverse = (nodeList: FileNode[]) => {
    for (const node of nodeList) {
      if (node.type === 'file' && node.path.endsWith('.md')) {
        markdownFiles.push(node)
      }
      if (node.children) {
        traverse(node.children)
      }
    }
  }

  traverse(nodes)
  return markdownFiles
}

export const loadFileTree = async (workspacePath: string, setFileTree: (tree: any) => void) => {
  try{
    const newFileTree = await adapters.workspaceAdapter.getFileTree(workspacePath)
    setFileTree(newFileTree)
  } catch (error) {
    console.error('Failed to load workspace file tree:', error)
    throw error
  }
}

const checkAndUpdateFileSyncStatusAsync = async (workspacePath: string, filePath: string, tabId: string) => {
  // if (useSettingsStore.getState().syncSettings.autoSyncEnabled) {
    // Async check sync status, to avoid blocking opening the file
    // getSyncStatus will always return a result without throwing an error
    getSyncStatus(workspacePath, filePath).then((syncStatus) => {
      useEditorStore.getState().updateTabSyncStatus(tabId, syncStatus)
    })
  // }
}

export const handleOpenFile = async (workspacePath: string, filePath: string, pinned: boolean) => {
  try {
    // Check if file is already open
    const { tabs, setActiveTab, pinTab, openFile } = useEditorStore.getState()
    const existingTab = tabs.find(tab => tab.filePath === filePath)
    if (existingTab) {
      // File is already open, just switch to that tab
      setActiveTab(existingTab.id)
      if (pinned && !existingTab.isPinned) {
        pinTab(existingTab.id)
      }
    } else{
      // File is not open, read content and open it
      const fileData = await adapters.fileAdapter.readFile(workspacePath, filePath)
      
      // Open the file in the editor
      openFile(filePath, fileData.content, pinned, fileData.lastModified)
      // Add to recent files
      useWorkspaceStore.getState().addRecentFile(filePath)
    }
    
    if (useSettingsStore.getState().syncSettings.autoSyncEnabled) {
      syncWorkspace(workspacePath, "Auto sync")
    }
  } catch (error) {
    console.error('Failed to open file:', error)
    toast.error('Failed to open file: ' + error)
  }
}

export const handleSave = async (workspacePath: string, filePath: string, tabId: string, content: string, markTabDirty: (tabId: string, isDirty: boolean) => void) => {
  try {
    await adapters.fileAdapter.writeFile(workspacePath, filePath, content)
    markTabDirty(tabId, false)
    
    // If tab was in conflict state, check if conflicts are resolved
    const { tabs, updateTabSyncStatus } = useEditorStore.getState()
    const tab = tabs.find(t => t.id === tabId)
    const wasInConflict = tab?.syncStatus === 'conflict'
    if (wasInConflict) {
      const hasConflictMarkers = content.includes('<<<<<<< HEAD') || 
                                content.includes('=======') || 
                                content.includes('>>>>>>> ')
      
      if (!hasConflictMarkers) {
        // No more conflict markers, complete the git merge
        try {
          await completeGitMerge(workspacePath)
          updateTabSyncStatus(tabId, 'synced')
        } catch (mergeError) {
          console.error('Failed to complete git merge:', mergeError)
        }
      }
    } else {
      // Normal save, update sync status as usual
      checkAndUpdateFileSyncStatusAsync(workspacePath, filePath, tabId)
    }
  } catch (error) {
    console.error('Failed to save file:', error)
    throw error
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
    await adapters.fileAdapter.createFile(workspacePath, filePath, '')
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
    await adapters.fileAdapter.createDirectory(workspacePath, filePath)
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
    await adapters.fileAdapter.renameFile(workspacePath, oldPath, newPath)
    
    // Notify all stores about the path change
    useFilePathEventStore.getState().notifyPathChange(oldPath, newPath)
    toast.success('File renamed successfully')
  } catch (error) {
    console.error('Failed to rename:', error)
    toast.error('Failed to rename:' + error)
  }
}

export const handleDelete = async (workspacePath: string, filePath: string, setFileTree: (tree: any) => void) => {
  try {
    await adapters.fileAdapter.deleteFile(workspacePath, filePath)
    
    // Notify all stores about the path deletion
    useFilePathEventStore.getState().notifyPathDelete(filePath)
    await loadFileTree(workspacePath, setFileTree)
    toast.success('File deleted successfully')
  } catch (error) {
    console.error('Failed to delete:', error)
    toast.error('Failed to delete:' + error)
  }
}

export const handleMoveFile = async (
  workspacePath: string,
  sourceNode: FileNode,
  targetPath: string,
  setFileTree: (tree: any) => void
) => {
  try {
    const sourcePathParts = sourceNode.path.split('/')
    const fileName = sourcePathParts[sourcePathParts.length - 1]
    
    // if targetPath === '', means move to workspace root
    const newPath = targetPath === '' ? fileName : `${targetPath}/${fileName}`
    
    if (sourceNode.path === newPath) {
      return
    }
    
    if (sourceNode.type === 'folder' && newPath.startsWith(sourceNode.path + '/')) {
      return
    }
    
    console.log('Moving file from', sourceNode.path, 'to', newPath)
    await adapters.fileAdapter.renameFile(workspacePath, sourceNode.path, newPath)
    useFilePathEventStore.getState().notifyPathChange(sourceNode.path, newPath)
    await loadFileTree(workspacePath, setFileTree)
  } catch (error) {
    console.error('Failed to move file:', error)
    toast.error('Failed to move: ' + error)
  }
}
