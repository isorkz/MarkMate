import React from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import Sidebar from './Sidebar'
import MainContent from './MainContent'
import WorkspaceOpener from '../workspace/WorkspaceOpener'
import LeftSideTopBar from './LeftSideTopBar'
import FullSearch from '../search/FullSearch'
import AIAssistantPanel from '../ai/AIAssistantPanel'
import ResizeHandle from './ResizeHandle'
import { useFullSearch } from '@renderer/hooks/useFullSearch'

const AppLayout: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore()
  const { toggleTOC, toggleSourceEditor } = useEditorStore()
  const { updateAppearanceSettings, updateAISettings, appearanceSettings, aiSettings } = useSettingsStore()

  // Full search functionality
  const {
    showSearch,
    openSearch,
    closeSearch,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
  } = useFullSearch()

  const toggleSidebar = () => {
    updateAppearanceSettings({ sidebarVisible: !appearanceSettings.sidebarVisible })
  }

  const handleFileTreeSidebarResize = (delta: number) => {
    const newWidth = appearanceSettings.sidebarWidth + delta
    updateAppearanceSettings({ sidebarWidth: Math.max(200, Math.min(400, newWidth)) })
  }

  const handleAISidebarResize = (delta: number) => {
    const newWidth = aiSettings.width - delta // negative because we're resizing from the right
    updateAISettings({ width: Math.max(250, Math.min(800, newWidth)) })
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'p':
            e.preventDefault()
            openSearch()
            break
          case '/':
            e.preventDefault()
            toggleSourceEditor()
            break
          case 'o':
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

      {appearanceSettings.sidebarVisible && (
        <>
          <div style={{ width: appearanceSettings.sidebarWidth }}>
            <Sidebar />
          </div>
          <ResizeHandle
            direction="vertical"
            onResize={handleFileTreeSidebarResize}
            className="flex-shrink-0"
          />
        </>
      )}

      <MainContent />

      {/* AI Chat Panel */}
      {aiSettings.isOpen && (
        <>
          <ResizeHandle
            direction="vertical"
            onResize={handleAISidebarResize}
            className="flex-shrink-0"
          />
          <div style={{ width: aiSettings.width }}>
            <AIAssistantPanel />
          </div>
        </>
      )}

      <FullSearch
        isOpen={showSearch}
        onClose={closeSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        isSearching={isSearching}
      />
    </div>
  )
}

export default AppLayout