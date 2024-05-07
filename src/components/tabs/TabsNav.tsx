import useStore from '../../store/MStore';
import useSearchStore from '../../store/SearchStore';
import { CloseIcon } from '../icons';

interface TabButtonProps {
  title: string;
  index: number;
};

const TabButton = ({
  title,
  index,
}: TabButtonProps) => {
  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const tabs = useStore((state) => state.tabs);
  const setActiveTabIndex = useStore((state) => state.setActiveTabIndex);
  const removeTab = useStore((state) => state.removeTab);

  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  const onClickTab = () => {
    setActiveTabIndex(index)
    setShowSearch(false)
  }

  const onCloseTab = () => {
    removeTab(index)
  }

  return (
    // relative: to make the close button be absolute to the parent
    <div className={`relative z-10 flex flex-row w-full justify-between items-center`}>
      <button
        onClick={onClickTab}
        className={`w-full rounded-none border-x border-y-0 border-gray-200/70 ${activeTabIndex == index ? 'bg-white' : 'bg-gray-100'}`}>
        <span>{title} {tabs[index].changed && '*'}</span>
      </button>

      {/* Close tab button */}
      <div className='flex absolute right-1'>
        <button
          onClick={onCloseTab}
          className={`rounded-md px-1 py-1 mx-[0.5] my-2 text-neutral-400  dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600 ${activeTabIndex == index ? 'bg-white' : 'bg-gray-100'}`} role="menuitem">
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
          <TabButton key={index} title={getFileName(tab.filePath)} index={index} />
        ))}
      </div>
    )
  )
}

export default TabsNav
