import FileTree from '../file-tree/FileTree'
import Settings from '../settings/Settings'
import LeftSideTopBar from './LeftSideTopBar'

const LeftSidebar = () => {
  return (
    // flex-none: don't grow or shrink
    <div className="relative top-0 left-0 flex flex-none flex-col h-full w-[18rem] shadow-md bg-neutral-800 text-gray-200 overflow-hidden">
      <LeftSideTopBar />

      <FileTree />

      <Settings />
    </div>
  )
}

export default LeftSidebar