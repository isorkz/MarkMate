import { useEffect } from 'react';
import { nanoid } from 'nanoid'
import './App.css'
import MainPanel from './components/main-panel/MainPanel'
import LeftSidebar from './components/sidebar/LeftSidebar'
import { Toaster } from 'react-hot-toast';
import useStore from './store/MStore';
import { FileTreeNode } from './models/FileTree';
import useTreeStore from './store/TreeStore';

function App() {
  const newTab = useStore((state) => state.newTab);
  const fileTree = useTreeStore((state) => state.fileTree);

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

  const onCloseCurrentTab = () => {
    // TODO: close the current tab with confirmation
  }

  const onShowDebugInfo = () => {
    console.log('fileTree: ', fileTree)
    const currentEditor = useStore.getState().tabs[useStore.getState().activeTabIndex];
    if (currentEditor) {
      console.log('slateNodes: ', currentEditor.slateNodes);
    }
  }

  useEffect(() => {
    // Add a listener to receive the 'new-tab' event from main process.
    window.ipcRenderer.on('new-tab', onNewEmptyTab)
    window.ipcRenderer.on('close-tab', onCloseCurrentTab)
    window.ipcRenderer.on('show-debug-info', onShowDebugInfo)

    // Specify how to clean up after this effect
    return () => {
      window.ipcRenderer.removeAllListeners('new-tab')
      window.ipcRenderer.removeAllListeners('close-tab')
      window.ipcRenderer.removeAllListeners('show-debug-info')
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
