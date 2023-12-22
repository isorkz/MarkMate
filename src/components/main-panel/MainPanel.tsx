import { Dispatch, SetStateAction } from 'react'
import ContentEditor from '../editor/ContentEditor'

interface MainPanelProps {
  mdSourceContent: string;
  setMdSourceContent: Dispatch<SetStateAction<string>>;
}

const MainPanel = ({
  mdSourceContent,
  setMdSourceContent,
}: MainPanelProps) => {
  return (
    <div className="flex flex-col w-full h-full overflow-x-hidden">
      <ContentEditor mdSourceContent={mdSourceContent} setMdSourceContent={setMdSourceContent} />
    </div>
  )
}

export default MainPanel