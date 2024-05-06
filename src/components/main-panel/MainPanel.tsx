import TabsNav from '../tabs/TabsNav';
import { EditorPanel } from '../editor/EditorPanel';
import useStore from '../../store/MStore';
import useSearchStore from '../../store/SearchStore';
import Search from '../search/Search';
import { useEffect } from 'react';

const MainPanel = () => {
  const tabs = useStore((state) => state.tabs);
  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const showSearch = useSearchStore((state) => state.showSearch);
  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  const onShowSearch = () => {
    setShowSearch(true);
  }

  // Register listerners in parent component and maintain a single instance of the listener at a higher level.
  useEffect(() => {
    // Add a listener to receive the 'search-doc' event from main process.
    window.ipcRenderer.on('search-doc', onShowSearch);
    console.log("register search-doc listener")

    // Specify how to clean up after this effect
    return () => {
      window.ipcRenderer.removeListener('search-doc', onShowSearch);
      console.log("remove search-doc listener")
    };
  }, []);

  return (
    <div className='flex flex-col w-full h-full overflow-x-hidden'>
      <TabsNav />

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