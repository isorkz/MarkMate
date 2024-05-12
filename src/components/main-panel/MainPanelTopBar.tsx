import useStore from "../../store/MStore";
import useTreeStore from "../../store/TreeStore";
import { LayoutSplitIcon, RefreshIcon, TocIcon } from "../icons";

interface TopBarProps {
  title: string;
  changed: boolean;
};

const MainPanelTopBar = ({ title, changed }: TopBarProps) => {
  const showLeftSidebar = useStore((state) => state.showLeftSidebar);
  const toggleTocPanel = useStore((state) => state.toggleTocPanel);
  const toggleMarkdownSourceEditor = useStore((state) => state.toggleMarkdownSourceEditor);
  const rootDir = useStore((state) => state.rootDir);
  const getActiveFilePath = useStore((state) => state.getActiveFilePath);

  const initTree = useTreeStore((state) => state.initTree);

  const onRefreshFileTree = () => {
    initTree(rootDir, getActiveFilePath())
  }

  return (
    <div className={`relative flex w-full z-10 h-10 bg-gray-50 items-center px-4 border-b border-gray-200/80 select-none`}>
      {/* Leave this div to show menu icon buttons, and make the left sidebar draggable */}
      {/* If let the whole top bar draggable, the menu icon buttons cannot be clicked normally */}
      <div className={`${showLeftSidebar ? 'w-0' : 'w-32'} transition-all duration-300`}>
      </div>

      <div className='flex w-full justify-between'>
        {/* draggable part */}
        {/* flex-grow: grow to take the remaining space */}
        <div className='flex flex-grow items-center' style={{ WebkitAppRegion: 'drag' } as any}>
          <div className='text-gray-500 text-sm font-medium'>
            {title} {changed && '*'}
          </div>
        </div>

        {/* menu items part */}
        <div className='flex'>
          <button onClick={toggleMarkdownSourceEditor} className='p-2 mx-1 bg-transparent border-none hover:bg-gray-200 focus:outline-none'>
            <LayoutSplitIcon className="w-4 h-4" />
          </button>
          <button onClick={toggleTocPanel} className='p-2 mx-1 bg-transparent border-none hover:bg-gray-200 focus:outline-none'>
            <TocIcon className="w-4 h-4" />
          </button>
          <button onClick={onRefreshFileTree} className='p-2 mx-1 bg-transparent border-none hover:bg-gray-200 focus:outline-none'>
            <RefreshIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MainPanelTopBar