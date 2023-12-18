import React from 'react'

const Settings = () => {
  // Settings is at the bottom of the page, because the FileTree is flex-grow, it will push the settings to the bottom.
  return (
    // z-10: to make sure the settings is on top of other elements
    <div className='w-full border-t-gray-500 border-t-[1px]'>
      <button className='bg-transparent hover:bg-neutral-700/70 w-full h-[2.5rem]' >
        Settings
      </button>
    </div>
  )
}

export default Settings