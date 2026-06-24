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
  const { workspaces, currentWorkspace, addWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const { toggleTOC, toggleSourceEditor } = useEditorStore()
  const { updateAppearanceSettings, updateAISettings, appearanceSettings, aiSettings } =
    useSettingsStore()
  const [workspaceBootstrapError, setWorkspaceBootstrapError] = React.useState<string | null>(null)
  const [isBootstrappingWorkspace, setIsBootstrappingWorkspace] = React.useState(false)
  const hasTriedWebWorkspaceBootstrap = React.useRef(false)

  // Full search functionality
  const {
    showSearch,
    openSearch,
    closeSearch,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching
  } = useFullSearch()

  const toggleSidebar = React.useCallback((): void => {
    updateAppearanceSettings({ sidebarVisible: !appearanceSettings.sidebarVisible })
  }, [appearanceSettings.sidebarVisible, updateAppearanceSettings])

  const handleFileTreeSidebarResize = (delta: number): void => {
    const newWidth = appearanceSettings.sidebarWidth + delta
    updateAppearanceSettings({ sidebarWidth: Math.max(200, Math.min(400, newWidth)) })
  }

  const handleAISidebarResize = (delta: number): void => {
    const newWidth = aiSettings.width - delta // negative because we're resizing from the right
    updateAISettings({ width: Math.max(250, Math.min(800, newWidth)) })
  }

  React.useEffect(() => {
    if (
      import.meta.env.MODE !== 'web' ||
      currentWorkspace ||
      hasTriedWebWorkspaceBootstrap.current
    ) {
      return
    }

    let isCancelled = false

    const openConfiguredWorkspace = async (): Promise<void> => {
      hasTriedWebWorkspaceBootstrap.current = true
      setIsBootstrappingWorkspace(true)
      setWorkspaceBootstrapError(null)

      try {
        const response = await fetch('/health')
        if (!response.ok) {
          throw new Error(`Workspace health check failed with status ${response.status}`)
        }

        const health = (await response.json()) as { workspace?: string }
        if (!health.workspace) {
          throw new Error('Workspace path was not returned by /health')
        }

        if (isCancelled) {
          return
        }

        const workspaceName = health.workspace.split(/[\\/]/).filter(Boolean).pop()
        const workspace = {
          id: 'web-workspace',
          name: workspaceName || 'Workspace',
          path: health.workspace,
          lastAccessed: new Date()
        }

        if (!workspaces.some((savedWorkspace) => savedWorkspace.id === workspace.id)) {
          addWorkspace(workspace)
        }
        setCurrentWorkspace(workspace)
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to auto-open configured workspace:', error)
          setWorkspaceBootstrapError(error instanceof Error ? error.message : String(error))
        }
      } finally {
        if (!isCancelled) {
          setIsBootstrappingWorkspace(false)
        }
      }
    }

    openConfiguredWorkspace()

    return () => {
      isCancelled = true
    }
  }, [addWorkspace, currentWorkspace, setCurrentWorkspace, workspaces])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
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
  }, [openSearch, toggleTOC, toggleSourceEditor, toggleSidebar])

  if (!currentWorkspace) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to MarkMate</h2>
          {isBootstrappingWorkspace && (
            <p className="text-gray-600 mb-4">Opening configured workspace...</p>
          )}
          {workspaceBootstrapError && (
            <p className="text-red-600 mb-4 max-w-md">
              Failed to open configured workspace: {workspaceBootstrapError}
            </p>
          )}
          {!isBootstrappingWorkspace && <WorkspaceOpener />}
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
