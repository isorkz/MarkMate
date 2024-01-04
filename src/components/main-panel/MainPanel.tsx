import { useState } from 'react'
import ContentEditor from '../editor/ContentEditor'
import MarkdownSourceEditor from '../editor/markdown-source-editor/MarkdownSourceEditor';

const MainPanel = () => {
  const [showMarkdownSourceEditor, setShowMarkdownSourceEditor] = useState<boolean>(true);

  return (
    <div className="flex w-full h-full overflow-x-hidden">
      {showMarkdownSourceEditor && (
        <div className="flex w-1/2 h-full">
          <MarkdownSourceEditor />
          <div className="border-r-2 border-gray-200"></div>
        </div>
      )}
      <ContentEditor />
    </div>
  )
}

export default MainPanel