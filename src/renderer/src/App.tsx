import AppLayout from './components/layout/AppLayout'
import SettingsModal from './components/settings/SettingsModal'
import { Toaster } from 'react-hot-toast'
import { useMenuHandlers } from './hooks/useMenuHandlers'
import { useFileWatcher } from './hooks/useFileWatcher'
import './assets/globals.css'

function App(): React.JSX.Element {
  // Initialize menu handlers
  useMenuHandlers()
  
  // Initialize file watcher
  useFileWatcher()

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
