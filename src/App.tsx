import { useEffect } from 'react';
import './App.css'
import MainPanel from './components/main-panel/MainPanel'
import LeftSidebar from './components/sidebar/LeftSidebar'
import RightSidebar from './components/sidebar/RightSidebar'
import { Toaster } from 'react-hot-toast';
import useStore from './store/MStore';

function App() {
  const newEmptyTab = useStore((state) => state.newEmptyTab);

  const onNewTab = () => {
    newEmptyTab();
  }

  useEffect(() => {
    // Add a listener to receive the 'new-tab' event from main process.
    window.ipcRenderer.on('new-tab', onNewTab)

    // Specify how to clean up after this effect
    return () => {
      window.ipcRenderer.removeAllListeners('new-tab')
    }
  }, [])

  return (
    // 'h-screen', 'w-screen' is to make the page full screen
    // In CSS, it is same as 'height: 100vh; width: 100vw'
    // While 'h-full', 'w-full' is same as 'height: 100%; width: 100%', it means the height and width is 100% of the parent element.
    <div className={`flex h-screen w-screen bg-white overflow-x-hidden`}>
      <Toaster />

      {/* Left sidebar */}
      <LeftSidebar />

      {/* Main panel */}
      <MainPanel />

      {/* Right sidebar */}
      {/* <RightSidebar /> */}
    </div>
  )
}

export default App
