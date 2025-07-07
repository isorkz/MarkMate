import React from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface SourceEditorProps {
  tab: Tab
}

const SourceEditor: React.FC<SourceEditorProps> = ({ tab }) => {
  const { updateTabContent } = useEditorStore()
  const { settings } = useSettingsStore()

  const onChange = (value: string) => {
    updateTabContent(tab.id, value)
  }

  if (!tab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No file selected
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <CodeMirror
        value={tab.content}
        height="100%"
        extensions={[markdown()]}
        theme={settings.theme === 'dark' ? oneDark : undefined}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
          defaultKeymap: false, // Disable default keymap to avoid conflicts, e.g. `cmd+/`
        }}
        style={{
          fontSize: `${settings.fontSize}px`,
          fontFamily: settings.fontFamily,
        }}
      />
    </div>
  )
}

export default SourceEditor