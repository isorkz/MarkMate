import TabsNav from '../tabs/TabsNav';
import { EditorPanel } from '../editor/EditorPanel';
import useStore from '../../store/MStore';
import useSearchStore from '../../store/SearchStore';
import Search from '../search/Search';
import { useEffect, useRef, useState } from 'react';
import FullSearchModal from '../search/FullSearchModal';
import MainPanelTopBar from './MainPanelTopBar';
import { getTopBarTitle } from '../../utils/common';
import { toast } from 'react-hot-toast';
import { slateNodesToMarkdownSource } from '../editor/slate/parser/ParseSlateNodesToMarkdownSource';

const MainPanel = () => {
  const [showFullSearchModal, setShowFullSearchModal] = useState<boolean>(false);

  // When set up the event listeners in useEffect, the value of showFullSearch in onShowFullSearch is fixed and will not change due to the feature of closure.
  // To solve this problem, use useRef to get the latest value of showFullSearch.
  const showFullSearchModalRef = useRef(showFullSearchModal);

  const rootDir = useStore((state) => state.rootDir);
  const tabs = useStore((state) => state.tabs);
  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const updateSourceContent = useStore((state) => state.updateSourceContent);
  const saveTab = useStore((state) => state.saveTab);

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
  const onSave = () => {
    try {
      console.log('save file: ', tabsRef.current[activeTabIndexRef.current].filePath)
      if (tabsRef.current[activeTabIndexRef.current].filePath) {
        const markdownSource = slateNodesToMarkdownSource(tabsRef.current[activeTabIndexRef.current].slateNodes)
        updateSourceContent(markdownSource)
        window.api.saveFile(tabsRef.current[activeTabIndexRef.current].filePath, markdownSource).then(() => {
          saveTab();
        })
      } else {
        throw new Error('filePath is empty.')
      }
    }
    catch (error) {
      console.error('failed to save file: ', error)
      toast.error(`Failed to save file ${tabsRef.current[activeTabIndexRef.current].filePath}. ${error}`);
    }
  }

  const getTopbarTitle = (): string => {
    if (rootDir && tabs.length > 0) {
      const filePath = tabs[activeTabIndex].filePath;
      if (filePath) {
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
    console.log("register search listener")

    // Specify how to clean up after this effect
    return () => {
      window.ipcRenderer.removeListener('save-file', onSave)
      window.ipcRenderer.removeListener('search-doc', onShowSearch);
      window.ipcRenderer.removeListener('full-search', onShowSearch);
      console.log("remove search listener")
    };
  }, []);

  return (
    <div className='flex flex-col w-full h-full overflow-x-hidden'>
      <MainPanelTopBar title={getTopbarTitle()} />

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