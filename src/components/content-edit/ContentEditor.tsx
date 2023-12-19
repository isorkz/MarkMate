import { Dispatch, SetStateAction } from 'react'
import StyledMarkdown from './StyledMarkdown';

interface ContentEditorProps {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
}

const ContentEditor = ({
  content,
  setContent,
}: ContentEditorProps) => {
  return (
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] overflow-x-auto">
        <StyledMarkdown>{content}</StyledMarkdown>
      </div>
    </div>
  )
}

export default ContentEditor