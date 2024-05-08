import useStore from '../../store/MStore';
import FileTree from '../file-tree/FileTree'
import Settings from '../settings/Settings'
import LeftSideTopBar from './LeftSideTopBar'

const LeftSidebar = () => {
  const showLeftSidebar = useStore((state) => state.showLeftSidebar);

  return (
    // flex-none: don't grow or shrink
    // transition-all, duration-300: 用于在元素的属性更改时应用过渡动画
    // Use 'w-0' to hide the left sidebar instead of 'hidden', to have a smooth transition effect.
    <div className={`relative top-0 left-0 flex flex-none flex-col h-full shadow-md bg-neutral-800 text-gray-200 overflow-hidden transition-all duration-300 ${showLeftSidebar ? "w-[18rem]" : "w-0"}`}>
      <LeftSideTopBar />

      <FileTree />

      <Settings />
    </div>
  )
}

export default LeftSidebar