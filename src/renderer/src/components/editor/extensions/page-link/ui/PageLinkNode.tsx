import React from 'react'
import { NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import { FileText, ExternalLink } from 'lucide-react'
import { useWorkspaceStore } from '@renderer/stores/workspaceStore'
import { useEditorStore } from '@renderer/stores/editorStore'
import { handleOpenFile } from '@renderer/utils/fileOperations'
import toast from 'react-hot-toast'

const PageLinkNode: React.FC<ReactNodeViewProps> = ({ node }) => {
  const { pageName, relativePath } = node.attrs as { pageName: string; relativePath: string }
  const { currentWorkspace } = useWorkspaceStore()
  const { tabs, activeTabId } = useEditorStore()

  const activeTab = activeTabId ? tabs.find(tab => tab.id === activeTabId) : null

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!currentWorkspace || !activeTab) return

    if (!pageName || !relativePath) {
      console.error('Cannot find pageName or relativePath in node attributes', node.attrs)
      toast.error(`Page "${pageName}" path not found`)
      return
    }

    try {
      // Resolve the relative filepath to workspace-relative path
      const workspaceRelativePath = await window.electron.ipcRenderer.invoke(
        'file:resolve-relative-path',
        currentWorkspace.path,
        activeTab.filePath,
        relativePath
      )

      // Open the file in a new tab
      handleOpenFile(currentWorkspace.path, workspaceRelativePath, false) // false = unpinned tab
    } catch (error) {
      console.error('Error opening page:', error)
      toast.error(`Failed to open "${pageName}"`)
    }
  }

  return (
    <NodeViewWrapper className="inline">
      <span
        onClick={handleClick}
        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm border border-blue-200 dark:border-blue-800 no-underline"
        title={`Click to open "${relativePath}"`}
        data-type="page-link"
        data-relative-path={relativePath}
        contentEditable={false}
      >
        <FileText className="w-3 h-3" />
        <span>{pageName}</span>
        <ExternalLink className="w-3 h-3 opacity-60" />
      </span>
    </NodeViewWrapper>
  )
}

export default PageLinkNode