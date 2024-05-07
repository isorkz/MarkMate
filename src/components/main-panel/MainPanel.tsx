import TabsNav from '../tabs/TabsNav';
import { EditorPanel } from '../editor/EditorPanel';
import useStore from '../../store/MStore';
import useSearchStore from '../../store/SearchStore';
import Search from '../search/Search';
import { useEffect, useRef, useState } from 'react';
import FullSearch from '../search/FullSearch';

const MainPanel = () => {
  const [showFullSearch, setShowFullSearch] = useState<boolean>(false);

  // When set up the event listeners in useEffect, the value of showFullSearch in onShowFullSearch is fixed and will not change due to the feature of closure.
  // To solve this problem, use useRef to get the latest value of showFullSearch.
  const showFullSearchRef = useRef(showFullSearch);

  const tabs = useStore((state) => state.tabs);
  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const showSearch = useSearchStore((state) => state.showSearch);
  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  const onShowSearch = () => {
    setShowSearch(true);
  }

  const onShowFullSearch = () => {
    console.log("onShowFullSearch: ", showFullSearchRef.current)
    showFullSearchRef.current = !showFullSearchRef.current
    setShowFullSearch(showFullSearchRef.current);
  }

  useEffect(() => {
    showFullSearchRef.current = showFullSearch;
  }, [showFullSearch]);

  // Register listerners in parent component and maintain a single instance of the listener at a higher level.
  useEffect(() => {
    // Add a listener to receive the 'search-doc' event from main process.
    window.ipcRenderer.on('search-doc', onShowSearch);
    window.ipcRenderer.on('full-search', onShowFullSearch);
    console.log("register search listener")

    // Specify how to clean up after this effect
    return () => {
      window.ipcRenderer.removeListener('search-doc', onShowSearch);
      window.ipcRenderer.removeListener('full-search', onShowSearch);
      console.log("remove search listener")
    };
  }, []);

  return (
    <div className='flex flex-col relative w-full h-full overflow-x-hidden'>
      <TabsNav />

      {showFullSearch && <FullSearch setShowFullSearch={setShowFullSearch} />}

      {showSearch && <Search activeEditor={tabs[activeTabIndex]} />}

      <>
        {tabs.map((tab, index) => (
          <div key={index} className={`flex w-full h-full overflow-x-hidden ${activeTabIndex === index ? '' : 'hidden'}`}>
            {/* NOTE: must use the 'key' prop to make sure the component is re-rendered when the tab is changed. 
            Otherwise, the content of the tab will be mixed up. */}
            <EditorPanel tab={tab} tabIndex={index} key={index} />
          </div>
        ))}
      </>
    </div>
  )
}

export default MainPanel