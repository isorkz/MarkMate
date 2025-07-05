import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'

const TitleBar: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore()
  const { currentWorkspace } = useWorkspaceStore()

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const getRelativePath = (filePath: string) => {
    if (!currentWorkspace || !filePath) return filePath
    return filePath.replace(currentWorkspace.path, '').replace(/^\//, '')
  }

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) {
        return 'Unknown'
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      return 'Unknown'
    }
  }

  return (
    <div
      className="h-8 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 text-sm text-gray-600"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-4">
        {activeTab && (
          <span className="font-mono">{getRelativePath(activeTab.filePath)}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {activeTab && (
          <>
            <span>Modified {formatDate(activeTab.lastModified)}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default TitleBar