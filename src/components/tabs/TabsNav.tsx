import useStore from '../../store/MStore';
import useSearchStore from '../../store/SearchStore';
import { CloseIcon } from '../icons';

interface TabButtonProps {
  title: string;
  tabIndex: number;
  tabId: string;
};

const TabButton = ({
  title,
  tabIndex,
  tabId
}: TabButtonProps) => {
  const activeTabId = useStore((state) => state.activeTabId);
  const tabs = useStore((state) => state.tabs);
  const setActiveTabId = useStore((state) => state.setActiveTabId);
  const removeTab = useStore((state) => state.removeTab);

  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  const onClickTab = () => {
    setActiveTabId(tabId)
    setShowSearch(false)
  }

  const onCloseTab = () => {
    removeTab(tabId)
  }

  return (
    // relative: to make the close button be absolute to the parent
    <div className={'relative z-10 flex flex-row w-full items-center select-none'}>
      <div
        onClick={onClickTab}
        className={`flex w-full h-8 justify-center items-center rounded-none border-r border-gray-200/80 ${activeTabId == tabId ? 'bg-white' : 'bg-gray-50'}`}>
        <span>{title} {tabs[tabIndex].changed && '*'}</span>
      </div>

      {/* Close tab button */}
      <div className='flex absolute right-1'>
        <button
          onClick={onCloseTab}
          className={`rounded-md p-[2px] mx-[0.5] my-2 text-neutral-400 focus:outline-none border-none dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600 ${activeTabId == tabId ? 'bg-white' : 'bg-gray-50'}`}>
          <CloseIcon className='w-5 h-5' />
        </button>
      </div>
    </div>
  )
}

const getFileName = (filePath: string | undefined) => {
  if (filePath === undefined) return 'Untitled'

  const parts = filePath.split('/')
  return parts[parts.length - 1]
}

const TabsNav = () => {
  const tabs = useStore((state) => state.tabs);

  return (
    // if tabs.length > 1, show this tabs nav
    tabs.length > 1 && (
      <div className="flex h-8 justify-center items-center border border-gray-200 bg-gray-50">
        {tabs.map((tab, index) => (
          <TabButton key={tab.id} title={getFileName(tab.filePath)} tabIndex={index} tabId={tab.id} />
        ))}
      </div>
    )
  )
}

export default TabsNav
