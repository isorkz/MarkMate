import { Dispatch, SetStateAction, useState } from 'react'
import ContentEditor from '../editor/ContentEditor'
import MarkdownSourceEditor from '../editor/markdown-source-editor/MarkdownSourceEditor';

interface MainPanelProps {
  mdSourceContent: string;
  setMdSourceContent: Dispatch<SetStateAction<string>>;
}

const MainPanel = ({
  mdSourceContent,
  setMdSourceContent,
}: MainPanelProps) => {
  const [showMarkdownSourceEditor, setShowMarkdownSourceEditor] = useState<boolean>(true);

  return (
    <div className="flex w-full h-full overflow-x-hidden">
      {showMarkdownSourceEditor && (
        <div className="flex w-full h-full">
          <MarkdownSourceEditor mdSourceContent={mdSourceContent} setMdSourceContent={setMdSourceContent} />
          <div className="border-r-2 border-gray-200"></div>
        </div>
      )}
      <ContentEditor mdSourceContent={mdSourceContent} setMdSourceContent={setMdSourceContent} />
    </div>
  )
}

export default MainPanel