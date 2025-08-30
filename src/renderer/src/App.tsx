import { useEffect } from 'react'
import AppLayout from './components/layout/AppLayout'
import SettingsModal from './components/settings/SettingsModal'
import { Toaster } from 'react-hot-toast'
import { useMenuHandlers } from './hooks/useMenuHandlers'
import { useFileWatcher } from './hooks/useFileWatcher'
import { useWorkspaceStore } from './stores/workspaceStore'
import { loadAIConfigFromFile, loadChatSessions } from './utils/aiPersistHelper'
import './assets/globals.css'

function App(): React.JSX.Element {
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace)

  // Initialize menu handlers
  useMenuHandlers()

  // Initialize file watcher
  useFileWatcher()

  // Initialize AI config and sessions when workspace is available
  useEffect(() => {
    if (currentWorkspace?.path) {
      loadAIConfigFromFile()
      loadChatSessions()
    }
  }, [currentWorkspace?.path])

  return (
    <>
      <AppLayout />
      <SettingsModal />
      <Toaster
        position="top-right"
        toastOptions={{
          // duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

export default App
