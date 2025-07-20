import React from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import Sidebar from './Sidebar'
import MainContent from './MainContent'
import WorkspaceOpener from '../workspace/WorkspaceOpener'
import LeftSideTopBar from './LeftSideTopBar'
import FullSearch from '../search/FullSearch'
import { useFullSearch } from '@renderer/hooks/useFullSearch'

const AppLayout: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore()
  const { toggleTOC, toggleSourceEditor } = useEditorStore()
  const { updateAppearanceSettings, appearanceSettings } = useSettingsStore()

  // Full search functionality
  const {
    showSearch,
    openSearch,
    closeSearch,
    searchTerm,
    setSearchTerm,
    searchResults,
  } = useFullSearch()

  const toggleSidebar = () => {
    updateAppearanceSettings({ sidebarVisible: !appearanceSettings.sidebarVisible })
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

      {appearanceSettings.sidebarVisible && <Sidebar />}

      <MainContent />

      <FullSearch
        isOpen={showSearch}
        onClose={closeSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
      />
    </div>
  )
}

export default AppLayout