import useStore from "../../store/MStore";
import { TocIcon } from "../icons";

interface TopBarProps {
  title: string;
};

const MainPanelTopBar = ({ title }: TopBarProps) => {
  const showLeftSidebar = useStore((state) => state.showLeftSidebar);
  const toggleTocPanel = useStore((state) => state.toggleTocPanel);

  return (
    <div className={`relative flex w-full z-10 h-10 bg-gray-50 items-center px-4 border-b border-gray-200/80 select-none`}>
      {/* Leave this div to show menu icon buttons, and make the left sidebar draggable */}
      {/* If let the whole top bar draggable, the menu icon buttons cannot be clicked normally */}
      <div className={`${showLeftSidebar ? 'w-0' : 'w-32'} transition-all duration-300`}>
      </div>

      {/* WebkitAppRegion: 'drag' -> to make the top bar draggable */}
      <div className='w-full' style={{ WebkitAppRegion: 'drag' } as any}>
        <div className='text-gray-500 text-sm font-medium'>{title}</div>
      </div>

      <div className='flex w-10'>
        <button onClick={toggleTocPanel} className='absolute top-0 h-9 p-2 bg-transparent border-none hover:bg-gray-200 focus:outline-none'>
          <TocIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default MainPanelTopBar