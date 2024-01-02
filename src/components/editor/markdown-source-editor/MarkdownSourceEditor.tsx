import { Dispatch, SetStateAction } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

interface ContentEditorProps {
  mdSourceContent: string;
  setMdSourceContent: Dispatch<SetStateAction<string>>;
}

const MarkdownSourceEditor = ({
  mdSourceContent,
  setMdSourceContent,
}: ContentEditorProps) => {
  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] mb-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          <CodeMirror value={mdSourceContent} extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]} onChange={setMdSourceContent} />
        </div>
      </div>
    </div>
  )
}

export default MarkdownSourceEditor