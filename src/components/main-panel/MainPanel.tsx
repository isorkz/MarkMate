import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import TabsNav from '../tabs/TabsNav';
import { EditorPanel } from '../editor/EditorPanel';
import useStore from '../../store/MStore';
import useTreeStore from '../../store/TreeStore';
import useSearchStore from '../../store/SearchStore';
import Search from '../search/Search';
import FullSearchModal from '../search/FullSearchModal';
import MainPanelTopBar from './MainPanelTopBar';
import { getTopBarTitle } from '../../utils/common';
import { slateNodesToMarkdownSource } from '../editor/slate/parser/ParseSlateNodesToMarkdownSource';

const MainPanel = () => {
  const [showFullSearchModal, setShowFullSearchModal] = useState<boolean>(false);

  // When set up the event listeners in useEffect, the value of showFullSearch in onShowFullSearch is fixed and will not change due to the feature of closure.
  // To solve this problem, use useRef to get the latest value of showFullSearch.
  const showFullSearchModalRef = useRef(showFullSearchModal);

  const updateTreeNode = useTreeStore((state) => state.updateTreeNode);

  const rootDir = useStore((state) => state.rootDir);
  const tabs = useStore((state) => state.tabs);
  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const updateSourceContent = useStore((state) => state.updateSourceContent);
  const saveTab = useStore((state) => state.saveTab);
  const toggleMarkdownSourceEditor = useStore((state) => state.toggleMarkdownSourceEditor);

  const showSearch = useSearchStore((state) => state.showSearch);
  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  // useRef: to get the current value of a variable, and it will not cause a re-render.
  // Otherwise, in onSave() triggered by the 'save-file' event, all values are the same as the initial values, they are not updated.
  const activeTabIndexRef = useRef(activeTabIndex);
  const tabsRef = useRef(tabs);

  useEffect(() => {
    activeTabIndexRef.current = activeTabIndex;
  }, [activeTabIndex]);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const onShowSearch = () => {
    setShowSearch(true);
  }

  const onShowFullSearch = () => {
    showFullSearchModalRef.current = !showFullSearchModalRef.current
    setShowFullSearchModal(showFullSearchModalRef.current);
  }

  useEffect(() => {
    showFullSearchModalRef.current = showFullSearchModal;
  }, [showFullSearchModal]);

  // Triggered by the 'save-file' event, all values should use useRef to get the latest value.
  const onSave = useCallback(() => {
    try {
      if (tabsRef.current[activeTabIndexRef.current].fileNode.path) {
        const markdownSource = slateNodesToMarkdownSource(tabsRef.current[activeTabIndexRef.current].slateNodes)
        if (!markdownSource) {
          throw new Error('markdownSource is undefined.')
        }
        updateSourceContent(markdownSource)

        const remoteRepo = import.meta.env.VITE_APP_GIT_REMOTE_REPO;
        window.api.saveFile(tabsRef.current[activeTabIndexRef.current].fileNode.path, markdownSource, rootDir, remoteRepo).then(() => {
          saveTab();
          updateTreeNode(tabsRef.current[activeTabIndexRef.current].fileNode.id, { lastModifiedTime: new Date() });

          // Sync to the remote repository
          window.api.gitSync(rootDir, remoteRepo).then(() => {
            console.log('git sync success')
          }).catch((error: any) => {
            console.error('git sync error: ', error)
            toast.error('Failed to sync up the remote repository: ', error);
          })
        }).catch((error: any) => {
          console.error('failed to save file: ', error)
          toast.error(`Failed to save file ${tabsRef.current[activeTabIndexRef.current].fileNode.path}. ${error}`);
        })
      } else {
        throw new Error('filePath is empty.')
      }
    }
    catch (error) {
      console.error('Failed to save file: ', error)
      toast.error(`Failed to save file ${tabsRef.current[activeTabIndexRef.current].fileNode.path}. ${error}`);
    }
  }, [tabsRef, activeTabIndexRef])

  const getTopbarTitle = (): string => {
    if (rootDir && tabs.length > 0) {
      const filePath = tabs[activeTabIndex].fileNode.path;
      if (filePath !== '') {
        return getTopBarTitle(rootDir, filePath);
      }
      else {
        return 'Untitled'
      }
    }
    return ''
  }

  // Register listerners in parent component and maintain a single instance of the listener at a higher level.
  useEffect(() => {
    // Add a listener to receive the event from main process.
    window.ipcRenderer.on('save-file', onSave)
    window.ipcRenderer.on('search-doc', onShowSearch);
    window.ipcRenderer.on('full-search', onShowFullSearch);
    window.ipcRenderer.on('toggle-source-editor', toggleMarkdownSourceEditor);

    // Specify how to clean up after this effect
    return () => {
      // use removeAllListeners to remove the listener rather than removeListener, because in development mode, still have multiple listeners when changing the code and re-rendering the component.
      window.ipcRenderer.removeAllListeners('save-file')
      window.ipcRenderer.removeAllListeners('search-doc');
      window.ipcRenderer.removeAllListeners('full-search');
      window.ipcRenderer.removeAllListeners('toggle-source-editor');
    };
  }, []);

  return (
    <div className='flex flex-col w-full h-full overflow-x-hidden'>
      <MainPanelTopBar title={getTopbarTitle()} changed={tabs[activeTabIndex].changed} lastModifiedTime={tabs[activeTabIndex].fileNode.lastModifiedTime} />

      <div className='relative'>
        <TabsNav />

        {showSearch && <Search activeEditor={tabs[activeTabIndex]} />}
      </div>

      {showFullSearchModal && <FullSearchModal showFullSearchModal={showFullSearchModal} setShowFullSearchModal={setShowFullSearchModal} />}

      <>
        {tabs.map((tab, index) => (
          <div key={tab.id} className={`flex w-full h-full overflow-x-hidden ${activeTabIndex === index ? '' : 'hidden'}`}>
            {/* NOTE: must use the 'key' prop to make sure the component is re-rendered when the tab is changed. 
            And do NOT use index as key! Otherwise, when remove a tab, the content of the tab will be mixed up. */}
            <EditorPanel tab={tab} tabIndex={index} key={tab.id} />
          </div>
        ))}
      </>
    </div>
  )
}

export default MainPanel