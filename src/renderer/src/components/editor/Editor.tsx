import React from 'react'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useManualSave } from '../../hooks'
import SourceEditor from './SourceEditor'
import RichEditor from './RichEditor'
import TOCPanel from '../editor/TOCPanel'

interface EditorProps {
  tab: Tab
}

const Editor: React.FC<EditorProps> = ({ tab }) => {
  const { showSourceEditor, showTOC } = useEditorStore()

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

      {showTOC && (
        <div className="w-sidebar border-l border-gray-200">
          <TOCPanel />
        </div>
      )}
    </div>
  )
}

export default Editor