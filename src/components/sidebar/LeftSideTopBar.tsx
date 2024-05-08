import { CollapseLeftIcon } from '../icons'

const LeftSideTopBar = () => {
  return (
    <div className="fixed w-[18rem] left-0 top-0 z-10 h-10 bg-red">
      <div className="flex w-full items-center">
        <button onClick={() => console.log('collpse')} className="absolute top-1 right-2 p-2 bg-transparent border-none hover:bg-gray-700 focus:outline-none">
          <CollapseLeftIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default LeftSideTopBar