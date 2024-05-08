import useStore from '../../store/MStore';
import { CollapseLeftIcon } from '../icons'

const LeftSideTopBar = () => {
  const showLeftSidebar = useStore((state) => state.showLeftSidebar);
  const toggleLeftSidebar = useStore((state) => state.toggleLeftSidebar);

  return (
    <div className={`fixed top-0 z-20 h-10 ${showLeftSidebar ? 'w-[18rem] left-0' : 'left-20 text-neutral-800'}`}>
      <div className="flex w-full items-center">
        <button onClick={toggleLeftSidebar} className={`absolute top-1 p-2 bg-transparent border-none ${showLeftSidebar ? 'hover:bg-gray-700 right-2' : 'hover:bg-gray-200 '} focus:outline-none`}>
          <CollapseLeftIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default LeftSideTopBar