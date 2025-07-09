import React from 'react'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useAutoSave, useManualSave } from '../../hooks'
import SourceEditor from './SourceEditor'
import RichEditor from './RichEditor'

interface EditorProps {
  tab: Tab
}

const Editor: React.FC<EditorProps> = ({ tab }) => {
  const { showSourceEditor } = useEditorStore()
  const { currentWorkspace } = useWorkspaceStore()

  // Use auto-save hook with workspace settings
  useAutoSave(tab, {
    enabled: currentWorkspace?.settings?.autoSave ?? true,
    delay: currentWorkspace?.settings?.autoSaveDelay ?? 10000
  })

  // Use manual save hook
  useManualSave(tab)

  return (
    <div className="flex flex-1 overflow-hidden">
      {showSourceEditor && (
        <div className="flex-1 border-r border-gray-200 min-w-0">
          <SourceEditor tab={tab} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <RichEditor tab={tab} />
      </div>
    </div>
  )
}

export default Editor