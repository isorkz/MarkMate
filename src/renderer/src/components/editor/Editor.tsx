import React from 'react'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAutoSave, useManualSave } from '../../hooks'
import SourceEditor from './SourceEditor'
import RichEditor from './RichEditor'

interface EditorProps {
  tab: Tab
}

const Editor: React.FC<EditorProps> = ({ tab }) => {
  const { showSourceEditor } = useEditorStore()
  const { settings } = useSettingsStore()

  // Use auto-save hook with settings
  useAutoSave(tab, {
    enabled: settings.autoSave,
    delayInSeconds: settings.autoSaveDelayInSeconds
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