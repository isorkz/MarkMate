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
    <main className="relative top-0 left-0 flex flex-none flex-col h-full">
      <span className="flex-none px-4 py-2 text-lg font-medium">Main Panel</span>

      <ContentEditor content={content} setContent={setContent} />
    </main>
  )
}

export default MainPanel