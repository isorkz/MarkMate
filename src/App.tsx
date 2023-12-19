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
    // While 'h-full', 'w-full' is same as 'height: 100%; width: 100%', it means the height and width is 100% of the parent element.
    // grid: The sidebar to be fixed width, and the main panel to be flexible width.
    <div className="grid grid-cols-3 h-screen w-screen bg-white overflow-x-hidden" style={{ gridTemplateColumns: "18rem auto 18rem" }}>

      {/* Left sidebar */}
      <LeftSidebar setContent={setContent} />

      {/* Main panel */}
      <MainPanel content={content} setContent={setContent} />

      {/* Right sidebar */}
      <RightSidebar />
    </div>
  )
}

export default App
