import { Dispatch, SetStateAction } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import StyledMarkdown from './StyledMarkdown';

interface ContentEditorProps {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
}

const ContentEditor = ({
  content,
  setContent,
}: ContentEditorProps) => {
  const onChange = (value: string) => {
    setContent(value)
  }

  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          <CodeMirror value={content} extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]} onChange={onChange} />
          {/* <StyledMarkdown>{content}</StyledMarkdown> */}
        </div>
      </div>
    </div>
  )
}

export default ContentEditor