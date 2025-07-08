import React from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import Sidebar from './Sidebar'
import MainContent from './MainContent'
import TOCPanel from '../editor/TOCPanel'
import WorkspaceOpener from '../workspace/WorkspaceOpener'
import LeftSideTopBar from './LeftSideTopBar'

const AppLayout: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore()
  const { toggleTOC, toggleSourceEditor, showTOC } = useEditorStore()
  const { updateSettings, settings } = useSettingsStore()

  const toggleSidebar = () => {
    updateSettings('sidebarVisible', !settings.sidebarVisible)
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '/':
            e.preventDefault()
            toggleSourceEditor()
            break
          case 't':
            e.preventDefault()
            toggleTOC()
            break
          case 'b':
            if (e.shiftKey) {
              e.preventDefault()
              toggleSidebar()
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleTOC, toggleSourceEditor, toggleSidebar])

  if (!currentWorkspace) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to MarkMate</h2>
          <WorkspaceOpener />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white overflow-x-hidden relative">
      <LeftSideTopBar />
      
      {settings.sidebarVisible && <Sidebar />}

      <MainContent />

      {showTOC && (
        <div className="w-64 border-l border-gray-200">
          {/* <TOCPanel /> */}
        </div>
      )}
    </div>
  )
}

export default AppLayout