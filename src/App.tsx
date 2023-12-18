import { useState } from 'react';
import './App.css'
import MainPanel from './components/main-panel/MainPanel'
import LeftSidebar from './components/sidebar/LeftSidebar'
import RightSidebar from './components/sidebar/RightSidebar'

function App() {
  const [content, setContent] = useState('');

  return (
    // 'h-screen', 'w-screen' is to make the page full screen
    // In CSS, it is same as 'height: 100vh; width: 100vw'
    // While 'h-full', 'w-full' is same as 'height: 100%; width: 100%', it means the height and width is 100% of the parent element
    <div className="flex h-screen w-screen bg-white">

      {/* Left sidebar */}
      <LeftSidebar setContent={setContent} />

      {/* Main panel */}
      {/* 'flex-1': to allow a flex item to grow and shrink as needed, then it will push the right sidebar to the right */}
      <div className="flex-1">
        <MainPanel content={content} setContent={setContent} />
      </div>

      {/* Right sidebar */}
      <RightSidebar />
    </div>
  )
}

export default App
