import { useEffect } from 'react';
import { nanoid } from 'nanoid'
import './App.css'
import MainPanel from './components/main-panel/MainPanel'
import LeftSidebar from './components/sidebar/LeftSidebar'
import { Toaster } from 'react-hot-toast';
import useStore from './store/MStore';
import { FileTreeNode } from './models/FileTree';

function App() {
  const newTab = useStore((state) => state.newTab);

  const onNewEmptyTab = () => {
    const newNode: FileTreeNode = {
      id: nanoid(),
      name: '',
      path: '',  // temporary path, should be updated with file name
      type: 'file',
      index: 1, // temporary index
      lastModifiedTime: new Date(),
    }
    newTab(newNode, '');
  }

  useEffect(() => {
    // Add a listener to receive the 'new-tab' event from main process.
    window.ipcRenderer.on('new-tab', onNewEmptyTab)

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
    </div>
  )
}

export default App
