import { Dispatch, SetStateAction } from 'react'
import ContentEditor from '../content-edit/ContentEditor'

interface MainPanelProps {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
}

const MainPanel = ({
  content,
  setContent,
}: MainPanelProps) => {
  return (
    <div className="flex flex-col h-full">
      <ContentEditor content={content} setContent={setContent} />
    </div>
  )
}

export default MainPanel