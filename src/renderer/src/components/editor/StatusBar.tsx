import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { formatDate } from '../../../../shared/commonUtils'

const StatusBar: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore()
  const activeTab = tabs.find(tab => tab.id === activeTabId) || null

  if (!activeTab) {
    return null
  }

  return (
    <div className="inline-flex items-center px-3 py-1 bg-gray-50 border-t border-l border-gray-200 text-xs text-gray-500 h-6 rounded-tl-md shadow-sm">
      <span>{formatDate(activeTab.lastModified)}</span>
    </div>
  )
}

export default StatusBar