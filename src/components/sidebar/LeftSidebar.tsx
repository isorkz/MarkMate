import { Dispatch, SetStateAction } from 'react'
import FileTree from '../file-tree/FileTree'
import Settings from '../settings/Settings'

const dirPath = import.meta.env.VITE_APP_PATH

interface LeftSidebarProps {
  setContent: Dispatch<SetStateAction<string>>;
};

const LeftSidebar = ({
  setContent,
}: LeftSidebarProps) => {
  return (
    // flex-none: don't grow or shrink
    <div className="relative top-0 left-0 flex flex-none flex-col h-full w-[18rem] shadow-md bg-neutral-800 text-gray-200 overflow-hidden">
      <span className="flex-none px-4 py-2 text-lg font-medium">Left Sidebar</span>

      <FileTree dirPath={dirPath} setContent={setContent} />

      <Settings />
    </div>
  )
}

export default LeftSidebar