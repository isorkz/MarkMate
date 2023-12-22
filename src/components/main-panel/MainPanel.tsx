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
    <div className="flex flex-col w-full h-full overflow-x-hidden">
      <ContentEditor sourceContent={content} setSourceContent={setContent} />
    </div>
  )
}

export default MainPanel