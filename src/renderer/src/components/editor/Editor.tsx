import React from 'react'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useManualSave } from '../../hooks'
import SourceEditor from './SourceEditor'
import RichEditor from './RichEditor'
import TOCPanel from '../editor/TOCPanel'

interface EditorProps {
  tab: Tab
}

const Editor: React.FC<EditorProps> = ({ tab }) => {
  const { showSourceEditor, showTOC } = useEditorStore()
  const { settings } = useSettingsStore()

  // Use manual save hook
  useManualSave(tab)

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Read Only Mode Indicator */}
      {settings.readOnlyMode && (
        <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-sm font-medium shadow-md border ${
          settings.theme === 'dark' 
            ? 'bg-yellow-900 text-yellow-200 border-yellow-700' 
            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }`}>
          Read Only Mode
        </div>
      )}

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