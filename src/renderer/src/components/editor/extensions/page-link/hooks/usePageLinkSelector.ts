import { useState, useCallback } from 'react'
import { FileNode } from '@renderer/types'
import { useWorkspaceStore } from '@renderer/stores/workspaceStore'
import { useEditorStore } from '@renderer/stores/editorStore'
import toast from 'react-hot-toast'
import { adapters } from '@renderer/adapters'

export const usePageLinkSelector = () => {
  const { currentWorkspace } = useWorkspaceStore()
  const { tabs, activeTabId } = useEditorStore()
  
  const activeTab = activeTabId ? tabs.find(tab => tab.id === activeTabId) : null

  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [files, setFiles] = useState<FileNode[]>([])
  const [editor, setEditor] = useState<any>(null)

  const showSelector = useCallback((
    editorInstance: any,
    pos: { x: number; y: number },
    fileList: FileNode[]
  ) => {
    setEditor(editorInstance)
    setPosition(pos)
    setFiles(fileList)
    setIsOpen(true)
  }, [])

  const onClose = useCallback(() => {
    setIsOpen(false)
    setEditor(null)
    setFiles([])
  }, [])

  const onSelect = useCallback(async (file: FileNode) => {
    if (!currentWorkspace || !activeTab) return

    try {
      // Calculate relative path from current file to target file
      const relativePath = await adapters.fileAdapter.getRelativePath(
        currentWorkspace.path,
        activeTab.filePath,
        file.path
      )
      
      // Extract page name from file name (remove extension)
      const pageName = file.name.replace(/\.[^.]*$/, '')
      
      // Use the custom PageLink command to insert a clickable page link
      editor.chain()
        .focus()
        .setPageLink({ pageName, relativePath: relativePath })
        .run()
    } catch (error) {
      console.error('Error calculating relative path:', error)
      toast.error(`Failed to calculate relative path for page link "${file.path}"`)
    }

    onClose()
  }, [editor, currentWorkspace, activeTab, onClose])

  return {
    isOpen,
    files,
    position,
    showSelector,
    onSelect,
    onClose
  }
}